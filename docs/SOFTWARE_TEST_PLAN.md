# Software Test Plan & Execution Results

**Project Name:** ParkEase – Smart Parking Management System  
**Subject:** Software Engineering & Architecture (SEA)  
**Test Framework:** Jest, Supertest, Custom Live Automation Engine  
**Execution Status:** 20/20 Test Cases Passed (100% Pass Rate)  

---

## 1. Test Strategy & Levels
ParkEase employs a multi-tiered software testing strategy aligned with ISO/IEC/IEEE 29119 standards:
1. **Unit Testing:** Validates independent algorithms such as booking ID generation, time interval overlap calculations, and bcrypt hash generation.
2. **Integration Testing:** Tests interactions between Express controllers, database connection pools, transactions, and the QR generation engine.
3. **Functional Testing:** Verifies user and administrative workflows: slot reservation, cancellation, direct allocation, and search filters.
4. **System Testing:** Validates end-to-end vehicle lifecycles from reservation, gate entry check, active timer tracking, to exit departure and slot freeing.
5. **Validation Testing:** Verifies input boundary schemas, duplicate credential rejections, and malformed date handling.
6. **Security Testing:** Verifies JWT signature authenticity, bcrypt password hashing, and Role-Based Access Control (RBAC) route barriers.

---

## 2. Test Execution Summary

| Test Category | Total Test Cases | Passed | Failed | Pass Rate |
| :--- | :---: | :---: | :---: | :---: |
| **Unit Testing** | 2 | 2 | 0 | 100% |
| **Integration Testing** | 3 | 3 | 0 | 100% |
| **Functional Testing** | 7 | 7 | 0 | 100% |
| **System Testing** | 3 | 3 | 0 | 100% |
| **Validation Testing** | 2 | 2 | 0 | 100% |
| **Security Testing** | 3 | 3 | 0 | 100% |
| **Total** | **20** | **20** | **0** | **100%** |

---

## 3. Test Cases & Verification Results (TC-01 to TC-20)

### TC-01: Faculty registration with valid details
- **Category:** Functional
- **Description:** Submit registration payload with valid full name, unique faculty ID, email, phone, and vehicle information.
- **Expected Result:** HTTP 201 Created returned with user profile, vehicle record, and signed JWT token.
- **Actual Result:** Passed. Account persisted in database, password hashed with bcrypt (salt 10), and JWT token returned.
- **Status:** **PASSED**

### TC-02: Faculty registration with duplicate email
- **Category:** Validation
- **Description:** Attempt to register a faculty account using an already registered email address.
- **Expected Result:** HTTP 400 Bad Request with explicit duplicate email error message.
- **Actual Result:** Passed. Database uniqueness check prevented insertion; returned HTTP 400 with duplicate email message.
- **Status:** **PASSED**

### TC-03: Login with valid credentials
- **Category:** Security
- **Description:** Authenticate using valid registered email and plaintext password.
- **Expected Result:** HTTP 200 OK returned with valid JWT bearer token containing user ID and role claims.
- **Actual Result:** Passed. Password verified against stored bcrypt hash; signed JWT payload validated.
- **Status:** **PASSED**

### TC-04: Login with incorrect password
- **Category:** Security
- **Description:** Attempt authentication using valid email and an incorrect password string.
- **Expected Result:** HTTP 401 Unauthorized with generic "Invalid email or password" error.
- **Actual Result:** Passed. Access denied with HTTP 401 without exposing stack traces.
- **Status:** **PASSED**

### TC-05: Faculty accessing admin-only routes
- **Category:** Security
- **Description:** Send HTTP request to `/api/admin/dashboard` using a faculty bearer token.
- **Expected Result:** HTTP 403 Forbidden indicating administrative role is required.
- **Actual Result:** Passed. `requireAdmin` middleware intercepted request and rejected access with HTTP 403.
- **Status:** **PASSED**

### TC-06: Booking an available slot
- **Category:** Functional
- **Description:** Reserve an available slot (Green) with future start and end time windows.
- **Expected Result:** HTTP 201 Created with booking ID, QR code data URL, and slot status set to Reserved (Blue).
- **Actual Result:** Passed. Booking record created, QR code generated, slot status updated to `reserved`.
- **Status:** **PASSED**

### TC-07: Attempting to book an occupied slot
- **Category:** Functional
- **Description:** Submit reservation request targeting a slot currently marked occupied (Red).
- **Expected Result:** HTTP 409 Conflict indicating slot is unavailable.
- **Actual Result:** Passed. Pre-booking status check rejected request with HTTP 409 Conflict.
- **Status:** **PASSED**

### TC-08: Preventing double booking
- **Category:** Integration
- **Description:** Submit concurrent overlapping booking requests for the same parking slot time window.
- **Expected Result:** First reservation succeeds; second overlapping attempt is rejected with HTTP 409.
- **Actual Result:** Passed. Overlap detection algorithm `(startA < endB && startB < endA)` successfully blocked conflict.
- **Status:** **PASSED**

### TC-09: Cancelling an existing booking
- **Category:** Functional
- **Description:** Cancel a confirmed reservation before gate entry.
- **Expected Result:** HTTP 200 OK; booking status marked cancelled; slot status restored to Available (Green).
- **Actual Result:** Passed. Booking updated to cancelled; slot status reset to available; notification sent.
- **Status:** **PASSED**

### TC-10: Generating a unique booking ID
- **Category:** Unit
- **Description:** Validate booking ID format against regex pattern `^PE-\d{8}-[A-Z0-9]{4}$`.
- **Expected Result:** Generates unique 16-character alphanumeric reference adhering to pattern.
- **Actual Result:** Passed. `generateBookingId()` output matches structure (e.g. `PE-20261104-9K4M`).
- **Status:** **PASSED**

### TC-11: Validating a valid QR code
- **Category:** Integration
- **Description:** Scan and submit valid QR code payload matching active booking at campus gate entry.
- **Expected Result:** HTTP 200 OK; gate authorization confirmed; ongoing session created.
- **Actual Result:** Passed. Decoded QR payload verified against booking ID, slot number, and permitted arrival window.
- **Status:** **PASSED**

### TC-12: Rejecting an invalid QR code
- **Category:** Validation
- **Description:** Submit malformed, expired, or corrupted QR token payload at gate terminal.
- **Expected Result:** HTTP 400 or 404 with rejection reason logged.
- **Actual Result:** Passed. Rejected with HTTP 404 "Invalid booking. No matching reservation found."
- **Status:** **PASSED**

### TC-13: Recording vehicle entry
- **Category:** System
- **Description:** Complete vehicle gate entry; check session status, slot occupancy, and audit logs.
- **Expected Result:** `parking_sessions` record created with entry timestamp; slot updated to Occupied (Red).
- **Actual Result:** Passed. Entry logged, session marked ongoing, slot updated to `occupied`, audit logged.
- **Status:** **PASSED**

### TC-14: Recording vehicle exit
- **Category:** System
- **Description:** Record vehicle departure at campus exit gate via QR or booking ID.
- **Expected Result:** Departure timestamp logged; duration calculated; slot status released to Available (Green).
- **Actual Result:** Passed. Session marked completed; duration computed; slot restored to `available`.
- **Status:** **PASSED**

### TC-15: Updating slot availability
- **Category:** Functional
- **Description:** Admin updates slot status manually or via automated lifecycle event.
- **Expected Result:** Database updated and change event emitted to connected dashboards via WebSocket.
- **Actual Result:** Passed. Status committed to database and broadcasted via Socket.IO `slot_updated`.
- **Status:** **PASSED**

### TC-16: Admin adding a new parking slot
- **Category:** Functional
- **Description:** Administrator adds a new slot under a designated parking area.
- **Expected Result:** HTTP 201 Created; slot persists; area total capacity count increments.
- **Actual Result:** Passed. Slot created with unique constraint check; area `total_slots` incremented.
- **Status:** **PASSED**

### TC-17: Admin modifying parking allocation
- **Category:** Functional
- **Description:** Administrator directly allocates a parking slot to a faculty member.
- **Expected Result:** Booking created with type `admin_allocated`; QR pass issued; faculty notified.
- **Actual Result:** Passed. Direct allocation completed atomically; in-app notification delivered.
- **Status:** **PASSED**

### TC-18: Viewing parking history
- **Category:** Functional
- **Description:** Faculty member retrieves past parking sessions and completed durations.
- **Expected Result:** HTTP 200 OK with chronological list of past sessions.
- **Actual Result:** Passed. Paginated list of completed sessions returned with entry/exit timestamps.
- **Status:** **PASSED**

### TC-19: Generating parking utilization reports
- **Category:** System
- **Description:** Administrator requests aggregated utilization metrics, area breakdown, and hourly heatmap.
- **Expected Result:** Aggregated percentage, peak hours curve, and area breakdown returned.
- **Actual Result:** Passed. Utilization formula `((occupied + reserved) / total) * 100` computed accurately.
- **Status:** **PASSED**

### TC-20: Rejecting invalid input
- **Category:** Validation
- **Description:** Submit registration or booking payload with missing mandatory fields.
- **Expected Result:** HTTP 400 Bad Request with field-level error messages.
- **Actual Result:** Passed. Server-side validation schema intercepted missing parameters and returned HTTP 400.
- **Status:** **PASSED**

---

## 4. How to Execute Tests Locally

Run the automated test runner in the backend directory:
```powershell
cd backend
npm.cmd test
```
All 3 test suites (`auth.test.js`, `parking.test.js`, `security_and_gate.test.js`) will execute sequentially and verify all 20 test cases.

