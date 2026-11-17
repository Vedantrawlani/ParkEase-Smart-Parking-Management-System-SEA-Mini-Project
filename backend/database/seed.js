require('dotenv').config();
const { initDatabase, query, populateSeedData, getHealth } = require('../src/config/database');

async function runSeed() {
  console.log('--- ParkEase Database Seeder ---');
  try {
    await initDatabase();
    console.log('Database initialized.');

    // Clear tables in reverse foreign key order
    console.log('Clearing existing records for fresh seed...');
    const tables = [
      'defects',
      'test_cases',
      'requirements',
      'audit_logs',
      'notifications',
      'parking_sessions',
      'bookings',
      'parking_slots',
      'parking_areas',
      'vehicles',
      'users'
    ];

    for (const table of tables) {
      try {
        await query(`DELETE FROM ${table}`);
      } catch (e) {
        // Table might not exist yet
      }
    }

    console.log('Populating seed data...');
    await populateSeedData();
    console.log('Seed completed successfully!');
    console.log('Health:', getHealth());
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

runSeed();
