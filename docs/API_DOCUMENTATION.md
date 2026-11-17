# ParkEase – REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Header:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication & User Profile Module

### POST `/auth/register`
- **Description:** Registers a new college faculty member and primary vehicle.
- **Access:** Public
- **Request Body:**
```json
{
  "faculty_id": "FAC-CS-101",
  "full_name": "Dr. Aarav Sharma",
  "email": "faculty1@college.edu",
  "phone": "+91 98221 44556",
  "department": "Computer Science & Engineering",
  "password": "Faculty@123",
  "vehicle_number": "MH-12-AB-4040",
  "vehicle_type": "car",
  "vehicle_model": "Honda City"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Faculty account registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 2,
    "faculty_id": "FAC-CS-101",
    "full_name": "Dr. Aarav Sharma",
    "email": "faculty1@college.edu",
    "role": "faculty",
    "vehicle": { ... }
  }
}
```

### POST `/auth/login`
- **Description:** Authenticates user credentials via bcrypt and issues JWT token.
- **Access:** Public
- **Request Body:**
```json
{
  "email": "admin@college.edu",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": 1,
    "faculty_id": "ADM-001",
    "full_name": "Dr. Suresh Mehta (Admin)",
    "email": "admin@college.edu",
    "role": "admin"
  }
}
```

### GET `/auth/me`
- **Description:** Returns the authenticated user profile, registered vehicles, and active booking.
- **Access:** Protected (Bearer Token)

### PUT `/auth/profile`
- **Description:** Updates faculty contact information and registered vehicle license plate.
- **Access:** Protected (Bearer Token)

### POST `/auth/logout`
- **Description:** Concludes session and logs audit activity.
- **Access:** Protected (Bearer Token)

---

## 2. Parking Search & Reservation Module

### GET `/parking/areas`
- **Description:** Returns all active campus parking areas with slot capacity metrics.
- **Access:** Public / Protected
- **Response (200 OK):**
```json
{
  "success": true,
  "areas": [
    {
      "id": 1,
      "name": "Main Academic Block (Area A)",
      "code": "AREA-A",
      "floor": "Ground Level - South Wing",
      "total_slots": 12,
      "available_slots": 8,
      "occupied_slots": 2,
      "reserved_slots": 1,
      "unavailable_slots": 1,
      "utilization_rate": 25
    }
  ]
}
```

### GET `/parking/slots`
- **Description:** Returns list of parking slots with optional query filters.
- **Query Params:** `area_id`, `status` (available|occupied|reserved|unavailable), `slot_type` (standard|ev_charging|disabled|vip_faculty).
- **Access:** Public / Protected

### GET `/parking/availability`
- **Description:** Aggregated live campus parking summary with latest update timestamp.
- **Access:** Public / Protected

### POST `/parking/bookings`
- **Description:** Creates an atomic parking reservation with concurrency double-booking checks.
- **Access:** Protected (Faculty / Admin)
- **Request Body:**
```json
{
  "slot_id": 5,
  "start_time": "2026-11-04T09:00:00",
  "end_time": "2026-11-04T13:00:00",
  "vehicle_id": 1
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Parking slot reserved successfully!",
  "booking": {
    "id": 14,
    "booking_id": "PE-20261104-9K4M",
    "slot_id": 5,
    "slot_number": "A-105",
    "status": "confirmed",
    "qr_code_image": "data:image/png;base64,..."
  }
}
```

### GET `/parking/bookings`
- **Description:** Returns current user bookings (or all if admin).
- **Access:** Protected

### PUT `/parking/bookings/:id/cancel`
- **Description:** Cancels confirmed booking prior to entry and releases slot status back to available.
- **Access:** Protected

---

## 3. Parking Sessions & Gate Verification Module

### POST `/sessions/entry`
- **Description:** Verifies scanned QR code payload or manual Booking ID at campus entry gate.
- **Access:** Protected (Admin / Gate Controller)
- **Request Body:**
```json
{
  "booking_id": "PE-20261104-9K4M",
  "method": "qr_scan"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Entry authorized! Welcome Dr. Aarav Sharma. Proceed to slot A-105.",
  "session": {
    "id": 3,
    "booking_id": "PE-20261104-9K4M",
    "slot_number": "A-105",
    "entry_time": "2026-11-04 09:15:22",
    "status": "ongoing"
  }
}
```

### POST `/sessions/exit`
- **Description:** Verifies vehicle departure at exit gate, closes session, and frees slot.
- **Access:** Protected (Admin / Gate Controller)
- **Request Body:**
```json
{
  "booking_id": "PE-20261104-9K4M"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Exit confirmed. Total duration: 3.2 hrs (192 mins). Slot A-105 is now freed.",
  "summary": {
    "session_id": 3,
    "booking_id": "PE-20261104-9K4M",
    "slot_number": "A-105",
    "duration_hours": "3.2",
    "duration_minutes": 192
  }
}
```

### GET `/sessions/active`
- **Description:** Returns active ongoing session for faculty or all active sessions for admin.
- **Access:** Protected

### GET `/sessions/history`
- **Description:** Chronological history of completed parking checkouts.
- **Access:** Protected

---

## 4. Administration Module

### GET `/admin/dashboard`
- **Description:** High-level metrics, capacity cards, and live audit feed.
- **Access:** Protected (Admin Role Required)

### GET `/admin/faculty`
- **Description:** List, search, and filter faculty accounts with vehicle details.
- **Access:** Protected (Admin Role Required)

### PUT `/admin/faculty/:id/toggle-status`
- **Description:** Activate or deactivate a faculty account.
- **Access:** Protected (Admin Role Required)

### POST `/admin/slots`
- **Description:** Adds a new parking slot into a specified area.
- **Access:** Protected (Admin Role Required)

### PUT `/admin/slots/:id`
- **Description:** Modifies slot properties or overrides occupancy status manually.
- **Access:** Protected (Admin Role Required)

### DELETE `/admin/slots/:id`
- **Description:** Safely deletes slot if no active reservations or parked vehicles exist.
- **Access:** Protected (Admin Role Required)

### POST `/admin/allocate`
- **Description:** Direct administrative allocation of bay to a faculty member with conflict check.
- **Access:** Protected (Admin Role Required)

### GET `/admin/reports`
- **Description:** Aggregated chart data for Recharts (Donut, Weekly Trends, Area Stacks, Peak Heatmap).
- **Access:** Protected (Admin Role Required)

---

## 5. Software Quality & Engineering Module

### GET `/engineering/requirements`
- **Description:** Returns SRS requirements REQ-01 through REQ-32 with traceability summary.
- **Access:** Public / Protected

### GET `/engineering/test-cases`
- **Description:** Returns test case catalog TC-01 through TC-20+ with execution results.
- **Access:** Public / Protected

### POST `/engineering/run-tests`
- **Description:** Executes live automated assertions and updates database verification status.
- **Access:** Protected (Admin Role Required)

### GET `/engineering/defects`
- **Description:** Lists tracked defects and issues.
- **Access:** Public / Protected

### POST `/engineering/defects`
- **Description:** Logs a new software defect with severity and assignment.
- **Access:** Protected

### PUT `/engineering/defects/:id`
- **Description:** Updates defect status (`Open`, `In Progress`, `Resolved`, `Closed`).
- **Access:** Protected (Admin Role Required)

### GET `/engineering/audit-logs`
- **Description:** Paginated system compliance audit logs.
- **Access:** Protected (Admin Role Required)

### GET `/engineering/health` & GET `/health`
- **Description:** Real-time health monitoring of backend server, database engine (MySQL/SQLite), query latency, API traffic, and system error logs.
- **Access:** Public / Protected

