const { query } = require('../config/database');
const { sendUserNotification } = require('../services/socketService');

/**
 * Get in-app notifications for authenticated user
 */
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = await query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC LIMIT 50`,
      [userId]
    );

    const unreadCount = await query(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: unreadCount[0]?.unread || 0,
      notifications
    });
  } catch (err) {
    console.error('getUserNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

/**
 * Mark a single notification as read
 */
async function markAsRead(req, res) {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

/**
 * Mark all notifications as read for current user
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

/**
 * Admin Broadcast Notification
 */
async function broadcastNotification(req, res) {
  try {
    const { title, message, type = 'info', department } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    let targetUsers;
    if (department) {
      targetUsers = await query("SELECT id FROM users WHERE role = 'faculty' AND department = ? AND is_active = 1", [department]);
    } else {
      targetUsers = await query("SELECT id FROM users WHERE role = 'faculty' AND is_active = 1");
    }

    for (const u of targetUsers) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [u.id, title.trim(), message.trim(), type]
      );
      sendUserNotification(u.id, { title, message, type });
    }

    return res.status(200).json({
      success: true,
      message: `Notification broadcasted to ${targetUsers.length} faculty members.`
    });
  } catch (err) {
    console.error('broadcastNotification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to broadcast notification.' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification
};

