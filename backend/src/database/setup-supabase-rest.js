const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  });
  
  const result = await response.json();
  return result;
}

async function setupDatabase() {
  console.log('🔄 Setting up Supabase database...\n');

  const tables = [
    { name: 'companies', sql: `CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(100),
      logo_url VARCHAR(500),
      settings JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    
    { name: 'departments', sql: `CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    
    { name: 'shifts', sql: `CREATE TABLE IF NOT EXISTS shifts (
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
    )` },
    
    { name: 'employees', sql: `CREATE TABLE IF NOT EXISTS employees (
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
    )` },
    
    { name: 'users', sql: `CREATE TABLE IF NOT EXISTS users (
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
    )` },
    
    { name: 'devices', sql: `CREATE TABLE IF NOT EXISTS devices (
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
    )` },
    
    { name: 'attendance_records', sql: `CREATE TABLE IF NOT EXISTS attendance_records (
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
    )` },
    
    { name: 'attendance_logs', sql: `CREATE TABLE IF NOT EXISTS attendance_logs (
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
    )` },
    
    { name: 'leave_types', sql: `CREATE TABLE IF NOT EXISTS leave_types (
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
    )` },
    
    { name: 'leave_requests', sql: `CREATE TABLE IF NOT EXISTS leave_requests (
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
    )` },
    
    { name: 'overtime_requests', sql: `CREATE TABLE IF NOT EXISTS overtime_requests (
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
    )` },
    
    { name: 'employee_schedules', sql: `CREATE TABLE IF NOT EXISTS employee_schedules (
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
    )` },
    
    { name: 'holidays', sql: `CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      is_recurring BOOLEAN DEFAULT false,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    
    { name: 'notifications', sql: `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT false,
      link VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )` },
    
    { name: 'activity_logs', sql: `CREATE TABLE IF NOT EXISTS activity_logs (
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
    )` },
  ];

  try {
    // Create tables
    for (const table of tables) {
      const result = await execSQL(table.sql);
      if (result.error) {
        console.error(`❌ Table ${table.name} error:`, result.error.message);
      } else {
        console.log(`✅ Table ${table.name} created`);
      }
    }

    console.log('\n📊 Creating default data...\n');

    // Create default company
    const companyResult = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Default Company',
        code: 'DEFAULT',
        email: 'info@company.com',
        settings: { timezone: 'Asia/Jakarta', language: 'id' }
      })
    });
    
    const company = await companyResult.json();
    const companyId = company[0]?.id;
    console.log(`✅ Company created with ID: ${companyId}`);

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userResult = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        company_id: companyId,
        username: 'admin',
        email: 'admin@company.com',
        password_hash: passwordHash,
        role: 'admin',
        permissions: ['*'],
        is_active: true
      })
    });
    
    if (userResult.ok || userResult.status === 409) {
      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      const err = await userResult.json();
      console.log('⚠️ Admin user may already exist:', err.message);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupDatabase;
