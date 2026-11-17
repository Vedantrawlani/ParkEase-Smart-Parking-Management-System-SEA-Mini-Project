const { query } = require('../config/database');
const { broadcastSlotUpdate, sendUserNotification } = require('../services/socketService');
const { logAudit } = require('../middleware/auditLogger');
const { toSqlDateTime } = require('../utils/helpers');

/**
 * Record Vehicle Entry (QR Code scan or manual booking ID entry)
 */
async function recordEntry(req, res) {
  try {
    const { qr_data, booking_id, method = 'qr_scan', remarks } = req.body;

    let targetBookingId = booking_id;

    // Parse QR Data if passed as JSON string
    if (qr_data) {
      try {
        const parsed = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
        if (parsed.bookingId) {
          targetBookingId = parsed.bookingId;
        } else if (typeof qr_data === 'string' && qr_data.startsWith('PE-')) {
          targetBookingId = qr_data.trim();
        }
      } catch (e) {
        // If not JSON, check if it's raw string booking ID
        if (typeof qr_data === 'string' && qr_data.trim().startsWith('PE-')) {
          targetBookingId = qr_data.trim();
        }
      }
    }

    if (!targetBookingId) {
      return res.status(400).json({
        success: false,
        message: 'Valid QR code payload or Booking ID is required for gate entry.'
      });
    }

    // Lookup booking with slot and user details
    const bookingRows = await query(
      `SELECT b.*,
              s.slot_number, s.status as slot_status, s.area_id,
              a.name as area_name, a.code as area_code,
              u.full_name as faculty_name, u.faculty_id, u.email as faculty_email,
              v.vehicle_number, v.vehicle_model
       FROM bookings b
       JOIN parking_slots s ON b.slot_id = s.id
       JOIN parking_areas a ON s.area_id = a.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.booking_id = ?`,
      [targetBookingId.trim()]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid booking. No matching reservation found for this ID.'
      });
    }

    const booking = bookingRows[0];

    // Status Validation
    if (booking.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Entry already recorded. This vehicle session is already active inside the facility.'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been used and completed.'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Access Denied: This reservation was previously cancelled.'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Booking has status '${booking.status}' and cannot be validated for entry.`
      });
    }

    // Time window check (allow 60 minutes early arrival buffer and 30 minutes grace period)
    const now = new Date();
    const nowMs = now.getTime();
    const parseTime = (t) => {
      if (!t) return Date.now();
      const str = String(t);
      if (str.includes('T')) return new Date(str).getTime();
      return new Date(str.replace(' ', 'T') + 'Z').getTime();
    };

    const startMs = parseTime(booking.start_time);
    const endMs = parseTime(booking.end_time);

    const bufferEarlyMs = 60 * 60 * 1000; // 60 mins early window
    const bufferLateMs = 30 * 60 * 1000;  // 30 mins grace window

    if (nowMs < startMs - bufferEarlyMs) {
      return res.status(400).json({
        success: false,
        message: 'Too early for entry. Permitted arrival window has not started yet.'
      });
    }

    if (nowMs > endMs + bufferLateMs) {
      return res.status(400).json({
        success: false,
        message: 'Booking expired. The scheduled reservation window has ended.'
      });
    }

    const entrySqlTime = toSqlDateTime(now);

    // 1. Create Parking Session
    const sessionRes = await query(
      `INSERT INTO parking_sessions (booking_id, slot_id, user_id, entry_time, status, verified_by_method, remarks)
       VALUES (?, ?, ?, ?, 'ongoing', ?, ?)`,
      [booking.id, booking.slot_id, booking.user_id, entrySqlTime, method, remarks || 'Gate verification successful']
    );

    const sessionId = sessionRes.insertId;

    // 2. Update Booking Status to 'active'
    await query(
      `UPDATE bookings SET status = 'active' WHERE id = ?`,
      [booking.id]
    );

    // 3. Update Slot Status to 'occupied' (Red)
    await query(
      `UPDATE parking_slots
       SET status = 'occupied', last_status_change = NOW()
       WHERE id = ?`,
      [booking.slot_id]
    );

    // 4. In-App Notification to Faculty
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Gate Entry Verified', ?, 'success', '/active-session')`,
      [
        booking.user_id,
        `Welcome! Your vehicle (${booking.vehicle_number || 'Registered'}) has entered Gate. Proceed to Slot ${booking.slot_number} (${booking.area_name}).`
      ]
    );

    // 5. Audit Log
    await logAudit({
      userId: req.user ? req.user.id : booking.user_id,
      role: req.user ? req.user.role : 'gate_scanner',
      name: req.user ? req.user.full_name : 'Gate Controller',
      action: 'VEHICLE_ENTRY_RECORDED',
      recordId: booking.booking_id,
      details: {
        sessionId,
        bookingId: booking.booking_id,
        slotNumber: booking.slot_number,
        facultyName: booking.faculty_name,
        verificationMethod: method,
        entryTime: entrySqlTime
      },
      req
    });

    // 6. Real-Time Broadcast
    broadcastSlotUpdate({
      slotId: booking.slot_id,
      slotNumber: booking.slot_number,
      areaId: booking.area_id,
      areaCode: booking.area_code,
      status: 'occupied',
      updatedAt: new Date().toISOString()
    });

    sendUserNotification(booking.user_id, {
      title: 'Gate Entry Verified',
      message: `Proceed to slot ${booking.slot_number}.`,
      status: 'occupied'
    });

    return res.status(200).json({
      success: true,
      message: `Entry authorized! Welcome ${booking.faculty_name}. Proceed to slot ${booking.slot_number}.`,
      session: {
        id: sessionId,
        booking_id: booking.booking_id,
        slot_number: booking.slot_number,
        area_name: booking.area_name,
        area_code: booking.area_code,
        faculty_name: booking.faculty_name,
        faculty_id: booking.faculty_id,
        vehicle_number: booking.vehicle_number,
        entry_time: entrySqlTime,
        status: 'ongoing'
      }
    });
  } catch (err) {
    console.error('recordEntry error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing entry verification.' });
  }
}

/**
 * Record Vehicle Exit (QR scan or manual code at exit gate)
 */
async function recordExit(req, res) {
  try {
    const { qr_data, booking_id, session_id, remarks } = req.body;

    let targetBookingId = booking_id;

    if (qr_data) {
      try {
        const parsed = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
        if (parsed.bookingId) targetBookingId = parsed.bookingId;
        else if (typeof qr_data === 'string' && qr_data.startsWith('PE-')) targetBookingId = qr_data.trim();
      } catch (e) {
        if (typeof qr_data === 'string' && qr_data.trim().startsWith('PE-')) targetBookingId = qr_data.trim();
      }
    }

    let sessionRows;
    if (session_id) {
      sessionRows = await query(
        `SELECT ps.*, b.booking_id, b.user_id as booking_user_id,
                s.slot_number, s.area_id,
                a.name as area_name, a.code as area_code,
                u.full_name as faculty_name, u.faculty_id, u.email as faculty_email,
                v.vehicle_number
         FROM parking_sessions ps
         JOIN bookings b ON ps.booking_id = b.id
         JOIN parking_slots s ON ps.slot_id = s.id
         JOIN parking_areas a ON s.area_id = a.id
         JOIN users u ON ps.user_id = u.id
         LEFT JOIN vehicles v ON b.vehicle_id = v.id
         WHERE ps.id = ? AND ps.status = 'ongoing'`,
        [session_id]
      );
    } else if (targetBookingId) {
      sessionRows = await query(
        `SELECT ps.*, b.booking_id, b.user_id as booking_user_id,
                s.slot_number, s.area_id,
                a.name as area_name, a.code as area_code,
                u.full_name as faculty_name, u.faculty_id, u.email as faculty_email,
                v.vehicle_number
         FROM parking_sessions ps
         JOIN bookings b ON ps.booking_id = b.id
         JOIN parking_slots s ON ps.slot_id = s.id
         JOIN parking_areas a ON s.area_id = a.id
         JOIN users u ON ps.user_id = u.id
         LEFT JOIN vehicles v ON b.vehicle_id = v.id
         WHERE b.booking_id = ? AND ps.status = 'ongoing'`,
        [targetBookingId.trim()]
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Session ID, Booking ID, or valid QR code payload is required for vehicle exit.'
      });
    }

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No ongoing parking session found matching this reference. Vehicle may have already exited.'
      });
    }

    const session = sessionRows[0];
    const now = new Date();
    const exitSqlTime = toSqlDateTime(now);
    const entryDate = new Date(session.entry_time);
    const durationMinutes = Math.max(1, Math.round((now.getTime() - entryDate.getTime()) / (1000 * 60)));
    const durationHours = (durationMinutes / 60).toFixed(1);

    // 1. Update session to completed
    await query(
      `UPDATE parking_sessions
       SET exit_time = ?, status = 'completed', remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [exitSqlTime, remarks || 'Exit gate verification completed', session.id]
    );

    // 2. Update booking to completed
    await query(
      `UPDATE bookings SET status = 'completed' WHERE id = ?`,
      [session.booking_id]
    );

    // 3. Free parking slot back to 'available' (Green)
    await query(
      `UPDATE parking_slots
       SET status = 'available', last_status_change = NOW()
       WHERE id = ?`,
      [session.slot_id]
    );

    // 4. In-App Notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, 'Parking Session Completed', ?, 'success', '/parking-history')`,
      [
        session.user_id,
        `Your parking session for slot ${session.slot_number} concluded at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total duration: ${durationHours} hours (${durationMinutes} mins).`
      ]
    );

    // 5. Audit Log
    await logAudit({
      userId: req.user ? req.user.id : session.user_id,
      role: req.user ? req.user.role : 'gate_scanner',
      name: req.user ? req.user.full_name : 'Exit Gate Controller',
      action: 'VEHICLE_EXIT_RECORDED',
      recordId: session.booking_id,
      details: {
        sessionId: session.id,
        bookingId: session.booking_id,
        slotNumber: session.slot_number,
        durationMinutes,
        exitTime: exitSqlTime
      },
      req
    });

    // 6. Broadcast Real-Time Availability update
    broadcastSlotUpdate({
      slotId: session.slot_id,
      slotNumber: session.slot_number,
      areaId: session.area_id,
      areaCode: session.area_code,
      status: 'available',
      updatedAt: new Date().toISOString()
    });

    sendUserNotification(session.user_id, {
      title: 'Exit Completed',
      message: `Thank you for visiting! Slot ${session.slot_number} is now released.`,
      status: 'available'
    });

    return res.status(200).json({
      success: true,
      message: `Exit confirmed. Total duration: ${durationHours} hrs (${durationMinutes} mins). Slot ${session.slot_number} is now freed.`,
      summary: {
        session_id: session.id,
        booking_id: session.booking_id,
        slot_number: session.slot_number,
        area_name: session.area_name,
        faculty_name: session.faculty_name,
        entry_time: session.entry_time,
        exit_time: exitSqlTime,
        duration_minutes: durationMinutes,
        duration_hours: durationHours
      }
    });
  } catch (err) {
    console.error('recordExit error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing exit verification.' });
  }
}

/**
 * Get Active Parking Session(s)
 */
async function getActiveSessions(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let sql = `
      SELECT ps.*,
             b.booking_id, b.start_time, b.end_time, b.qr_code_image,
             s.slot_number, s.slot_type,
             a.name as area_name, a.code as area_code, a.floor as area_floor,
             u.full_name as faculty_name, u.faculty_id, u.department, u.phone as faculty_phone,
             v.vehicle_number, v.vehicle_type, v.vehicle_model
      FROM parking_sessions ps
      JOIN bookings b ON ps.booking_id = b.id
      JOIN parking_slots s ON ps.slot_id = s.id
      JOIN parking_areas a ON s.area_id = a.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE ps.status = 'ongoing'
    `;
    const params = [];

    if (!isAdmin) {
      sql += ' AND ps.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY ps.id DESC';

    const sessions = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
      activeSession: sessions.length > 0 ? sessions[0] : null
    });
  } catch (err) {
    console.error('getActiveSessions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve active sessions.' });
  }
}

/**
 * Get Completed Session History
 */
async function getSessionHistory(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { limit = 50 } = req.query;

    let sql = `
      SELECT ps.*,
             b.booking_id, b.start_time, b.end_time,
             s.slot_number, s.slot_type,
             a.name as area_name, a.code as area_code,
             u.full_name as faculty_name, u.faculty_id, u.department,
             v.vehicle_number, v.vehicle_model
      FROM parking_sessions ps
      JOIN bookings b ON ps.booking_id = b.id
      JOIN parking_slots s ON ps.slot_id = s.id
      JOIN parking_areas a ON s.area_id = a.id
      JOIN users u ON ps.user_id = u.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE ps.status = 'completed'
    `;
    const params = [];

    if (!isAdmin) {
      sql += ' AND ps.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY ps.exit_time DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const history = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    console.error('getSessionHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve parking history.' });
  }
}

module.exports = {
  recordEntry,
  recordExit,
  getActiveSessions,
  getSessionHistory
};
