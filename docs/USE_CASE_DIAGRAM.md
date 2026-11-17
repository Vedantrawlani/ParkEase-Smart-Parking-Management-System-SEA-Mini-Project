# ParkEase – Use Case Diagram

This document describes the primary use cases and actor boundaries for the **ParkEase – Smart Parking Management System**.

## 1. Actors
- **Faculty Member:** Registered teaching, research, or department staff accessing the web application to view parking availability, reserve slots, view QR passes, monitor active parking sessions, review history, and manage profile/vehicles.
- **Administrator:** Campus administrative personnel and gate operators responsible for slot allocation, occupancy override, parking area/slot inventory management, faculty account activation, gate entry/exit verification, reports generation, and software quality monitoring.

---

## 2. Mermaid Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        F["Faculty Member"]
        A["Campus Administrator"]
    end

    subgraph FacultyPortal["Faculty Portal Use Cases"]
        UC01["UC-01: Register Faculty Account"]
        UC02["UC-02: Login with JWT"]
        UC03["UC-03: View Live Parking Grid"]
        UC04["UC-04: Reserve Parking Slot"]
        UC05["UC-05: Receive Booking ID & QR Pass"]
        UC06["UC-06: Cancel Existing Booking"]
        UC07["UC-07: Monitor Active Session Timer"]
        UC08["UC-08: View Parking Session History"]
        UC09["UC-09: Manage Profile & Vehicles"]
        UC10["UC-10: Receive In-App Notifications"]
    end

    subgraph AdminPortal["Admin Portal Use Cases"]
        UC11["UC-11: Manage Faculty Accounts"]
        UC12["UC-12: Configure Parking Areas & Slots"]
        UC13["UC-13: Manual Occupancy Override"]
        UC14["UC-14: Direct Slot Allocation to Faculty"]
        UC15["UC-15: Camera/Manual Gate Entry Verification"]
        UC16["UC-16: Camera/Manual Gate Exit Verification"]
        UC17["UC-17: Generate Utilization Reports"]
        UC18["UC-18: Inspect Compliance Audit Logs"]
        UC19["UC-19: Track Requirements (RTM)"]
        UC20["UC-20: Run Live Automated Test Suite"]
        UC21["UC-21: Log & Assign Software Defects"]
        UC22["UC-22: Monitor System Health & Latency"]
    end

    F --> UC01
    F --> UC02
    F --> UC03
    F --> UC04
    F --> UC05
    F --> UC06
    F --> UC07
    F --> UC08
    F --> UC09
    F --> UC10

    A --> UC02
    A --> UC11
    A --> UC12
    A --> UC13
    A --> UC14
    A --> UC15
    A --> UC16
    A --> UC17
    A --> UC18
    A --> UC19
    A --> UC20
    A --> UC21
    A --> UC22
```

---

## 3. Key Use Case Descriptions

### UC-04: Reserve Parking Slot
- **Primary Actor:** Faculty Member
- **Precondition:** Faculty is authenticated with a valid JWT token; slot status is `available`.
- **Main Flow:**
  1. Faculty browses campus areas and selects an available green slot.
  2. Faculty specifies parking date, start time, end time, and registered vehicle.
  3. System initiates atomic concurrency check to ensure no overlapping confirmed/active bookings exist.
  4. System creates booking record with unique ID (`PE-YYYYMMDD-XXXX`).
  5. System generates base64 QR code encoding booking metadata.
  6. Slot status transitions to `reserved` (Blue) and real-time socket event is broadcasted.
  7. In-app confirmation notification is dispatched to faculty.

### UC-15: Gate Entry Verification
- **Primary Actor:** Administrator / Gate Controller
- **Precondition:** Faculty vehicle arrives at campus gate with digital QR pass.
- **Main Flow:**
  1. Gate operator points camera at QR code or inputs the Booking ID manually.
  2. Backend decodes payload and queries booking record.
  3. System validates booking is confirmed, slot matches, and current time is within permitted arrival window.
  4. System logs vehicle entry timestamp and creates ongoing `parking_sessions` record.
  5. Slot status transitions to `occupied` (Red).
  6. Audit activity is logged, and entry confirmation notification is sent to faculty.

### UC-16: Gate Exit Verification
- **Primary Actor:** Administrator / Gate Controller
- **Precondition:** Vehicle is currently parked with an active session.
- **Main Flow:**
  1. QR code is scanned or session ID is verified at gate exit.
  2. System records departure timestamp and calculates duration (hours/minutes).
  3. Parking session is updated to `completed`.
  4. Slot status transitions back to `available` (Green).
  5. Real-time availability updates on all dashboards instantly.

