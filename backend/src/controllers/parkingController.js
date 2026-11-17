const { query } = require('../config/database');
const { generateBookingId, toSqlDateTime } = require('../utils/helpers');
const { generateQRCode } = require('../services/qrService');
const { broadcastSlotUpdate, sendUserNotification } = require('../services/socketService');
const { logAudit } = require('../middleware/auditLogger');

/**
 * Get all parking areas with calculated slot stats
 */
async function getAreas(req, res) {
  try {
    const areas = await query('SELECT * FROM parking_areas WHERE is_active = 1 ORDER BY id ASC');

    const result = [];
    for (const a of areas) {
      const slotStats = await query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
           SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
           SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
           SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) as unavailable
         FROM parking_slots
         WHERE area_id = ? AND is_active = 1`,
        [a.id]
      );

      const stats = slotStats[0] || {};
      const total = stats.total || 0;
      const occupied = stats.occupied || 0;
      const reserved = stats.reserved || 0;
      const utilization = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

      result.push({
        ...a,
        total_slots: total,
        available_slots: stats.available || 0,
        occupied_slots: occupied,
        reserved_slots: reserved,
        unavailable_slots: stats.unavailable || 0,
        utilization_rate: utilization
      });
    }

    return res.status(200).json({ success: true, areas: result });
  } catch (err) {
    console.error('getAreas error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch parking areas.' });
  }
}

/**
 * Get parking slots with filter support
 */
async function getSlots(req, res) {
  try {
    const { area_id, status, slot_type } = req.query;

    let sql = `
      SELECT s.*, a.name as area_name, a.code as area_code, a.floor as area_floor
      FROM parking_slots s
      JOIN parking_areas a ON s.area_id = a.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (area_id) {
      sql += ' AND s.area_id = ?';
      params.push(area_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (slot_type) {
      sql += ' AND s.slot_type = ?';
      params.push(slot_type);
    }

    sql += ' ORDER BY s.area_id ASC, s.slot_number ASC';

    const slots = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: slots.length,
      slots
    });
  } catch (err) {
    console.error('getSlots error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve parking slots.' });
  }
}

/**
 * Get aggregated parking availability
 */
async function getAvailability(req, res) {
  try {
    const counts = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
        SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) as unavailable
      FROM parking_slots
      WHERE is_active = 1
    `);

    const stats = counts[0] || {};
    const total = stats.total || 0;
    const occupied = stats.occupied || 0;
    const reserved = stats.reserved || 0;
    const utilization = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        total_slots: total,
        available_slots: stats.available || 0,
        occupied_slots: occupied,
        reserved_slots: reserved,
        unavailable_slots: stats.unavailable || 0,
        utilization_rate: utilization,
        last_updated: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('getAvailability error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve availability.' });
  }
}

/**
 * Reserve a parking slot
 * Implements atomic double-booking prevention & concurrency check
 */
async function createBooking(req, res) {
  try {
    const userId = req.user.id;
    const { slot_id, vehicle_id, start_time, end_time, booking_notes } = req.body;

    if (!slot_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Slot selection, start time, and end time are required.'
      });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date or time format provided.'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after the start time.'
      });
    }

    // 1. Check if the slot exists and is active
    const slotRows = await query(
      `SELECT s.*, a.name as area_name, a.code as area_code
       FROM parking_slots s
       JOIN parking_areas a ON s.area_id = a.id
       WHERE s.id = ? AND s.is_active = 1`,
      [slot_id]
    );

    if (slotRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Selected parking slot does not exist or is inactive.'
      });
    }

    const slot = slotRows[0];

    // Check if slot status is available
    if (slot.status !== 'available') {
      return res.status(409).json({
        success: false,
        message: `Slot ${slot.slot_number} is currently ${slot.status} and cannot be reserved.`
      });
    }

    // 2. Strict Concurrency Check: Check for overlapping active bookings on this slot
    const sqlStart = toSqlDateTime(startDate);
    const sqlEnd = toSqlDateTime(endDate);

    const conflictingBookings = await query(
      `SELECT id, booking_id, start_time, end_time, status
       FROM bookings
       WHERE slot_id = ?
         AND status IN ('confirmed', 'active')
         AND NOT (end_time <= ? OR start_time >= ?)`,
      [slot_id, sqlStart, sqlEnd]
    );

    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Reservation conflict: Slot ${slot.slot_number} is already booked during this timeframe.`
      });
    }

    // 3. Resolve vehicle ID
    let finalVehicleId = vehicle_id || null;
    if (!finalVehicleId) {
      const primaryVeh = await query('SELECT id FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC LIMIT 1', [userId]);
      if (primaryVeh.length > 0) {
        finalVehicleId = primaryVeh[0].id;
      }
    }

    // 4. Generate unique Booking ID & QR code
    const bookingId = generateBookingId();
    const qrPayload = {
      bookingId,
      slotNumber: slot.slot_number,
      slotId: slot.id,
      areaCode: slot.area_code,
      facultyId: req.user.faculty_id,
      userId,
      startTime: sqlStart,
      endTime: sqlEnd,
      issuedAt: new Date().toISOString()
    };

    const qrImage = await generateQRCode(qrPayload);

    // 5. Insert Booking
    const insertBookingRes = await query(
      `INSERT INTO bookings (booking_id, user_id, slot_id, vehicle_id, start_time, end_time, status, qr_code_data, qr_code_image, booking_type)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, 'self_service')`,
      [
        bookingId,
        userId,
        slot_id,
        finalVehicleId,
        sqlStart,
        sqlEnd,
        JSON.stringify(qrPayload),
        qrImage
      ]
    );

    const newBookingDbId = insertBookingRes.insertId;

    // 6. Update Slot Status to 'reserved'
    await query(
      `UPDATE parking_slots
       SET status = 'reserved', last_status_change = NOW()
       WHERE id = ?`,
      [slot_id]
    );

    // 7. Dispatch In-App Notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Booking Confirmed!', ?, 'success', ?)`,
      [
        userId,
        `Slot ${slot.slot_number} (${slot.area_name}) has been reserved. Booking ID: ${bookingId}.`,
        `/my-bookings`
      ]
    );

    // 8. Log Audit
    await logAudit({
      userId,
      role: req.user.role,
      name: req.user.full_name,
      action: 'BOOKING_CREATED',
      recordId: bookingId,
      details: { slot_id, slot_number: slot.slot_number, start_time: sqlStart, end_time: sqlEnd },
      req
    });

    // 9. Real-Time Socket Broadcast
    broadcastSlotUpdate({
      slotId: slot.id,
      slotNumber: slot.slot_number,
      areaId: slot.area_id,
      areaCode: slot.area_code,
      status: 'reserved',
      updatedAt: new Date().toISOString()
    });

    sendUserNotification(userId, {
      title: 'Booking Confirmed',
      message: `Your booking for slot ${slot.slot_number} is confirmed.`,
      bookingId
    });

    return res.status(201).json({
      success: true,
      message: 'Parking slot reserved successfully!',
      booking: {
        id: newBookingDbId,
        booking_id: bookingId,
        slot_id,
        slot_number: slot.slot_number,
        area_name: slot.area_name,
        area_code: slot.area_code,
        start_time: sqlStart,
        end_time: sqlEnd,
        status: 'confirmed',
        qr_code_image: qrImage
      }
    });
  } catch (err) {
    console.error('createBooking error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete parking reservation. Please try again.'
    });
  }
}

/**
 * Get user bookings (or all if admin)
 */
async function getUserBookings(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { status, limit } = req.query;

    let sql = `
      SELECT b.*,
             s.slot_number, s.slot_type,
             a.name as area_name, a.code as area_code, a.floor as area_floor,
             u.full_name as faculty_name, u.faculty_id, u.email as faculty_email,
             v.vehicle_number, v.vehicle_model,
             ps.id as session_id, ps.entry_time, ps.exit_time, ps.status as session_status
      FROM bookings b
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN parking_areas a ON s.area_id = a.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN parking_sessions ps ON ps.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin) {
      sql += ' AND b.user_id = ?';
      params.push(userId);
    }

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.id DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    const bookings = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (err) {
    console.error('getUserBookings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
}

/**
 * Get single booking by ID
 */
async function getBookingById(req, res) {
  try {
    const bookingIdentifier = req.params.id; // could be numeric ID or booking_id string
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const bookings = await query(
      `SELECT b.*,
              s.slot_number, s.slot_type, s.status as slot_status,
              a.name as area_name, a.code as area_code, a.floor as area_floor,
              u.full_name as faculty_name, u.faculty_id, u.phone as faculty_phone, u.department,
              v.vehicle_number, v.vehicle_model,
              ps.id as session_id, ps.entry_time, ps.exit_time, ps.status as session_status
       FROM bookings b
       JOIN parking_slots s ON b.slot_id = s.id
       JOIN parking_areas a ON s.area_id = a.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN parking_sessions ps ON ps.booking_id = b.id
       WHERE (b.id = ? OR b.booking_id = ?)`,
      [bookingIdentifier, bookingIdentifier]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Check permissions
    if (!isAdmin && booking.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
    }

    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error('getBookingById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking.' });
  }
}

/**
 * Cancel an existing reservation
 */
async function cancelBooking(req, res) {
  try {
    const bookingIdentifier = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { reason } = req.body;

    const bookings = await query(
      `SELECT b.*, s.slot_number, s.area_id, a.code as area_code
       FROM bookings b
       JOIN parking_slots s ON b.slot_id = s.id
       JOIN parking_areas a ON s.area_id = a.id
       WHERE (b.id = ? OR b.booking_id = ?)`,
      [bookingIdentifier, bookingIdentifier]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Check permissions
    if (!isAdmin && booking.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    // Only allow cancelling if status is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'.`
      });
    }

    // Mark booking cancelled
    await query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = ?
       WHERE id = ?`,
      [reason || 'Cancelled by user', booking.id]
    );

    // Free the slot back to 'available'
    await query(
      `UPDATE parking_slots
       SET status = 'available', last_status_change = NOW()
       WHERE id = ?`,
      [booking.slot_id]
    );

    // In-app notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Booking Cancelled', ?, 'info')`,
      [booking.user_id, `Reservation for slot ${booking.slot_number} (ID: ${booking.booking_id}) has been cancelled.`]
    );

    // Log audit
    await logAudit({
      userId,
      role: req.user.role,
      name: req.user.full_name,
      action: 'BOOKING_CANCELLED',
      recordId: booking.booking_id,
      details: { slot_id: booking.slot_id, reason: reason || 'User cancellation' },
      req
    });

    // Real-Time Socket Broadcast
    broadcastSlotUpdate({
      slotId: booking.slot_id,
      slotNumber: booking.slot_number,
      areaId: booking.area_id,
      areaCode: booking.area_code,
      status: 'available',
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Slot is now available.'
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
}

module.exports = {
  getAreas,
  getSlots,
  getAvailability,
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking
};

