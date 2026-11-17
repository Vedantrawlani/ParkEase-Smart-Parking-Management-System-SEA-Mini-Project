# ParkEase – Entity-Relationship (ER) Diagram

This document contains the Entity-Relationship (ER) diagram for the **ParkEase – Smart Parking Management System** normalized relational database (`parkease_db`).

## Mermaid ER Diagram

```mermaid
erDiagram
    USERS ||--o{ VEHICLES : "owns"
    USERS ||--o{ BOOKINGS : "creates"
    USERS ||--o{ PARKING_SESSIONS : "attends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    PARKING_AREAS ||--|{ PARKING_SLOTS : "contains"
    PARKING_SLOTS ||--o{ BOOKINGS : "reserved_for"
    PARKING_SLOTS ||--o{ PARKING_SESSIONS : "occupied_by"

    BOOKINGS ||--o| PARKING_SESSIONS : "starts"
    VEHICLES ||--o{ BOOKINGS : "parked_via"

    REQUIREMENTS ||--|| TEST_CASES : "verified_by"

    USERS {
        int id PK
        varchar faculty_id UK
        varchar full_name
        varchar email UK
        varchar phone
        varchar department
        varchar password_hash
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    VEHICLES {
        int id PK
        int user_id FK
        varchar vehicle_number
        enum vehicle_type
        varchar vehicle_model
        boolean is_primary
        timestamp created_at
    }

    PARKING_AREAS {
        int id PK
        varchar name
        varchar code UK
        varchar description
        varchar floor
        int total_slots
        boolean is_active
        timestamp created_at
    }

    PARKING_SLOTS {
        int id PK
        varchar slot_number
        int area_id FK
        enum slot_type
        enum status
        boolean is_active
        varchar notes
        timestamp last_status_change
    }

    BOOKINGS {
        int id PK
        varchar booking_id UK
        int user_id FK
        int slot_id FK
        int vehicle_id FK
        datetime start_time
        datetime end_time
        enum status
        text qr_code_data
        mediumtext qr_code_image
        enum booking_type
        datetime cancelled_at
        varchar cancellation_reason
        timestamp created_at
    }

    PARKING_SESSIONS {
        int id PK
        int booking_id FK
        int slot_id FK
        int user_id FK
        datetime entry_time
        datetime exit_time
        enum status
        enum verified_by_method
        varchar remarks
        timestamp created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar title
        text message
        enum type
        boolean is_read
        varchar link
        timestamp created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        varchar user_role
        varchar user_name
        varchar action
        varchar record_id
        text details
        varchar ip_address
        timestamp timestamp
    }

    REQUIREMENTS {
        varchar req_id PK
        varchar title
        text description
        enum priority
        varchar module
        enum implementation_status
        varchar linked_test_id
        enum verification_status
        timestamp updated_at
    }

    TEST_CASES {
        varchar tc_id PK
        varchar title
        enum category
        text description
        text expected_result
        text actual_result
        enum status
        timestamp execution_date
    }

    DEFECTS {
        int id PK
        varchar defect_code UK
        varchar title
        text description
        enum severity
        enum status
        varchar reported_by
        varchar assigned_to
        timestamp created_at
        timestamp updated_at
    }
```

---

## Relational Constraints & Integrity
1. **Uniqueness:**
   - `users.faculty_id` and `users.email` are strictly unique.
   - `parking_slots (area_id, slot_number)` has a composite unique constraint preventing identical slot numbers within the same campus parking area.
   - `bookings.booking_id` is unique across all reservations.
2. **Referential Integrity:**
   - `vehicles.user_id` cascades on user deletion.
   - `parking_slots.area_id` uses `RESTRICT` to prevent accidental deletion of areas containing active bays.
   - `bookings.slot_id` uses `RESTRICT` to prevent deleting slots with active reservations.
   - `parking_sessions.booking_id` has a 1-to-1 relationship with unique foreign key constraint.
3. **Audit Trail:**
   - `audit_logs.user_id` sets to `NULL` on user deletion to preserve the forensic audit record integrity.

