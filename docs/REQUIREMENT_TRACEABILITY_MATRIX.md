# Requirement Traceability Matrix (RTM)

**Project Name:** ParkEase – Smart Parking Management System  
**Subject:** Software Engineering & Architecture (SEA)  
**SRS Version:** 1.0  
**Status:** 100% Implemented & Verified  

---

## 1. Traceability Summary

| Metric | Target | Current Status | Coverage |
| :--- | :---: | :---: | :---: |
| **Total SRS Requirements** | 32 | 32 | 100% |
| **Implemented Requirements** | 32 | 32 | 100% |
| **Pending Implementation** | 0 | 0 | 0% |
| **Verified Requirements** | 32 | 32 | 100% |
| **Requirements with Failed Tests** | 0 | 0 | 0% |

---

## 2. Detailed Traceability Matrix (REQ-01 to REQ-32)

| Req ID | Requirement Title & Scope | Priority | Associated Module | Implementation Status | Linked Test ID | Verification Status |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| **REQ-01** | Faculty registration with full name, faculty ID, department, email, phone, and vehicle details | High | Authentication | Implemented | TC-01 | Verified |
| **REQ-02** | Validation of duplicate email address and faculty ID rejection | High | Authentication | Implemented | TC-02 | Verified |
| **REQ-03** | Secure login, bcrypt password hashing, and JWT token issuance | High | Authentication | Implemented | TC-03 | Verified |
| **REQ-04** | Error handling for incorrect credentials without stack trace leakage | Medium | Authentication | Implemented | TC-04 | Verified |
| **REQ-05** | Role-Based Access Control (RBAC) restricting admin-only routes | High | Security | Implemented | TC-05 | Verified |
| **REQ-06** | Faculty dashboard displaying active session, stats, and quick actions | High | Faculty Portal | Implemented | TC-18 | Verified |
| **REQ-07** | Campus parking area catalog with floor levels and total capacities | High | Parking Management | Implemented | TC-15 | Verified |
| **REQ-08** | Color-coded slot grid: Green (Available), Red (Occupied), Blue (Reserved), Grey (Unavailable) | High | Parking Management | Implemented | TC-15 | Verified |
| **REQ-09** | Filter parking slots by area, status, and slot type (Standard, EV, Accessible, VIP) | Medium | Parking Management | Implemented | TC-06 | Verified |
| **REQ-10** | Slot reservation workflow with date and time duration selection | High | Reservation | Implemented | TC-06 | Verified |
| **REQ-11** | Prevent faculty from reserving slots marked occupied or unavailable | High | Reservation | Implemented | TC-07 | Verified |
| **REQ-12** | Atomic double-booking prevention on overlapping reservation time intervals | High | Reservation | Implemented | TC-08 | Verified |
| **REQ-13** | Unique alphanumeric booking reference ID generation (`PE-YYYYMMDD-XXXX`) | High | Reservation | Implemented | TC-10 | Verified |
| **REQ-14** | Verifiable QR code generation encoding booking reference and metadata | High | Reservation | Implemented | TC-10 | Verified |
| **REQ-15** | Cancellation of confirmed bookings releasing slot status back to Available | Medium | Reservation | Implemented | TC-09 | Verified |
| **REQ-16** | Browser camera QR code scanning at campus entry and exit gates | High | Gate Management | Implemented | TC-11 | Verified |
| **REQ-17** | Manual Booking ID gate entry alternative for devices without camera access | High | Gate Management | Implemented | TC-11 | Verified |
| **REQ-18** | Gate verification timing checks allowing permitted arrival buffer | High | Gate Management | Implemented | TC-11 | Verified |
| **REQ-19** | Rejection of invalid, tampered, expired, or non-existent QR payloads | High | Gate Management | Implemented | TC-12 | Verified |
| **REQ-20** | Vehicle entry recording, ongoing session creation, and slot update to Occupied | High | Parking Sessions | Implemented | TC-13 | Verified |
| **REQ-21** | Vehicle exit recording, departure timestamp logging, and slot release to Available | High | Parking Sessions | Implemented | TC-14 | Verified |
| **REQ-22** | Real-time availability updates via WebSocket / polling synchronization | High | Real-Time Sync | Implemented | TC-15 | Verified |
| **REQ-23** | In-app notification alerts for booking, cancellation, allocation, entry, and exit | Medium | Notifications | Implemented | TC-06 | Verified |
| **REQ-24** | Faculty profile and registered vehicle management (plate, type, model) | Medium | Faculty Portal | Implemented | TC-18 | Verified |
| **REQ-25** | Administrator faculty management, search, parking history, and account activation toggle | High | Administration | Implemented | TC-18 | Verified |
| **REQ-26** | Administrator slot and area configuration, editing, and safe deletion checks | High | Administration | Implemented | TC-16 | Verified |
| **REQ-27** | Administrator direct slot allocation to faculty members with conflict avoidance | High | Administration | Implemented | TC-17 | Verified |
| **REQ-28** | Manual occupancy status override for on-the-spot administrative adjustments | Medium | Administration | Implemented | TC-15 | Verified |
| **REQ-29** | Interactive utilization reports and analytics charts using Recharts | High | Analytics | Implemented | TC-19 | Verified |
| **REQ-30** | Comprehensive compliance audit trail recording actor, action, timestamp, and IP | High | Audit & Compliance | Implemented | TC-13 | Verified |
| **REQ-31** | Software Quality Dashboard with live RTM, test execution runner, and defect tracking | High | Software Engineering | Implemented | TC-01 | Verified |
| **REQ-32** | Real-time system health monitoring (Server UP, DB status, latency, API metrics, error logs) | High | System Health | Implemented | TC-20 | Verified |

