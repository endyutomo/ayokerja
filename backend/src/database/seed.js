const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create default company
    const companyResult = await client.query(`
      INSERT INTO companies (name, code, email, settings)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Default Company', 'DEFAULT', 'info@company.com', '{"timezone": "Asia/Jakarta", "language": "id"}']);
    
    const companyId = companyResult.rows[0].id;
    console.log(`✅ Company created with ID: ${companyId}`);
    
    // Create default admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (company_id, username, email, password_hash, role, permissions, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO NOTHING
    `, [
      companyId, 
      'admin', 
      'admin@company.com', 
      passwordHash, 
      'admin',
      JSON.stringify(['*']),
      true
    ]);
    console.log('✅ Admin user created (username: admin, password: admin123)');
    
    // Create default departments
    const departments = [
      ['Human Resources', 'HR'],
      ['Finance', 'FIN'],
      ['Information Technology', 'IT'],
      ['Operations', 'OPS'],
      ['Marketing', 'MKT'],
      ['Sales', 'SLS'],
      ['Customer Service', 'CS'],
      ['Production', 'PRD'],
    ];
    
    for (const [name, code] of departments) {
      await client.query(`
        INSERT INTO departments (company_id, name, code)
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, code) DO NOTHING
      `, [companyId, name, code]);
    }
    console.log('✅ Default departments created');
    
    // Create default shifts
    const shifts = [
      ['Regular Shift', 'REG', '08:00', '17:00', '12:00', '13:00', 8],
      ['Morning Shift', 'MOR', '06:00', '14:00', '10:00', '10:30', 7.5],
      ['Afternoon Shift', 'AFT', '14:00', '22:00', '18:00', '18:30', 7.5],
      ['Night Shift', 'NGT', '22:00', '06:00', '02:00', '02:30', 7.5],
      ['Flexible Shift', 'FLX', '09:00', '18:00', '12:00', '13:00', 8],
    ];
    
    for (const [name, code, start, end, breakStart, breakEnd, hours] of shifts) {
      await client.query(`
        INSERT INTO shifts (company_id, name, code, start_time, end_time, break_start, break_end, work_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (company_id, code) DO NOTHING
      `, [companyId, name, code, start, end, breakStart, breakEnd, hours]);
    }
    console.log('✅ Default shifts created');
    
    // Create default leave types
    const leaveTypes = [
      ['Annual Leave', 'AL', 12, true, true],
      ['Sick Leave', 'SL', 30, true, false],
      ['Maternity Leave', 'ML', 90, true, true],
      ['Paternity Leave', 'PL', 3, true, true],
      ['Unpaid Leave', 'UL', 0, false, true],
      ['Marriage Leave', 'MRL', 3, true, true],
      ['Bereavement Leave', 'BL', 3, true, true],
      ['Menstrual Leave', 'MEN', 2, true, false],
    ];
    
    for (const [name, code, quota, isPaid, requiresApproval] of leaveTypes) {
      await client.query(`
        INSERT INTO leave_types (company_id, name, code, quota_days, is_paid, requires_approval)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (company_id, code) DO NOTHING
      `, [companyId, name, code, quota, isPaid, requiresApproval]);
    }
    console.log('✅ Default leave types created');
    
    // Create sample employee
    await client.query(`
      INSERT INTO employees (company_id, employee_number, full_name, first_name, last_name, email, phone, department_id, position, hire_date, employment_status)
      SELECT $1, $2, $3, $4, $5, $6, $7, d.id, $8, $9, $10
      FROM departments d
      WHERE d.code = 'HR'
      ON CONFLICT (employee_number) DO NOTHING
    `, [companyId, 'EMP001', 'John Doe', 'John', 'Doe', 'john.doe@company.com', '+628123456789', 'Manager', '2024-01-01', 'active']);
    console.log('✅ Sample employee created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
