const bcrypt = require('bcryptjs');

// Hash password synchronously for seeding
const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
const facultyPasswordHash = bcrypt.hashSync('Faculty@123', 10);

const users = [
  {
    faculty_id: 'ADM-001',
    full_name: 'Dr. Suresh Mehta (Admin)',
    email: 'admin@college.edu',
    phone: '+91 98230 11223',
    department: 'Campus Administration',
    password_hash: adminPasswordHash,
    role: 'admin',
    is_active: 1
  },
  {
    faculty_id: 'FAC-CS-101',
    full_name: 'Dr. Aarav Sharma',
    email: 'faculty1@college.edu',
    phone: '+91 98221 44556',
    department: 'Computer Science & Engineering',
    password_hash: facultyPasswordHash,
    role: 'faculty',
    is_active: 1
  },
  {
    faculty_id: 'FAC-EC-102',
    full_name: 'Prof. Priya Patel',
    email: 'faculty2@college.edu',
    phone: '+91 98222 55667',
    department: 'Electronics & Communication',
    password_hash: facultyPasswordHash,
    role: 'faculty',
    is_active: 1
  },
  {
    faculty_id: 'FAC-ME-103',
    full_name: 'Dr. Vikram Malhotra',
    email: 'faculty3@college.edu',
    phone: '+91 98223 66778',
    department: 'Mechanical Engineering',
    password_hash: facultyPasswordHash,
    role: 'faculty',
    is_active: 1
  },
  {
    faculty_id: 'FAC-CV-104',
    full_name: 'Dr. Ananya Roy',
    email: 'faculty4@college.edu',
    phone: '+91 98224 77889',
    department: 'Civil Engineering',
    password_hash: facultyPasswordHash,
    role: 'faculty',
    is_active: 1
  },
  {
    faculty_id: 'FAC-MG-105',
    full_name: 'Prof. Rajesh Verma',
    email: 'faculty5@college.edu',
    phone: '+91 98225 88990',
    department: 'School of Management',
    password_hash: facultyPasswordHash,
    role: 'faculty',
    is_active: 1
  }
];

const vehicles = [
  { user_email: 'faculty1@college.edu', vehicle_number: 'MH-12-AB-4040', vehicle_type: 'car', vehicle_model: 'Honda City', is_primary: 1 },
  { user_email: 'faculty2@college.edu', vehicle_number: 'MH-12-EV-2024', vehicle_type: 'ev_car', vehicle_model: 'Tata Nexon EV', is_primary: 1 },
  { user_email: 'faculty3@college.edu', vehicle_number: 'MH-14-BT-9901', vehicle_type: 'car', vehicle_model: 'Hyundai Creta', is_primary: 1 },
  { user_email: 'faculty4@college.edu', vehicle_number: 'MH-12-ZZ-3344', vehicle_type: 'motorcycle', vehicle_model: 'Royal Enfield Classic 350', is_primary: 1 },
  { user_email: 'faculty5@college.edu', vehicle_number: 'MH-12-QQ-7711', vehicle_type: 'car', vehicle_model: 'Toyota Innova Crysta', is_primary: 1 }
];

const parking_areas = [
  {
    name: 'Main Academic Block (Area A)',
    code: 'AREA-A',
    description: 'Direct covered access to CS, IT & Central Administration Building',
    floor: 'Ground Level - South Wing',
    total_slots: 12,
    is_active: 1
  },
  {
    name: 'Tech & Engineering Annex (Area B)',
    code: 'AREA-B',
    description: 'Adjacent to Mechanical, Electronics, and Civil Engineering Labs',
    floor: 'Level 1 - Open Canopy',
    total_slots: 10,
    is_active: 1
  },
  {
    name: 'Executive & Research Wing (Area C)',
    code: 'AREA-C',
    description: 'Designated for Senior Faculty, Department Heads, and EV Charging Stations',
    floor: 'Basement Level - Secured Access',
    total_slots: 8,
    is_active: 1
  }
];

const parking_slots = [
  // Area A (12 slots)
  { area_code: 'AREA-A', slot_number: 'A-101', slot_type: 'vip_faculty', status: 'available', notes: 'Reserved for HOD Computer Science' },
  { area_code: 'AREA-A', slot_number: 'A-102', slot_type: 'standard', status: 'available', notes: 'Near staircase 1' },
  { area_code: 'AREA-A', slot_number: 'A-103', slot_type: 'standard', status: 'occupied', notes: 'Currently parked: MH-12-AB-4040' },
  { area_code: 'AREA-A', slot_number: 'A-104', slot_type: 'standard', status: 'reserved', notes: 'Reserved for Afternoon Lecture' },
  { area_code: 'AREA-A', slot_number: 'A-105', slot_type: 'ev_charging', status: 'available', notes: '7.4kW AC Fast Charger' },
  { area_code: 'AREA-A', slot_number: 'A-106', slot_type: 'standard', status: 'available', notes: 'Standard car bay' },
  { area_code: 'AREA-A', slot_number: 'A-107', slot_type: 'disabled', status: 'available', notes: 'Accessible ramp adjacent' },
  { area_code: 'AREA-A', slot_number: 'A-108', slot_type: 'standard', status: 'occupied', notes: 'Occupied session #PS-108' },
  { area_code: 'AREA-A', slot_number: 'A-109', slot_type: 'standard', status: 'available', notes: 'Near elevator bank' },
  { area_code: 'AREA-A', slot_number: 'A-110', slot_type: 'standard', status: 'unavailable', notes: 'Underground sensor maintenance' },
  { area_code: 'AREA-A', slot_number: 'A-111', slot_type: 'standard', status: 'available', notes: 'Wide clearance bay' },
  { area_code: 'AREA-A', slot_number: 'A-112', slot_type: 'standard', status: 'available', notes: 'Near East Gate Exit' },

  // Area B (10 slots)
  { area_code: 'AREA-B', slot_number: 'B-201', slot_type: 'standard', status: 'available', notes: 'Near Tech workshop entrance' },
  { area_code: 'AREA-B', slot_number: 'B-202', slot_type: 'standard', status: 'occupied', notes: 'Active parking session' },
  { area_code: 'AREA-B', slot_number: 'B-203', slot_type: 'standard', status: 'available', notes: 'Standard 4-wheeler slot' },
  { area_code: 'AREA-B', slot_number: 'B-204', slot_type: 'ev_charging', status: 'reserved', notes: 'Reserved for Prof. Priya Patel' },
  { area_code: 'AREA-B', slot_number: 'B-205', slot_type: 'standard', status: 'available', notes: 'Shaded bay' },
  { area_code: 'AREA-B', slot_number: 'B-206', slot_type: 'standard', status: 'available', notes: 'Solar canopy shelter' },
  { area_code: 'AREA-B', slot_number: 'B-207', slot_type: 'standard', status: 'unavailable', notes: 'Floor repaint in progress' },
  { area_code: 'AREA-B', slot_number: 'B-208', slot_type: 'standard', status: 'available', notes: 'Quick turnaround slot' },
  { area_code: 'AREA-B', slot_number: 'B-209', slot_type: 'standard', status: 'available', notes: 'Opposite CAD Lab' },
  { area_code: 'AREA-B', slot_number: 'B-210', slot_type: 'standard', status: 'occupied', notes: 'Active session' },

  // Area C (8 slots)
  { area_code: 'AREA-C', slot_number: 'C-301', slot_type: 'vip_faculty', status: 'reserved', notes: 'Dean of Academics bay' },
  { area_code: 'AREA-C', slot_number: 'C-302', slot_type: 'ev_charging', status: 'available', notes: '22kW DC Dual Gun' },
  { area_code: 'AREA-C', slot_number: 'C-303', slot_type: 'standard', status: 'available', notes: 'Executive conference bay' },
  { area_code: 'AREA-C', slot_number: 'C-304', slot_type: 'standard', status: 'occupied', notes: 'Parked: MH-12-QQ-7711' },
  { area_code: 'AREA-C', slot_number: 'C-305', slot_type: 'disabled', status: 'available', notes: 'ADA compliant wide berth' },
  { area_code: 'AREA-C', slot_number: 'C-306', slot_type: 'standard', status: 'available', notes: 'Adjacent to elevator' },
  { area_code: 'AREA-C', slot_number: 'C-307', slot_type: 'standard', status: 'reserved', notes: 'Scheduled allocation' },
  { area_code: 'AREA-C', slot_number: 'C-308', slot_type: 'standard', status: 'unavailable', notes: 'Emergency exit clearance' }
];

const requirements = [
  { req_id: 'REQ-01', title: 'Faculty Registration', description: 'System shall allow faculty members to register with full name, faculty ID, department, email, phone, and password.', priority: 'High', module: 'Authentication', implementation_status: 'Implemented', linked_test_id: 'TC-01', verification_status: 'Verified' },
  { req_id: 'REQ-02', title: 'Duplicate Credential Prevention', description: 'System shall reject registrations with duplicate email address or faculty ID.', priority: 'High', module: 'Authentication', implementation_status: 'Implemented', linked_test_id: 'TC-02', verification_status: 'Verified' },
  { req_id: 'REQ-03', title: 'Secure Login & JWT Issuance', description: 'System shall authenticate faculty and admin users using bcrypt password hashing and JWT token issuance.', priority: 'High', module: 'Authentication', implementation_status: 'Implemented', linked_test_id: 'TC-03', verification_status: 'Verified' },
  { req_id: 'REQ-04', title: 'Invalid Credential Handling', description: 'System shall display clear error messages for incorrect password or non-existent username without revealing stack traces.', priority: 'Medium', module: 'Authentication', implementation_status: 'Implemented', linked_test_id: 'TC-04', verification_status: 'Verified' },
  { req_id: 'REQ-05', title: 'Role-Based Access Control (RBAC)', description: 'System shall restrict administrative routes and APIs to users with admin role only.', priority: 'High', module: 'Security', implementation_status: 'Implemented', linked_test_id: 'TC-05', verification_status: 'Verified' },
  { req_id: 'REQ-06', title: 'Faculty Dashboard Overview', description: 'Faculty dashboard shall display active session, quick statistics, upcoming reservations, and vehicle details.', priority: 'High', module: 'Faculty Portal', implementation_status: 'Implemented', linked_test_id: 'TC-18', verification_status: 'Verified' },
  { req_id: 'REQ-07', title: 'Parking Area Catalog', description: 'System shall display all parking areas with location floor, code, and total capacity.', priority: 'High', module: 'Parking Management', implementation_status: 'Implemented', linked_test_id: 'TC-15', verification_status: 'Verified' },
  { req_id: 'REQ-08', title: 'Color-Coded Slot Grid', description: 'System shall display slots in a grid layout with colors: Green (Available), Red (Occupied), Blue (Reserved), Grey (Unavailable).', priority: 'High', module: 'Parking Management', implementation_status: 'Implemented', linked_test_id: 'TC-15', verification_status: 'Verified' },
  { req_id: 'REQ-09', title: 'Filter Slots by Area and Type', description: 'System shall permit filtering slots by parking area, slot type (standard, EV, disabled, VIP), and status.', priority: 'Medium', module: 'Parking Management', implementation_status: 'Implemented', linked_test_id: 'TC-06', verification_status: 'Verified' },
  { req_id: 'REQ-10', title: 'Slot Reservation Workflow', description: 'Faculty shall be able to select an available slot, choose date/time range, and confirm reservation.', priority: 'High', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-06', verification_status: 'Verified' },
  { req_id: 'REQ-11', title: 'Occupied Slot Booking Rejection', description: 'System shall prevent users from selecting or reserving slots marked occupied or unavailable.', priority: 'High', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-07', verification_status: 'Verified' },
  { req_id: 'REQ-12', title: 'Double Booking Prevention', description: 'System shall execute atomic concurrency checks to ensure a slot cannot have overlapping active reservations.', priority: 'High', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-08', verification_status: 'Verified' },
  { req_id: 'REQ-13', title: 'Unique Booking ID Generation', description: 'System shall generate an alphanumeric unique booking reference ID (e.g., PE-YYYYMMDD-XXXX) for each reservation.', priority: 'High', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-10', verification_status: 'Verified' },
  { req_id: 'REQ-14', title: 'QR Code Generation', description: 'System shall automatically generate a verifiable QR code containing booking token/ID upon confirmation.', priority: 'High', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-10', verification_status: 'Verified' },
  { req_id: 'REQ-15', title: 'Booking Cancellation', description: 'Faculty shall be able to cancel pending/confirmed bookings prior to parking entry, releasing the slot.', priority: 'Medium', module: 'Reservation', implementation_status: 'Implemented', linked_test_id: 'TC-09', verification_status: 'Verified' },
  { req_id: 'REQ-16', title: 'Camera QR Code Scanning', description: 'System shall support browser-based camera scanning of parking QR codes at entry and exit gates.', priority: 'High', module: 'Gate Management', implementation_status: 'Implemented', linked_test_id: 'TC-11', verification_status: 'Verified' },
  { req_id: 'REQ-17', title: 'Manual Booking ID Gate Entry', description: 'System shall support manual alphanumeric booking ID verification for devices without camera access.', priority: 'High', module: 'Gate Management', implementation_status: 'Implemented', linked_test_id: 'TC-11', verification_status: 'Verified' },
  { req_id: 'REQ-18', title: 'QR Verification & Timing Checks', description: 'System shall validate that booking is active, slot matches, and time is within permitted window before gate entry.', priority: 'High', module: 'Gate Management', implementation_status: 'Implemented', linked_test_id: 'TC-11', verification_status: 'Verified' },
  { req_id: 'REQ-19', title: 'Invalid QR / Token Rejection', description: 'System shall reject tampered, cancelled, expired, or non-existent QR codes and display error reasons.', priority: 'High', module: 'Gate Management', implementation_status: 'Implemented', linked_test_id: 'TC-12', verification_status: 'Verified' },
  { req_id: 'REQ-20', title: 'Vehicle Entry Recording', description: 'System shall log entry timestamp, create active parking session, and set slot status to Occupied (Red).', priority: 'High', module: 'Parking Sessions', implementation_status: 'Implemented', linked_test_id: 'TC-13', verification_status: 'Verified' },
  { req_id: 'REQ-21', title: 'Vehicle Exit Recording', description: 'System shall record exit timestamp, close active parking session, and release slot status back to Available.', priority: 'High', module: 'Parking Sessions', implementation_status: 'Implemented', linked_test_id: 'TC-14', verification_status: 'Verified' },
  { req_id: 'REQ-22', title: 'Real-Time Availability Updates', description: 'System shall broadcast status changes via WebSocket / polling so slot grids update without manual reload.', priority: 'High', module: 'Real-Time Sync', implementation_status: 'Implemented', linked_test_id: 'TC-15', verification_status: 'Verified' },
  { req_id: 'REQ-23', title: 'In-App Notifications', description: 'System shall generate in-app notification alerts for booking, cancellation, allocation, entry, and exit.', priority: 'Medium', module: 'Notifications', implementation_status: 'Implemented', linked_test_id: 'TC-06', verification_status: 'Verified' },
  { req_id: 'REQ-24', title: 'Faculty Profile & Vehicle Management', description: 'Faculty shall be able to update their phone, department, and add/edit registered vehicle numbers.', priority: 'Medium', module: 'Faculty Portal', implementation_status: 'Implemented', linked_test_id: 'TC-18', verification_status: 'Verified' },
  { req_id: 'REQ-25', title: 'Admin Faculty Account Management', description: 'Administrator shall be able to list, search, filter, view parking history, and activate/deactivate faculty accounts.', priority: 'High', module: 'Administration', implementation_status: 'Implemented', linked_test_id: 'TC-18', verification_status: 'Verified' },
  { req_id: 'REQ-26', title: 'Admin Slot & Area Configuration', description: 'Administrator shall be able to add new parking areas and slots, edit configurations, and disable slots safely.', priority: 'High', module: 'Administration', implementation_status: 'Implemented', linked_test_id: 'TC-16', verification_status: 'Verified' },
  { req_id: 'REQ-27', title: 'Admin Direct Allocation Management', description: 'Administrator shall be able to allocate slots to faculty, modify allocations, and resolve conflicts.', priority: 'High', module: 'Administration', implementation_status: 'Implemented', linked_test_id: 'TC-17', verification_status: 'Verified' },
  { req_id: 'REQ-28', title: 'Manual Occupancy Override', description: 'Administrator shall have ability to manually toggle slot occupancy for on-the-spot adjustments.', priority: 'Medium', module: 'Administration', implementation_status: 'Implemented', linked_test_id: 'TC-15', verification_status: 'Verified' },
  { req_id: 'REQ-29', title: 'Interactive Analytics & Reports', description: 'System shall generate interactive charts for slot utilization %, daily booking volume, and peak hours.', priority: 'High', module: 'Analytics', implementation_status: 'Implemented', linked_test_id: 'TC-19', verification_status: 'Verified' },
  { req_id: 'REQ-30', title: 'Audit Trail Logging', description: 'System shall record audit log entries with user ID, role, action, record ID, and timestamp for all critical operations.', priority: 'High', module: 'Audit & Compliance', implementation_status: 'Implemented', linked_test_id: 'TC-13', verification_status: 'Verified' },
  { req_id: 'REQ-31', title: 'Software Quality & Testing Dashboard', description: 'System shall provide RTM, live test execution runner, test case results, and defect/issue tracking.', priority: 'High', module: 'Software Engineering', implementation_status: 'Implemented', linked_test_id: 'TC-01', verification_status: 'Verified' },
  { req_id: 'REQ-32', title: 'System Health & Performance Monitoring', description: 'System shall monitor server uptime, database connection state, API request latency, and system error logs.', priority: 'High', module: 'System Health', implementation_status: 'Implemented', linked_test_id: 'TC-20', verification_status: 'Verified' }
];

const test_cases = [
  { tc_id: 'TC-01', title: 'Faculty registration with valid details', category: 'Functional', description: 'Register a new faculty with valid name, unique faculty ID, email, and vehicle info.', expected_result: 'User created successfully with HTTP 201 and JWT token generated.', actual_result: 'Passed: User account created, vehicle registered, and token returned.', status: 'Passed' },
  { tc_id: 'TC-02', title: 'Faculty registration with duplicate email', category: 'Validation', description: 'Attempt to register a faculty using an existing email address.', expected_result: 'Request rejected with HTTP 400 and duplicate email error message.', actual_result: 'Passed: Duplicate email identified and rejected with message.', status: 'Passed' },
  { tc_id: 'TC-03', title: 'Login with valid credentials', category: 'Security', description: 'Authenticate an existing faculty user with valid email and password.', expected_result: 'HTTP 200 returned with valid JWT token containing user id and role.', actual_result: 'Passed: Password verified via bcrypt; JWT claims match role.', status: 'Passed' },
  { tc_id: 'TC-04', title: 'Login with incorrect password', category: 'Security', description: 'Attempt authentication with valid email and an incorrect password string.', expected_result: 'HTTP 401 Unauthorized with generic "Invalid email or password" response.', actual_result: 'Passed: Access denied with HTTP 401 without stack trace exposure.', status: 'Passed' },
  { tc_id: 'TC-05', title: 'Faculty accessing admin-only routes', category: 'Security', description: 'Faculty bearer token making GET/POST requests to /api/admin endpoints.', expected_result: 'HTTP 403 Forbidden indicating administrative role required.', actual_result: 'Passed: Role middleware intercepted request and denied access.', status: 'Passed' },
  { tc_id: 'TC-06', title: 'Booking an available slot', category: 'Functional', description: 'Select an available slot and reserve for a future valid time duration.', expected_result: 'Booking record created, unique booking ID issued, QR generated, slot marked reserved.', actual_result: 'Passed: Booking persisted, QR data URL generated, slot state synchronized.', status: 'Passed' },
  { tc_id: 'TC-07', title: 'Attempting to book an occupied slot', category: 'Functional', description: 'Send reservation request targeting a slot currently marked occupied.', expected_result: 'Request rejected with HTTP 409 Conflict indicating slot unavailable.', actual_result: 'Passed: Status checked prior to commit; conflict returned.', status: 'Passed' },
  { tc_id: 'TC-08', title: 'Preventing double booking', category: 'Integration', description: 'Submit concurrent overlapping booking requests for the same slot time window.', expected_result: 'First reservation succeeds, second overlapping attempt is rejected.', actual_result: 'Passed: Overlap detection logic safely blocked second reservation.', status: 'Passed' },
  { tc_id: 'TC-09', title: 'Cancelling an existing booking', category: 'Functional', description: 'Cancel a confirmed reservation before entry has taken place.', expected_result: 'Booking status marked cancelled, slot restored to available, notification sent.', actual_result: 'Passed: Slot freed, cancellation logged, notification dispatched.', status: 'Passed' },
  { tc_id: 'TC-10', title: 'Generating a unique booking ID', category: 'Unit', description: 'Verify booking ID format conforms to PE-YYYYMMDD-[A-Z0-9]{4} pattern.', expected_result: 'Unique 16-character alphanumeric reference returned for each call.', actual_result: 'Passed: ID generator produces valid structured reference.', status: 'Passed' },
  { tc_id: 'TC-11', title: 'Validating a valid QR code', category: 'Integration', description: 'Verify scanned QR code payload matching active booking at gate entry.', expected_result: 'HTTP 200 with entry authorized, session created, slot set to occupied.', actual_result: 'Passed: QR payload decoded, verified against active booking record.', status: 'Passed' },
  { tc_id: 'TC-12', title: 'Rejecting an invalid QR code', category: 'Validation', description: 'Submit malformed, expired, or corrupted QR token payload at gate.', expected_result: 'HTTP 400 or 404 with clear rejection reason logged.', actual_result: 'Passed: Rejected with "Invalid or expired QR verification code".', status: 'Passed' },
  { tc_id: 'TC-13', title: 'Recording vehicle entry', category: 'System', description: 'Verify entry timestamp, parking session creation, and audit logging.', expected_result: 'Session status set to ongoing; audit log recorded with gate operator ID.', actual_result: 'Passed: Parking session created, audit record written with timestamp.', status: 'Passed' },
  { tc_id: 'TC-14', title: 'Recording vehicle exit', category: 'System', description: 'Record vehicle exit by scanning booking QR code or manual booking ID.', expected_result: 'Session marked completed, exit timestamp recorded, slot marked available.', actual_result: 'Passed: Session closed, duration calculated, slot freed.', status: 'Passed' },
  { tc_id: 'TC-15', title: 'Updating slot availability', category: 'Functional', description: 'Admin updates slot status manually or via automated lifecycle event.', expected_result: 'Database updated and change event emitted to all connected dashboards.', actual_result: 'Passed: Slot status updated in DB and broadcasted via socket/event.', status: 'Passed' },
  { tc_id: 'TC-16', title: 'Admin adding a new parking slot', category: 'Functional', description: 'Admin submits valid payload to create slot B-211 under Area B.', expected_result: 'New slot created with unique constraint check and HTTP 201 response.', actual_result: 'Passed: Slot created and total_slots count in Area incremented.', status: 'Passed' },
  { tc_id: 'TC-17', title: 'Admin modifying parking allocation', category: 'Functional', description: 'Admin changes allocated slot from A-102 to A-106 for a faculty member.', expected_result: 'Previous slot freed, new slot reserved, faculty notified.', actual_result: 'Passed: Allocation transferred atomically with notification issued.', status: 'Passed' },
  { tc_id: 'TC-18', title: 'Viewing parking history', category: 'Functional', description: 'Faculty retrieves past parking sessions and completed bookings.', expected_result: 'HTTP 200 with chronological list of past sessions including durations.', actual_result: 'Passed: Paginated history returned with entry/exit timestamps.', status: 'Passed' },
  { tc_id: 'TC-19', title: 'Generating parking utilization reports', category: 'System', description: 'Admin requests aggregated utilization metrics, breakdown by area and day.', expected_result: 'Aggregated percentage, peak hours, and area distribution returned.', actual_result: 'Passed: Utilization formulas computed accurately; charts populated.', status: 'Passed' },
  { tc_id: 'TC-20', title: 'Rejecting invalid input', category: 'Validation', description: 'Submit registration payload with missing fields and malformed email syntax.', expected_result: 'HTTP 400 Bad Request with field-level validation errors array.', actual_result: 'Passed: Validation schema caught missing fields and bad syntax.', status: 'Passed' }
];

const defects = [
  { defect_code: 'DEF-001', title: 'Mobile camera auto-focus delay on low-contrast QR codes', description: 'Under dim basement lighting in Area C, some older smartphone cameras took over 3 seconds to lock focus on displayed QR codes. Added manual booking ID fallback input.', severity: 'Medium', status: 'Resolved', reported_by: 'QA Testing Team', assigned_to: 'Frontend Lead' },
  { defect_code: 'DEF-002', title: 'High-concurrency race condition on simultaneous slot selection', description: 'Two faculty members clicking the exact same millisecond could cause duplicate confirmation before locking. Solved with atomic check-and-reserve transaction.', severity: 'High', status: 'Closed', reported_by: 'Performance Audit', assigned_to: 'Backend Engineer' },
  { defect_code: 'DEF-003', title: 'Add reminder notification 15 minutes before booking expiry', description: 'Faculty members requested an alert if their active parking session is nearing scheduled departure time to avoid overstaying.', severity: 'Low', status: 'In Progress', reported_by: 'Prof. Priya Patel', assigned_to: 'Notification Service' }
];

module.exports = {
  users,
  vehicles,
  parking_areas,
  parking_slots,
  requirements,
  test_cases,
  defects
};
