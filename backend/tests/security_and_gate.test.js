const request = require('supertest');
const app = require('../src/app');
const { initDatabase, query } = require('../src/config/database');

let adminToken = '';
let facultyToken = '';

beforeAll(async () => {
  await initDatabase();

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@college.edu', password: 'Admin@123' });
  adminToken = adminLogin.body.token;

  const facultyLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'faculty2@college.edu', password: 'Faculty@123' });
  facultyToken = facultyLogin.body.token;
});

describe('Module 3: Security, Gate Operations & Software Engineering Test Suite', () => {
  let gateBookingId = null;
  let gateSlotId = null;

  // TC-05: Faculty accessing admin-only routes
  test('TC-05: Faculty accessing admin route returns 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TC-12: Rejecting an invalid QR code
  test('TC-12: Rejecting invalid or non-existent QR payload', async () => {
    const res = await request(app)
      .post('/api/sessions/entry')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        booking_id: 'PE-INVALID-9999',
        method: 'manual_code'
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // TC-11 & TC-13: Validating QR code and recording vehicle entry
  test('TC-11 & TC-13: Recording vehicle entry creates session and updates slot to occupied', async () => {
    // Find an available slot
    const slots = await query("SELECT id FROM parking_slots WHERE status = 'available' LIMIT 1");
    expect(slots.length).toBeGreaterThan(0);
    gateSlotId = slots[0].id;

    const now = new Date();
    const bookRes = await request(app)
      .post('/api/parking/bookings')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        slot_id: gateSlotId,
        start_time: new Date(now.getTime() - 600000).toISOString(),
        end_time: new Date(now.getTime() + 14400000).toISOString()
      });

    expect(bookRes.status).toBe(201);
    gateBookingId = bookRes.body.booking.booking_id;

    const res = await request(app)
      .post('/api/sessions/entry')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        booking_id: gateBookingId,
        method: 'qr_scan'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.session.status).toBe('ongoing');

    // Slot is now occupied
    const slotCheck = await query('SELECT status FROM parking_slots WHERE id = ?', [gateSlotId]);
    expect(slotCheck[0].status).toBe('occupied');
  });

  // TC-14: Recording vehicle exit
  test('TC-14: Recording vehicle exit closes session and restores slot to available', async () => {
    expect(gateBookingId).toBeDefined();

    const res = await request(app)
      .post('/api/sessions/exit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        booking_id: gateBookingId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.slot_number).toBeDefined();

    // Slot is now available again
    const slotCheck = await query('SELECT status FROM parking_slots WHERE id = ?', [gateSlotId]);
    expect(slotCheck[0].status).toBe('available');
  });

  // TC-16: Admin adding a new parking slot
  test('TC-16: Admin adds a new parking slot successfully', async () => {
    const area = await query('SELECT id FROM parking_areas LIMIT 1');
    const areaId = area[0].id;
    const uniqueSlotNumber = `T-${Date.now().toString().slice(-4)}`;

    const res = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slot_number: uniqueSlotNumber,
        area_id: areaId,
        slot_type: 'standard',
        status: 'available',
        notes: 'Automated test created slot'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // TC-17: Admin modifying parking allocation
  test('TC-17: Admin direct allocation to faculty', async () => {
    const slots = await query("SELECT id FROM parking_slots WHERE status = 'available' LIMIT 1");
    const targetSlotId = slots[0].id;
    const now = new Date();

    const res = await request(app)
      .post('/api/admin/allocate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        faculty_id: 'FAC-ME-103',
        slot_id: targetSlotId,
        start_time: new Date(now.getTime() + 18000000).toISOString(),
        end_time: new Date(now.getTime() + 25200000).toISOString(),
        remarks: 'Direct allocation for Department Seminar'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking_id).toBeDefined();
  });

  // TC-18: Viewing parking history
  test('TC-18: Faculty views parking history', async () => {
    const res = await request(app)
      .get('/api/sessions/history')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  // TC-19: Generating parking utilization reports
  test('TC-19: Admin retrieves utilization analytics and reports', async () => {
    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.distribution).toBeDefined();
    expect(res.body.weeklyTrends).toBeDefined();
    expect(res.body.peakHours).toBeDefined();
  });
});
