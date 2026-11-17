const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditLogger');

/**
 * Register a new faculty member with vehicle
 */
async function register(req, res) {
  try {
    const {
      faculty_id,
      full_name,
      email,
      phone,
      department,
      password,
      vehicle_number,
      vehicle_type,
      vehicle_model
    } = req.body;

    // Input Validation
    if (!faculty_id || !full_name || !email || !phone || !department || !password) {
      return res.status(400).json({
        success: false,
        message: 'All personal and faculty details are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check duplicate email
    const existingEmail = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.'
      });
    }

    // Check duplicate faculty ID
    const existingFacultyId = await query('SELECT id FROM users WHERE faculty_id = ?', [faculty_id.trim()]);
    if (existingFacultyId.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this Faculty ID already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertUserRes = await query(
      `INSERT INTO users (faculty_id, full_name, email, phone, department, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'faculty', 1)`,
      [
        faculty_id.trim().toUpperCase(),
        full_name.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        department.trim(),
        passwordHash
      ]
    );

    const newUserId = insertUserRes.insertId;

    // Insert vehicle if provided
    if (vehicle_number) {
      await query(
        `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, vehicle_model, is_primary)
         VALUES (?, ?, ?, ?, 1)`,
        [
          newUserId,
          vehicle_number.trim().toUpperCase(),
          vehicle_type || 'car',
          vehicle_model?.trim() || 'Not specified'
        ]
      );
    }

    // Welcome Notification
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Welcome to ParkEase!', 'Your faculty parking account has been successfully created.', 'success')`,
      [newUserId]
    );

    // Audit Log
    await logAudit({
      userId: newUserId,
      role: 'faculty',
      name: full_name,
      action: 'FACULTY_REGISTRATION',
      recordId: `USER-${newUserId}`,
      details: { email, faculty_id, department, vehicle_number },
      req
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), role: 'faculty' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Faculty account registered successfully.',
      token,
      user: {
        id: newUserId,
        faculty_id: faculty_id.trim().toUpperCase(),
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        role: 'faculty',
        vehicle: vehicle_number ? {
          vehicle_number: vehicle_number.trim().toUpperCase(),
          vehicle_type: vehicle_type || 'car',
          vehicle_model: vehicle_model?.trim() || 'Not specified'
        } : null
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during registration. Please try again.'
    });
  }
}

/**
 * User Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user
    const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check account status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact campus administration.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Fetch primary vehicle
    const vehicles = await query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC LIMIT 1', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Audit Log
    await logAudit({
      userId: user.id,
      role: user.role,
      name: user.full_name,
      action: 'USER_LOGIN',
      recordId: `USER-${user.id}`,
      details: { email: user.email, role: user.role },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        faculty_id: user.faculty_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.role,
        vehicle: vehicles.length > 0 ? vehicles[0] : null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login.'
    });
  }
}

/**
 * Get Authenticated User Profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const users = await query('SELECT id, faculty_id, full_name, email, phone, department, role, is_active, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const vehicles = await query('SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_primary DESC', [userId]);
    const bookingsCount = await query('SELECT COUNT(*) as total FROM bookings WHERE user_id = ?', [userId]);
    const activeBooking = await query(
      `SELECT b.*, s.slot_number, a.name as area_name, a.code as area_code
       FROM bookings b
       JOIN parking_slots s ON b.slot_id = s.id
       JOIN parking_areas a ON s.area_id = a.id
       WHERE b.user_id = ? AND b.status IN ('confirmed', 'active')
       ORDER BY b.id DESC LIMIT 1`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      user: {
        ...users[0],
        vehicles,
        totalBookings: bookingsCount[0]?.total || 0,
        activeBooking: activeBooking.length > 0 ? activeBooking[0] : null
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}

/**
 * Update Profile & Vehicle Info
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { phone, department, vehicle_number, vehicle_type, vehicle_model } = req.body;

    if (phone || department) {
      await query(
        `UPDATE users
         SET phone = COALESCE(?, phone),
             department = COALESCE(?, department)
         WHERE id = ?`,
        [phone || null, department || null, userId]
      );
    }

    if (vehicle_number) {
      const existingVehicle = await query('SELECT id FROM vehicles WHERE user_id = ? LIMIT 1', [userId]);
      if (existingVehicle.length > 0) {
        await query(
          `UPDATE vehicles
           SET vehicle_number = ?, vehicle_type = ?, vehicle_model = ?
           WHERE id = ?`,
          [vehicle_number.toUpperCase().trim(), vehicle_type || 'car', vehicle_model || '', existingVehicle[0].id]
        );
      } else {
        await query(
          `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, vehicle_model, is_primary)
           VALUES (?, ?, ?, ?, 1)`,
          [userId, vehicle_number.toUpperCase().trim(), vehicle_type || 'car', vehicle_model || '']
        );
      }
    }

    await logAudit({
      userId,
      role: req.user.role,
      name: req.user.full_name,
      action: 'PROFILE_UPDATED',
      recordId: `USER-${userId}`,
      details: { phone, department, vehicle_number },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

/**
 * User Logout
 */
async function logout(req, res) {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        role: req.user.role,
        name: req.user.full_name,
        action: 'USER_LOGOUT',
        recordId: `USER-${req.user.id}`,
        details: { email: req.user.email },
        req
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout
};

