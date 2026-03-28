const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Get all employees
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, departmentId, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, d.name as department_name, s.name as shift_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (search) {
      query += ` AND (e.full_name ILIKE $${paramCount} OR e.employee_number ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    if (departmentId) {
      query += ` AND e.department_id = $${paramCount}`;
      values.push(departmentId);
      paramCount++;
    }
    
    if (status) {
      query += ` AND e.employment_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM employees e WHERE e.company_id = $1`;
    const countValues = [req.user.company_id];
    
    if (search) {
      countQuery += ` AND (e.full_name ILIKE $2 OR e.employee_number ILIKE $2 OR e.email ILIKE $2)`;
      countValues.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countValues);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employees.',
    });
  }
};

// Get employee by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT e.*, d.name as department_name, s.name as shift_name, s.code as shift_code
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON e.shift_id = s.id
      WHERE e.id = $1 AND e.company_id = $2
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee.',
    });
  }
};

// Create employee
exports.create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      employeeNumber, fullName, firstName, lastName, email, phone,
      gender, dateOfBirth, address, city, position, hireDate,
      departmentId, shiftId, employmentStatus, emergencyContactName,
      emergencyContactPhone, bankName, bankAccount,
    } = req.body;
    
    const result = await client.query(`
      INSERT INTO employees (
        company_id, employee_number, full_name, first_name, last_name,
        email, phone, gender, date_of_birth, address, city, position,
        hire_date, department_id, shift_id, employment_status,
        emergency_contact_name, emergency_contact_phone, bank_name, bank_account
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      req.user.company_id, employeeNumber, fullName, firstName, lastName,
      email, phone, gender, dateOfBirth, address, city, position,
      hireDate, departmentId, shiftId, employmentStatus || 'active',
      emergencyContactName, emergencyContactPhone, bankName, bankAccount,
    ]);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'CREATE_EMPLOYEE',
      'employee',
      result.rows[0].id,
      `Created employee ${fullName} (${employeeNumber})`
    );
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Employee number already exists.',
      });
    }
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee.',
    });
  } finally {
    client.release();
  }
};

// Update employee
exports.update = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'full_name', 'first_name', 'last_name', 'email', 'phone',
      'gender', 'date_of_birth', 'address', 'city', 'position',
      'hire_date', 'department_id', 'shift_id', 'employment_status',
      'emergency_contact_name', 'emergency_contact_phone', 'bank_name', 'bank_account',
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.company_id);
    
    const result = await client.query(`
      UPDATE employees 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount++} AND company_id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'UPDATE_EMPLOYEE',
      'employee',
      id,
      `Updated employee ${result.rows[0].full_name}`
    );
    
    res.json({
      success: true,
      message: 'Employee updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Employee number or email already exists.',
      });
    }
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee.',
    });
  } finally {
    client.release();
  }
};

// Delete employee
exports.delete = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      UPDATE employees 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'DELETE_EMPLOYEE',
      'employee',
      id,
      `Deleted employee ${result.rows[0].full_name}`
    );
    
    res.json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee.',
    });
  } finally {
    client.release();
  }
};

// Get employee attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'late') as late_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'half_day') as half_days,
        SUM(work_hours) as total_work_hours,
        SUM(overtime_hours) as total_overtime_hours,
        SUM(late_minutes) as total_late_minutes
      FROM attendance_records
      WHERE employee_id = $1 
        AND attendance_date >= $2 
        AND attendance_date <= $3
    `, [id, startDate, endDate]);
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance summary.',
    });
  }
};
