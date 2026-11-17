const request = require('supertest');
const app = require('../src/app');
const { initDatabase } = require('../src/config/database');

beforeAll(async () => {
  await initDatabase();
});

describe('Module 1: Authentication & RBAC Test Suite', () => {
  const uniqueId = Date.now().toString().slice(-4);
  const testEmail = `test.faculty.${uniqueId}@college.edu`;
  const testFacultyId = `FAC-TEST-${uniqueId}`;

  // TC-01: Faculty registration with valid details
  test('TC-01: Faculty registration with valid details returns 201 and JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        faculty_id: testFacultyId,
        full_name: 'Dr. Test Professor',
        email: testEmail,
        phone: '+91 98980 12345',
        department: 'Computer Science',
        password: 'Password@123',
        vehicle_number: `MH-12-TEST-${uniqueId}`,
        vehicle_type: 'car',
        vehicle_model: 'Honda City'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('faculty');
  });

  // TC-02: Faculty registration with duplicate email
  test('TC-02: Faculty registration with duplicate email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        faculty_id: `FAC-DUP-${uniqueId}`,
        full_name: 'Duplicate Person',
        email: testEmail, // same email
        phone: '+91 98980 99999',
        department: 'Physics',
        password: 'Password@123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  // TC-03: Login with valid credentials
  test('TC-03: Login with valid credentials returns 200 and token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@college.edu',
        password: 'Admin@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  // TC-04: Login with incorrect password
  test('TC-04: Login with incorrect password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@college.edu',
        password: 'CompletelyWrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  // TC-20: Rejecting invalid input (Missing fields)
  test('TC-20: Missing registration fields returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'incomplete@college.edu'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

