-- =======================================================================
-- ParkEase - Smart Parking Management System
-- Database Schema (Version 1.0)
-- Subject: Software Engineering and Architecture
-- =======================================================================

CREATE DATABASE IF NOT EXISTS parkease_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE parkease_db;

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('faculty', 'admin') NOT NULL DEFAULT 'faculty',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_faculty_id (faculty_id),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- Table 2: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_number VARCHAR(30) NOT NULL,
  vehicle_type ENUM('car', 'motorcycle', 'ev_car', 'ev_motorcycle', 'other') NOT NULL DEFAULT 'car',
  vehicle_model VARCHAR(100) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicles_user (user_id),
  INDEX idx_vehicles_number (vehicle_number)
) ENGINE=InnoDB;

-- Table 3: parking_areas
CREATE TABLE IF NOT EXISTS parking_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  floor VARCHAR(50) NOT NULL DEFAULT 'Ground Level',
  total_slots INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_areas_code (code)
) ENGINE=InnoDB;

-- Table 4: parking_slots
CREATE TABLE IF NOT EXISTS parking_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_number VARCHAR(20) NOT NULL,
  area_id INT NOT NULL,
  slot_type ENUM('standard', 'ev_charging', 'disabled', 'vip_faculty') NOT NULL DEFAULT 'standard',
  status ENUM('available', 'occupied', 'reserved', 'unavailable') NOT NULL DEFAULT 'available',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes VARCHAR(255) NULL,
  last_status_change TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (area_id) REFERENCES parking_areas(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_slot_area (area_id, slot_number),
  INDEX idx_slots_status (status),
  INDEX idx_slots_area (area_id)
) ENGINE=InnoDB;

-- Table 5: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  slot_id INT NOT NULL,
  vehicle_id INT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('confirmed', 'active', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'confirmed',
  qr_code_data TEXT NOT NULL,
  qr_code_image MEDIUMTEXT NULL,
  booking_type ENUM('self_service', 'admin_allocated') NOT NULL DEFAULT 'self_service',
  cancelled_at DATETIME NULL,
  cancellation_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE RESTRICT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_slot (slot_id),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_start_end (start_time, end_time)
) ENGINE=InnoDB;

-- Table 6: parking_sessions
CREATE TABLE IF NOT EXISTS parking_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  slot_id INT NOT NULL,
  user_id INT NOT NULL,
  entry_time DATETIME NOT NULL,
  exit_time DATETIME NULL,
  status ENUM('ongoing', 'completed', 'overdue') NOT NULL DEFAULT 'ongoing',
  verified_by_method ENUM('qr_scan', 'manual_code', 'admin_override') NOT NULL DEFAULT 'qr_scan',
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_slot (slot_id),
  INDEX idx_sessions_status (status)
) ENGINE=InnoDB;

-- Table 7: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'danger') NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read)
) ENGINE=InnoDB;

-- Table 8: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_role VARCHAR(20) NULL,
  user_name VARCHAR(100) NULL,
  action VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NULL,
  details TEXT NULL,
  ip_address VARCHAR(50) NOT NULL DEFAULT '127.0.0.1',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_action (action),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_time (timestamp)
) ENGINE=InnoDB;

-- Table 9: requirements (Software Engineering Traceability REQ-01 to REQ-32)
CREATE TABLE IF NOT EXISTS requirements (
  req_id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'High',
  module VARCHAR(100) NOT NULL,
  implementation_status ENUM('Implemented', 'In Progress', 'Pending') NOT NULL DEFAULT 'Implemented',
  linked_test_id VARCHAR(50) NULL,
  verification_status ENUM('Verified', 'Failed', 'Pending') NOT NULL DEFAULT 'Verified',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_req_module (module),
  INDEX idx_req_status (implementation_status)
) ENGINE=InnoDB;

-- Table 10: test_cases (Software Engineering Test Management TC-01 to TC-20)
CREATE TABLE IF NOT EXISTS test_cases (
  tc_id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category ENUM('Unit', 'Integration', 'Functional', 'System', 'Validation', 'Security') NOT NULL,
  description TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT NULL,
  status ENUM('Passed', 'Failed', 'Not Executed') NOT NULL DEFAULT 'Passed',
  execution_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tc_category (category),
  INDEX idx_tc_status (status)
) ENGINE=InnoDB;

-- Table 11: defects (Software Engineering Defect & Issue Tracker)
CREATE TABLE IF NOT EXISTS defects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  defect_code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  status ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  reported_by VARCHAR(100) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_defects_status (status),
  INDEX idx_defects_severity (severity)
) ENGINE=InnoDB;

