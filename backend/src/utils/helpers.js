const crypto = require('crypto');

/**
 * Generate unique, professional booking ID
 * Format: PE-YYYYMMDD-XXXX (e.g. PE-20261104-9K4M)
 */
function generateBookingId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `PE-${dateStr}-${randomChars}`;
}

/**
 * Check if two time intervals overlap
 * [startA, endA] and [startB, endB]
 */
function intervalsOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return sA < eB && sB < eA;
}

/**
 * Format date to standard SQL string YYYY-MM-DD HH:MM:SS
 */
function toSqlDateTime(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  generateBookingId,
  intervalsOverlap,
  toSqlDateTime
};

