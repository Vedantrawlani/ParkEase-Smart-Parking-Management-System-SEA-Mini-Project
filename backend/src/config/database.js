const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const seedData = require('../../database/seedData');

let pool = null;
let sqliteDb = null;
let activeDriver = 'none';

const dbHealth = {
  driver: 'uninitialized',
  connected: false,
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'parkease_db',
  latencyMs: 0,
  lastPing: null,
  totalQueries: 0,
  errorCount: 0,
  lastError: null
};

// Check if Node built-in sqlite is available
let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  DatabaseSync = null;
}

/**
 * Initialize Database Connection
 * Tries MySQL first. Falls back to embedded relational SQLite if MySQL is offline.
 */
async function initDatabase() {
  const startTime = Date.now();
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'parkease_db';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  // 1. Attempt MySQL connection
  try {
    console.log(`[DB] Attempting connection to MySQL at ${dbHost}:${dbPort}...`);
    // First connect without specifying database to create database if missing
    const rootConnection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort,
      connectTimeout: 2000
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await rootConnection.end();

    // Now establish connection pool with the database
    pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test ping
    const pingConn = await pool.getConnection();
    await pingConn.ping();
    pingConn.release();

    activeDriver = 'mysql';
    dbHealth.driver = 'MySQL (InnoDB)';
    dbHealth.connected = true;
    dbHealth.latencyMs = Date.now() - startTime;
    dbHealth.lastPing = new Date().toISOString();

    console.log(`[DB] Successfully connected to MySQL (${dbName}) in ${dbHealth.latencyMs}ms`);

    // Ensure schema and seeds
    await setupMySQLSchemaAndSeed();
    return;
  } catch (mysqlErr) {
    console.warn(`[DB] MySQL connection notice: ${mysqlErr.message}`);
    console.warn(`[DB] Activating embedded relational SQLite storage engine for ParkEase.`);
  }

  // 2. Fallback to Embedded SQLite Engine
  try {
    const dbDir = path.join(__dirname, '..', '..', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbFilePath = path.join(dbDir, 'parkease.sqlite');

    if (DatabaseSync) {
      sqliteDb = new DatabaseSync(dbFilePath);
      sqliteDb.exec('PRAGMA foreign_keys = ON;');
      activeDriver = 'sqlite';
      dbHealth.driver = 'SQLite Relational (Embedded Engine)';
      dbHealth.connected = true;
      dbHealth.latencyMs = Date.now() - startTime;
      dbHealth.lastPing = new Date().toISOString();
      console.log(`[DB] Embedded SQLite engine initialized at ${dbFilePath}`);

      await setupSQLiteSchemaAndSeed();
    } else {
      throw new Error('Neither MySQL nor node:sqlite engine is available in this environment.');
    }
  } catch (sqliteErr) {
    console.error(`[DB] Fatal: Could not initialize database storage:`, sqliteErr);
    dbHealth.connected = false;
    dbHealth.lastError = sqliteErr.message;
    dbHealth.errorCount++;
  }
}

/**
 * Universal Query Execution
 * Translates and executes queries for either MySQL or SQLite seamlessly.
 */
async function query(sql, params = []) {
  const t0 = Date.now();
  dbHealth.totalQueries++;
  dbHealth.lastPing = new Date().toISOString();

  // Sanitize undefined -> null and booleans -> 1/0
  const sanitizedParams = params.map(p => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p));

  if (activeDriver === 'mysql' && pool) {
    try {
      const [rows] = await pool.query(sql, sanitizedParams);
      dbHealth.latencyMs = Date.now() - t0;
      return rows;
    } catch (err) {
      dbHealth.errorCount++;
      dbHealth.lastError = err.message;
      throw err;
    }
  } else if (activeDriver === 'sqlite' && sqliteDb) {
    try {
      const trimmed = sql.trim();
      const isSelect = /^SELECT/i.test(trimmed) || /^PRAGMA/i.test(trimmed);

      // Replace MySQL-specific NOW() / CURRENT_TIMESTAMP or intervals if needed
      let adaptedSql = sql.replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')");

      const stmt = sqliteDb.prepare(adaptedSql);
      if (isSelect) {
        const rows = stmt.all(...sanitizedParams);
        dbHealth.latencyMs = Date.now() - t0;
        return rows;
      } else {
        const result = stmt.run(...sanitizedParams);
        dbHealth.latencyMs = Date.now() - t0;
        return {
          insertId: Number(result.lastInsertRowid),
          affectedRows: result.changes
        };
      }
    } catch (err) {
      dbHealth.errorCount++;
      dbHealth.lastError = err.message;
      throw err;
    }
  } else {
    throw new Error('Database is currently not connected.');
  }
}

/**
 * Setup MySQL Tables and Seed Initial Data
 */
async function setupMySQLSchemaAndSeed() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !/^CREATE DATABASE/i.test(s) && !/^USE /i.test(s));

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Table might already exist
      }
    }
  }

  // Check if users exist; if not, seed!
  const [usersCount] = await pool.query('SELECT COUNT(*) as cnt FROM users');
  if (usersCount[0].cnt === 0) {
    console.log('[DB] Seeding initial data into MySQL...');
    await populateSeedData();
  }
}

/**
 * Setup SQLite Tables and Seed Initial Data
 */
async function setupSQLiteSchemaAndSeed() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'faculty',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL DEFAULT 'car',
      vehicle_model TEXT,
      is_primary INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parking_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      floor TEXT NOT NULL DEFAULT 'Ground Level',
      total_slots INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS parking_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_number TEXT NOT NULL,
      area_id INTEGER NOT NULL,
      slot_type TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'available',
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      last_status_change TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (area_id) REFERENCES parking_areas(id),
      UNIQUE (area_id, slot_number)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      slot_id INTEGER NOT NULL,
      vehicle_id INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      qr_code_data TEXT NOT NULL,
      qr_code_image TEXT,
      booking_type TEXT NOT NULL DEFAULT 'self_service',
      cancelled_at TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (slot_id) REFERENCES parking_slots(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS parking_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE,
      slot_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      entry_time TEXT NOT NULL,
      exit_time TEXT,
      status TEXT NOT NULL DEFAULT 'ongoing',
      verified_by_method TEXT NOT NULL DEFAULT 'qr_scan',
      remarks TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (slot_id) REFERENCES parking_slots(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_role TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
      timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS requirements (
      req_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'High',
      module TEXT NOT NULL,
      implementation_status TEXT NOT NULL DEFAULT 'Implemented',
      linked_test_id TEXT,
      verification_status TEXT NOT NULL DEFAULT 'Verified',
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      tc_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      actual_result TEXT,
      status TEXT NOT NULL DEFAULT 'Passed',
      execution_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      reported_by TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `;

  sqliteDb.exec(schema);

  const stmt = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM users');
  const count = stmt.all()[0].cnt;
  if (count === 0) {
    console.log('[DB] Seeding initial data into SQLite...');
    await populateSeedData();
  }
}

/**
 * Populate Initial Realistic Seed Data
 */
async function populateSeedData() {
  // 1. Users
  for (const u of seedData.users) {
    await query(
      `INSERT INTO users (faculty_id, full_name, email, phone, department, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.faculty_id, u.full_name, u.email, u.phone, u.department, u.password_hash, u.role, u.is_active]
    );
  }

  // 2. Vehicles
  for (const v of seedData.vehicles) {
    const userRows = await query('SELECT id FROM users WHERE email = ?', [v.user_email]);
    if (userRows.length > 0) {
      await query(
        `INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, vehicle_model, is_primary)
         VALUES (?, ?, ?, ?, ?)`,
        [userRows[0].id, v.vehicle_number, v.vehicle_type, v.vehicle_model, v.is_primary]
      );
    }
  }

  // 3. Parking Areas
  for (const a of seedData.parking_areas) {
    await query(
      `INSERT INTO parking_areas (name, code, description, floor, total_slots, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [a.name, a.code, a.description, a.floor, a.total_slots, a.is_active]
    );
  }

  // 4. Parking Slots
  for (const s of seedData.parking_slots) {
    const areaRows = await query('SELECT id FROM parking_areas WHERE code = ?', [s.area_code]);
    if (areaRows.length > 0) {
      await query(
        `INSERT INTO parking_slots (slot_number, area_id, slot_type, status, is_active, notes)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [s.slot_number, areaRows[0].id, s.slot_type || 'standard', s.status || 'available', s.notes || null]
      );
    }
  }

  // 5. Requirements (REQ-01 to REQ-32)
  for (const r of seedData.requirements) {
    await query(
      `INSERT INTO requirements (req_id, title, description, priority, module, implementation_status, linked_test_id, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.req_id, r.title, r.description, r.priority, r.module, r.implementation_status, r.linked_test_id, r.verification_status]
    );
  }

  // 6. Test Cases (TC-01 to TC-20)
  for (const tc of seedData.test_cases) {
    await query(
      `INSERT INTO test_cases (tc_id, title, category, description, expected_result, actual_result, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tc.tc_id, tc.title, tc.category, tc.description, tc.expected_result, tc.actual_result, tc.status]
    );
  }

  // 7. Defects (DEF-001 to DEF-003)
  for (const d of seedData.defects) {
    await query(
      `INSERT INTO defects (defect_code, title, description, severity, status, reported_by, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [d.defect_code, d.title, d.description, d.severity, d.status, d.reported_by, d.assigned_to]
    );
  }

  // 8. Sample Bookings & Sessions for active demo
  const user1 = (await query('SELECT id FROM users WHERE email = ?', ['faculty1@college.edu']))[0];
  const user2 = (await query('SELECT id FROM users WHERE email = ?', ['faculty2@college.edu']))[0];
  const slotOccupied = (await query('SELECT id FROM parking_slots WHERE slot_number = ?', ['A-103']))[0];
  const slotReserved = (await query('SELECT id FROM parking_slots WHERE slot_number = ?', ['B-204']))[0];

  if (user1 && slotOccupied) {
    const bookingId1 = 'PE-20261104-A103';
    const now = new Date();
    const entryTime = new Date(now.getTime() - 45 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const endTime = new Date(now.getTime() + 180 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const resB1 = await query(
      `INSERT INTO bookings (booking_id, user_id, slot_id, start_time, end_time, status, qr_code_data, booking_type)
       VALUES (?, ?, ?, ?, ?, 'active', ?, 'self_service')`,
      [bookingId1, user1.id, slotOccupied.id, entryTime, endTime, JSON.stringify({ bookingId: bookingId1, slotId: slotOccupied.id, userId: user1.id })]
    );

    const bId = resB1.insertId || 1;
    await query(
      `INSERT INTO parking_sessions (booking_id, slot_id, user_id, entry_time, status, verified_by_method)
       VALUES (?, ?, ?, ?, 'ongoing', 'qr_scan')`,
      [bId, slotOccupied.id, user1.id, entryTime]
    );

    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Vehicle Entered Gate A', 'Your vehicle entry was confirmed for slot A-103 at 08:30 AM.', 'success')`,
      [user1.id]
    );
  }

  if (user2 && slotReserved) {
    const bookingId2 = 'PE-20261104-B204';
    const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const endTime = new Date(Date.now() + 240 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await query(
      `INSERT INTO bookings (booking_id, user_id, slot_id, start_time, end_time, status, qr_code_data, booking_type)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?, 'self_service')`,
      [bookingId2, user2.id, slotReserved.id, startTime, endTime, JSON.stringify({ bookingId: bookingId2, slotId: slotReserved.id, userId: user2.id })]
    );

    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Upcoming Reservation Reminder', 'Slot B-204 is reserved for you from 10:00 AM.', 'info')`,
      [user2.id]
    );
  }

  // 9. Initial Audit Log
  const adminUser = (await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1"))[0];
  await query(
    `INSERT INTO audit_logs (user_id, user_role, user_name, action, record_id, details)
     VALUES (?, 'admin', 'System Administrator', 'SYSTEM_INITIALIZATION', 'SYS-001', 'ParkEase database initialized and seed data loaded successfully.')`,
    [adminUser ? adminUser.id : null]
  );

  console.log('[DB] Seeding completed successfully.');
}

function getHealth() {
  return {
    ...dbHealth,
    activeDriver
  };
}

module.exports = {
  initDatabase,
  query,
  getHealth,
  populateSeedData
};
