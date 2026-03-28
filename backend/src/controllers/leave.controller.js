const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Get all leave requests
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employeeId, leaveTypeId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        lr.*,
        e.full_name,
        e.employee_number,
        lt.name as leave_type_name,
        lt.code as leave_type_code,
        u.username as approved_by_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (status) {
      query += ` AND lr.status = $${paramCount++}`;
      values.push(status);
    }
    
    if (employeeId) {
      query += ` AND lr.employee_id = $${paramCount++}`;
      values.push(employeeId);
    }
    
    if (leaveTypeId) {
      query += ` AND lr.leave_type_id = $${paramCount++}`;
      values.push(leaveTypeId);
    }
    
    if (startDate) {
      query += ` AND lr.start_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND lr.end_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    query += ` ORDER BY lr.submitted_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM leave_requests WHERE company_id = $1`;
    const countValues = [req.user.company_id];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countValues.push(status);
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
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave requests.',
    });
  }
};

// Get leave request by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        lr.*,
        e.full_name,
        e.employee_number,
        lt.name as leave_type_name,
        lt.code as leave_type_code,
        u.username as approved_by_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.id = $1 AND lr.company_id = $2
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave request.',
    });
  }
};

// Create leave request
exports.create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { employeeId, leaveTypeId, startDate, endDate, totalDays, reason, attachmentUrl } = req.body;
    
    const result = await client.query(`
      INSERT INTO leave_requests 
        (company_id, employee_id, leave_type_id, start_date, end_date, total_days, reason, attachment_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.company_id, employeeId, leaveTypeId, startDate, endDate, totalDays, reason, attachmentUrl]);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'CREATE_LEAVE',
      'leave',
      result.rows[0].id,
      `Created leave request for ${startDate} to ${endDate}`
    );
    
    res.status(201).json({
      success: true,
      message: 'Leave request created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request.',
    });
  } finally {
    client.release();
  }
};

// Approve leave request
exports.approve = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      UPDATE leave_requests 
      SET status = 'approved',
          approved_by = $1,
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `, [req.user.id, id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'APPROVE_LEAVE',
      'leave',
      id,
      `Approved leave request ${id}`
    );
    
    res.json({
      success: true,
      message: 'Leave request approved.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request.',
    });
  } finally {
    client.release();
  }
};

// Reject leave request
exports.reject = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const result = await client.query(`
      UPDATE leave_requests 
      SET status = 'rejected',
          rejected_by = $1,
          rejected_at = CURRENT_TIMESTAMP,
          rejection_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND company_id = $4
      RETURNING *
    `, [req.user.id, rejectionReason, id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'REJECT_LEAVE',
      'leave',
      id,
      `Rejected leave request ${id}`
    );
    
    res.json({
      success: true,
      message: 'Leave request rejected.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request.',
    });
  } finally {
    client.release();
  }
};

// Get leave types
exports.getLeaveTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM leave_types
      WHERE company_id = $1 AND is_active = true
      ORDER BY name
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave types.',
    });
  }
};

// Create leave type
exports.createLeaveType = async (req, res) => {
  try {
    const { name, code, quotaDays, isPaid, requiresApproval, description } = req.body;
    
    const result = await pool.query(`
      INSERT INTO leave_types (company_id, name, code, quota_days, is_paid, requires_approval, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user.company_id, name, code, quotaDays, isPaid, requiresApproval, description]);
    
    res.status(201).json({
      success: true,
      message: 'Leave type created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create leave type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave type.',
    });
  }
};

// Get employee leave balance
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        lt.id,
        lt.name,
        lt.code,
        lt.quota_days,
        COALESCE(SUM(lr.total_days) FILTER (WHERE lr.status = 'approved'), 0) as used_days,
        lt.quota_days - COALESCE(SUM(lr.total_days) FILTER (WHERE lr.status = 'approved'), 0) as remaining_days
      FROM leave_types lt
      LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id 
        AND lr.employee_id = $1 
        AND lr.status = 'approved'
        AND EXTRACT(YEAR FROM lr.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      WHERE lt.company_id = $2 AND lt.is_active = true
      GROUP BY lt.id, lt.name, lt.code, lt.quota_days
    `, [employeeId, req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave balance.',
    });
  }
};
