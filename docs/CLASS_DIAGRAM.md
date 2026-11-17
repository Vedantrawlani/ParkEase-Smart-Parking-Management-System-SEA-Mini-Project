# ParkEase – Class Diagram

This document illustrates the object-oriented design and domain class relationships of the **ParkEase – Smart Parking Management System**.

## Mermaid Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string facultyId
        +string fullName
        +string email
        +string phone
        +string department
        +string passwordHash
        +string role
        +bool isActive
        +datetime createdAt
        +register()
        +login()
        +updateProfile()
    }

    class Vehicle {
        +int id
        +int userId
        +string vehicleNumber
        +string vehicleType
        +string vehicleModel
        +bool isPrimary
        +datetime createdAt
    }

    class ParkingArea {
        +int id
        +string name
        +string code
        +string description
        +string floor
        +int totalSlots
        +bool isActive
        +getUtilizationRate()
    }

    class ParkingSlot {
        +int id
        +string slotNumber
        +int areaId
        +string slotType
        +string status
        +bool isActive
        +string notes
        +datetime lastStatusChange
        +isAvailable()
        +updateStatus(newStatus)
    }

    class Booking {
        +int id
        +string bookingId
        +int userId
        +int slotId
        +int vehicleId
        +datetime startTime
        +datetime endTime
        +string status
        +string qrCodeData
        +string qrCodeImage
        +string bookingType
        +cancel(reason)
        +isOverlapping(start, end)
    }

    class ParkingSession {
        +int id
        +int bookingId
        +int slotId
        +int userId
        +datetime entryTime
        +datetime exitTime
        +string status
        +string verifiedByMethod
        +string remarks
        +calculateDuration()
    }

    class Notification {
        +int id
        +int userId
        +string title
        +string message
        +string type
        +bool isRead
        +datetime createdAt
        +markAsRead()
    }

    class AuditLog {
        +int id
        +int userId
        +string userRole
        +string userName
        +string action
        +string recordId
        +string details
        +string ipAddress
        +datetime timestamp
    }

    class Requirement {
        +string reqId
        +string title
        +string description
        +string priority
        +string module
        +string implementationStatus
        +string linkedTestId
        +string verificationStatus
    }

    class TestCase {
        +string tcId
        +string title
        +string category
        +string description
        +string expectedResult
        +string actualResult
        +string status
        +datetime executionDate
        +execute()
    }

    class Defect {
        +int id
        +string defectCode
        +string title
        +string description
        +string severity
        +string status
        +string reportedBy
        +string assignedTo
        +updateStatus(newStatus)
    }

    User "1" --> "*" Vehicle : owns
    User "1" --> "*" Booking : creates
    User "1" --> "*" Notification : receives
    User "1" --> "*" AuditLog : generates
    ParkingArea "1" --> "*" ParkingSlot : contains
    ParkingSlot "1" --> "*" Booking : allocated_to
    Booking "1" --> "0..1" ParkingSession : triggers
    Vehicle "0..1" --> "*" Booking : used_in
    Requirement "1" ..> "1" TestCase : verified_by
```

---

## Class Responsibility & Collaboration
- **`User`**: Base entity representing registered faculty members and administrators with secure JWT credentials and role attributes.
- **`Vehicle`**: Represents faculty 4-wheelers, 2-wheelers, and EVs associated with campus parking authorizations.
- **`ParkingArea`**: Represents campus zones (e.g. Main Academic Block, Tech Annex, Executive Wing) with floor information.
- **`ParkingSlot`**: Encapsulates slot state transitions: `available` (Green), `occupied` (Red), `reserved` (Blue), and `unavailable` (Grey).
- **`Booking`**: Maintains reservation time windows, atomic overlap collision algorithms, and generated QR code payloads.
- **`ParkingSession`**: Represents active vehicles parked inside the campus gate from entry timestamp to exit timestamp.
- **`Requirement` & `TestCase`**: Powers the **Software Engineering Traceability Matrix (RTM)** linking REQ-01 through REQ-32 directly with automated verification test cases TC-01 to TC-20.

