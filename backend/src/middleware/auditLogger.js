const { query } = require('../config/database');

/**
 * Record an audit log entry into the database
 */
async function logAudit({ userId, role, name, action, recordId, details, req }) {
  try {
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    await query(
      `INSERT INTO audit_logs (user_id, user_role, user_name, action, record_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        role || 'system',
        name || 'Unknown User',
        action,
        recordId || null,
        typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress
      ]
    );
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}

module.exports = {
  logAudit
};

