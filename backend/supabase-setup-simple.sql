-- ===========================================
-- SETUP DATABASE SUPABASE
-- Time Attendance System
-- ===========================================
-- Jalankan script ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/sql/new
-- ===========================================

-- Drop existing tables (if any) to start fresh
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS employee_schedules CASCADE;
DROP TABLE IF EXISTS overtime_requests CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  logo_url VARCHAR(500),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments table
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Shifts table
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  work_hours DECIMAL(4,2),
  is_overnight BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(50),
  gender VARCHAR(10),
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Indonesia',
  position VARCHAR(100),
  hire_date DATE,
  termination_date DATE,
  employment_status VARCHAR(50) DEFAULT 'active',
  shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  photo_url VARCHAR(500),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account VARCHAR(50),
  npwp VARCHAR(50),
  bpjs_kesehatan VARCHAR(50),
  bpjs_ketenagakerjaan VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Devices table
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  serial_number VARCHAR(100),
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  firmware_version VARCHAR(50),
  ip_address VARCHAR(50),
  port INTEGER DEFAULT 4370,
  location VARCHAR(255),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'offline',
  last_connection TIMESTAMP,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Attendance records table
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  check_in_device_id INTEGER,
  check_out_device_id INTEGER,
  work_hours DECIMAL(6,2),
  overtime_hours DECIMAL(6,2),
  late_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'present',
  notes TEXT,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, attendance_date)
);

-- 8. Attendance logs table
CREATE TABLE attendance_logs (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  employee_number VARCHAR(50) NOT NULL,
  punch_time TIMESTAMP NOT NULL,
  punch_type INTEGER DEFAULT 0,
  status INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Leave types table
CREATE TABLE leave_types (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  quota_days INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Leave requests table
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id INTEGER REFERENCES leave_types(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,1) NOT NULL,
  reason TEXT NOT NULL,
  attachment_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by INTEGER REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Overtime requests table
CREATE TABLE overtime_requests (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(4,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_by INTEGER REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Employee schedules table
CREATE TABLE employee_schedules (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_day_off BOOLEAN DEFAULT false,
  is_holiday BOOLEAN DEFAULT false,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- 13. Holidays table
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Activity logs table
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_attendance_records_employee_date ON attendance_records(employee_id, attendance_date);
CREATE INDEX idx_attendance_records_company_date ON attendance_records(company_id, attendance_date);
CREATE INDEX idx_attendance_logs_device ON attendance_logs(device_id);
CREATE INDEX idx_attendance_logs_punch_time ON attendance_logs(punch_time);
CREATE INDEX idx_attendance_logs_processed ON attendance_logs(processed);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ===========================================
-- INSERT DEFAULT DATA
-- ===========================================

-- Insert default company
INSERT INTO companies (name, code, email, settings)
VALUES ('Default Company', 'DEFAULT', 'info@company.com', '{"timezone": "Asia/Jakarta", "language": "id"}');

-- Get company ID for default data
DO $$
DECLARE
  default_company_id INTEGER;
BEGIN
  SELECT id INTO default_company_id FROM companies WHERE code = 'DEFAULT';

  -- Insert default admin user
  INSERT INTO users (company_id, username, email, password_hash, role, permissions, is_active)
  VALUES (
    default_company_id,
    'admin',
    'admin@company.com',
    '$2a$10$Ie1Dvdrp4MYqPyJ74MeRMOEPTE6ffJoZPRHO3z5W664h3vW.TTHzC',
    'admin',
    '["*"]',
    true
  ) ON CONFLICT (username) DO NOTHING;

  -- Insert default departments
  INSERT INTO departments (company_id, name, code)
  SELECT default_company_id, name, code FROM (VALUES
    ('Human Resources', 'HR'),
    ('Finance', 'FIN'),
    ('Information Technology', 'IT'),
    ('Operations', 'OPS'),
    ('Marketing', 'MKT'),
    ('Sales', 'SLS'),
    ('Customer Service', 'CS'),
    ('Production', 'PRD')
  ) AS dept(name, code);

  -- Insert default shifts
  INSERT INTO shifts (company_id, name, code, start_time, end_time, break_start, break_end, work_hours)
  SELECT default_company_id, name, code, start_time::TIME, end_time::TIME, break_start::TIME, break_end::TIME, work_hours FROM (VALUES
    ('Regular Shift', 'REG', '08:00', '17:00', '12:00', '13:00', 8),
    ('Morning Shift', 'MOR', '06:00', '14:00', '10:00', '10:30', 7.5),
    ('Afternoon Shift', 'AFT', '14:00', '22:00', '18:00', '18:30', 7.5),
    ('Night Shift', 'NGT', '22:00', '06:00', '02:00', '02:30', 7.5),
    ('Flexible Shift', 'FLX', '09:00', '18:00', '12:00', '13:00', 8)
  ) AS shift(name, code, start_time, end_time, break_start, break_end, work_hours);

  -- Insert default leave types
  INSERT INTO leave_types (company_id, name, code, quota_days, is_paid, requires_approval)
  SELECT default_company_id, name, code, quota_days, is_paid, requires_approval FROM (VALUES
    ('Annual Leave', 'AL', 12, true, true),
    ('Sick Leave', 'SL', 30, true, false),
    ('Maternity Leave', 'ML', 90, true, true),
    ('Paternity Leave', 'PL', 3, true, true),
    ('Unpaid Leave', 'UL', 0, false, true),
    ('Marriage Leave', 'MRL', 3, true, true),
    ('Bereavement Leave', 'BL', 3, true, true),
    ('Menstrual Leave', 'MEN', 2, true, false)
  ) AS leave_type(name, code, quota_days, is_paid, requires_approval);

END $$;

-- ===========================================
-- COMPLETED
-- ===========================================
-- Default Credentials:
-- Username: admin
-- Password: admin123
-- ===========================================
