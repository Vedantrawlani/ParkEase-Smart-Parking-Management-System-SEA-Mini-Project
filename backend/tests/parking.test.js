const request = require('supertest');
const app = require('../src/app');
const { initDatabase, query } = require('../src/config/database');

let facultyToken = '';
let testSlotId = null;
let createdBookingId = null;

beforeAll(async () => {
  await initDatabase();

  // Login as faculty to obtain bearer token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'faculty1@college.edu',
      password: 'Faculty@123'
    });
  facultyToken = loginRes.body.token;

  // Find an available slot
  const slots = await query("SELECT id FROM parking_slots WHERE status = 'available' LIMIT 1");
  if (slots.length > 0) {
    testSlotId = slots[0].id;
  }
});

describe('Module 2: Parking Search & Reservation Test Suite', () => {
  // TC-15: Slot availability catalog retrieval
  test('TC-15: Retrieve parking areas and availability status', async () => {
    const res = await request(app).get('/api/parking/availability');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.total_slots).toBeGreaterThan(0);
  });

  // TC-06 & TC-10: Booking an available slot & generating unique booking ID
  test('TC-06 & TC-10: Booking an available slot issues unique ID and QR code', async () => {
    const startTime = new Date(Date.now() + 3600000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const res = await request(app)
      .post('/api/parking/bookings')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        slot_id: testSlotId,
        start_time: startTime,
        end_time: endTime
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.booking_id).toMatch(/^PE-\d{8}-[A-Z0-9]{4}$/);
    expect(res.body.booking.qr_code_image).toMatch(/^data:image\/png;base64,/);

    createdBookingId = res.body.booking.booking_id;
  });

  // TC-07: Attempting to book an occupied/reserved slot
  test('TC-07: Attempting to book non-available slot returns 409 Conflict', async () => {
    const startTime = new Date(Date.now() + 3600000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();

    const res = await request(app)
      .post('/api/parking/bookings')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        slot_id: testSlotId, // slot is now reserved
        start_time: startTime,
        end_time: endTime
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // TC-08: Preventing double booking on overlapping intervals
  test('TC-08: Overlapping time reservation is rejected', async () => {
    const overlappingStart = new Date(Date.now() + 5000000).toISOString();
    const overlappingEnd = new Date(Date.now() + 9000000).toISOString();

    const res = await request(app)
      .post('/api/parking/bookings')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        slot_id: testSlotId,
        start_time: overlappingStart,
        end_time: overlappingEnd
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // TC-09: Cancelling an existing booking
  test('TC-09: Cancelling an existing booking restores slot status', async () => {
    expect(createdBookingId).toBeDefined();

    const res = await request(app)
      .put(`/api/parking/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ reason: 'Faculty meeting rescheduled' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify slot status is now available
    const slotCheck = await query('SELECT status FROM parking_slots WHERE id = ?', [testSlotId]);
    expect(slotCheck[0].status).toBe('available');
  });
});

