# ParkEase – System Architecture & Data Flow

This document details the high-level architecture, module decomposition, and data flow of **ParkEase – Smart Parking Management System**, developed for **Software Engineering and Architecture (SEA)**.

---

## 1. System Architecture Diagram

ParkEase is built on a 3-tier modular, service-oriented architecture:
1. **Presentation Tier (Frontend):** React.js single-page application styled with Tailwind CSS, Lucide icons, and Recharts visualization.
2. **Application Tier (Backend):** Node.js Express.js RESTful API gateway integrated with a WebSocket (Socket.IO) push notification service.
3. **Data Tier (Persistence):** Relational MySQL database engine (InnoDB) with foreign key constraints, indexing, transactions, and embedded SQLite fallback.

```mermaid
flowchart TD
    subgraph PresentationTier["Presentation Tier (Client Layer)"]
        F1["Faculty Web Portal (React / Tailwind)"]
        F2["Admin Control Dashboard (React / Recharts)"]
        F3["Gate QR Terminal Scanner (HTML5-QRCode)"]
    end

    subgraph APIGateway["Application Tier (Node.js / Express REST API)"]
        direction TB
        GW["Express HTTP / REST API Gateway (Port 5000)"]
        SEC["Security & RBAC Middleware (JWT / bcrypt)"]
        CTR["Controller Layer (Auth, Parking, Sessions, Admin, SEA Quality)"]
        WS["Socket.IO Real-Time Availability Engine"]
        SRV["Service Layer (QR Code Generator, Test Suite Runner)"]
        LOG["Audit Logger & Request Counter (Health Instrumentation)"]
    end

    subgraph DataTier["Data Tier (Relational Persistence Layer)"]
        direction TB
        DB_POOL["Connection Pool Manager (mysql2 / promise)"]
        MYSQL[("MySQL Database (parkease_db - InnoDB)")]
        SQLITE[("Embedded Relational Fallback (Node.js SQLite Engine)")]
    end

    F1 -->|"HTTP REST API (JWT)"| GW
    F2 -->|"HTTP REST API (Admin JWT)"| GW
    F3 -->|"Gate Scan Verification"| GW
    F1 <-->|"WebSocket Status Sync"| WS
    F2 <-->|"WebSocket Status Sync"| WS

    GW --> SEC
    SEC --> CTR
    CTR --> SRV
    CTR --> LOG
    CTR --> DB_POOL
    DB_POOL -->|"Primary Relational DB"| MYSQL
    DB_POOL -.->|"Zero-Config Offline Fallback"| SQLITE
```

---

## 2. Layered Architecture Breakdown

```mermaid
graph TD
    UI["User Interface (React Pages & Components)"]
    STATE["State & Context Layer (AuthContext, SocketContext, NotificationContext)"]
    API["API Client Layer (Axios Interceptors / Bearer Tokens)"]
    ROUTER["Express Routes (/api/auth, /api/parking, /api/sessions, /api/admin, /api/engineering)"]
    MW["Middleware (authenticateToken, requireAdmin, requestCounter, auditLogger)"]
    CTRL["Controllers (Business Logic & Validation)"]
    SVC["Services (QR Generator, Test Runner Engine)"]
    REPO["Database Repository (Universal SQL Query Adapter)"]
    STORAGE[("Relational Database - MySQL / SQLite")]

    UI --> STATE
    STATE --> API
    API -->|"HTTP / REST"| ROUTER
    ROUTER --> MW
    MW --> CTRL
    CTRL --> SVC
    CTRL --> REPO
    REPO --> STORAGE
```

---

## 3. Data Flow Diagram (DFD)

### Level 0: Context Diagram

```mermaid
flowchart LR
    FACULTY["Faculty Member"]
    ADMIN["Campus Administrator"]
    GATE["Gate Controller Scanner"]
    SYSTEM["ParkEase Parking Platform"]

    FACULTY -->|"Registration / Login Credentials"| SYSTEM
    FACULTY -->|"Slot Booking Request"| SYSTEM
    SYSTEM -->|"Booking ID, QR Pass & Notifications"| FACULTY

    ADMIN -->|"Area / Slot Configuration"| SYSTEM
    ADMIN -->|"Direct Allocation Requests"| SYSTEM
    SYSTEM -->|"Utilization Analytics & Audit Logs"| ADMIN

    GATE -->|"Scanned QR Payload / Booking ID"| SYSTEM
    SYSTEM -->|"Entry/Exit Authorization & Slot State Transition"| GATE
```

### Level 1: Functional Data Flow Diagram

```mermaid
flowchart TD
    subgraph Users
        U1["Faculty"]
        U2["Administrator"]
    end

    subgraph Processes
        P1["1.0 Authentication & RBAC"]
        P2["2.0 Parking Availability Query"]
        P3["3.0 Reservation & Concurrency Validation"]
        P4["4.0 Gate Entry Verification"]
        P5["5.0 Gate Exit & Session Close"]
        P6["6.0 Software Quality & Test Runner"]
    end

    subgraph DataStores["Data Stores"]
        D1[("Users & Vehicles Store")]
        D2[("Parking Areas & Slots Store")]
        D3[("Bookings & QR Tokens Store")]
        D4[("Parking Sessions Store")]
        D5[("Audit Logs Store")]
        D6[("RTM & Test Cases Store")]
    end

    U1 -->|"1. Register / Login"| P1
    P1 <-->|"Verify & Hash Password"| D1
    P1 -->|"Log Session Activity"| D5

    U1 -->|"2. Browse Slots"| P2
    P2 <-->|"Fetch Available Slots"| D2

    U1 -->|"3. Reserve Slot"| P3
    P3 -->|"Check Overlap Conflict"| D3
    P3 -->|"Lock Slot (Reserved)"| D2
    P3 -->|"Generate QR Pass"| D3
    P3 -->|"Record Audit Event"| D5

    U2 -->|"4. Scan QR at Gate In"| P4
    P4 <-->|"Verify Token & Arrival Window"| D3
    P4 -->|"Create Ongoing Session"| D4
    P4 -->|"Mark Slot Occupied (Red)"| D2
    P4 -->|"Log Entry Event"| D5

    U2 -->|"5. Scan QR at Gate Out"| P5
    P5 <-->|"Lookup Ongoing Session"| D4
    P5 -->|"Compute Duration & Complete Session"| D4
    P5 -->|"Release Slot Available (Green)"| D2
    P5 -->|"Log Exit Event"| D5

    U2 -->|"6. Trigger Live Automated Tests"| P6
    P6 <-->|"Update Test Status & Verification"| D6
```

