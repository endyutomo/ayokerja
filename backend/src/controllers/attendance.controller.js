const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Get attendance records
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      employeeId, 
      departmentId,
      status,
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        ar.*,
        e.full_name,
        e.employee_number,
        e.photo_url,
        d.name as department_name,
        dev.name as check_in_device_name,
        dev2.name as check_out_device_name
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN devices dev ON ar.check_in_device_id = dev.id
      LEFT JOIN devices dev2 ON ar.check_out_device_id = dev2.id
      WHERE ar.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (startDate) {
      query += ` AND ar.attendance_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND ar.attendance_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    if (employeeId) {
      query += ` AND ar.employee_id = $${paramCount++}`;
      values.push(employeeId);
    }
    
    if (departmentId) {
      query += ` AND e.department_id = $${paramCount++}`;
      values.push(departmentId);
    }
    
    if (status) {
      query += ` AND ar.status = $${paramCount++}`;
      values.push(status);
    }
    
    query += ` ORDER BY ar.attendance_date DESC, ar.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM attendance_records ar WHERE ar.company_id = $1`;
    const countValues = [req.user.company_id];
    
    if (startDate) {
      countQuery += ` AND ar.attendance_date >= $2`;
      countValues.push(startDate);
    }
    
    if (endDate) {
      countQuery += ` AND ar.attendance_date <= $${countValues.length + 1}`;
      countValues.push(endDate);
    }
    
    if (employeeId) {
      countQuery += ` AND ar.employee_id = $${countValues.length + 1}`;
      countValues.push(employeeId);
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
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records.',
    });
  }
};

// Get attendance by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        ar.*,
        e.full_name,
        e.employee_number,
        e.photo_url,
        d.name as department_name,
        dev.name as check_in_device_name,
        dev2.name as check_out_device_name
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN devices dev ON ar.check_in_device_id = dev.id
      LEFT JOIN devices dev2 ON ar.check_out_device_id = dev2.id
      WHERE ar.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance record.',
    });
  }
};

// Get today's attendance
exports.getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        ar.*,
        e.full_name,
        e.employee_number,
        e.photo_url,
        d.name as department_name,
        CASE 
          WHEN ar.check_in_time IS NULL AND ar.check_out_time IS NULL THEN 'not_yet'
          WHEN ar.check_in_time IS NOT NULL AND ar.check_out_time IS NULL THEN 'checked_in'
          WHEN ar.check_in_time IS NOT NULL AND ar.check_out_time IS NOT NULL THEN 'checked_out'
          ELSE 'unknown'
        END as current_status
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ar.company_id = $1 AND ar.attendance_date = $2
      ORDER BY ar.check_in_time DESC NULLS LAST
    `, [req.user.company_id, today]);
    
    // Get summary
    const summary = {
      total: result.rows.length,
      checkedIn: result.rows.filter(r => r.check_in_time && !r.check_out_time).length,
      checkedOut: result.rows.filter(r => r.check_in_time && r.check_out_time).length,
      notYet: result.rows.filter(r => !r.check_in_time).length,
      late: result.rows.filter(r => r.status === 'late').length,
    };
    
    res.json({
      success: true,
      data: result.rows,
      summary,
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today attendance.',
    });
  }
};

// Manual check-in/check-out
exports.manualAttendance = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { employeeId, type, time, notes } = req.body;
    const now = time ? new Date(time) : new Date();
    const attendanceDate = now.toISOString().split('T')[0];
    
    // Verify employee exists
    const employeeResult = await client.query(
      'SELECT * FROM employees WHERE id = $1 AND company_id = $2 AND is_active = true',
      [employeeId, req.user.company_id]
    );
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }
    
    // Check if record exists
    const existingResult = await client.query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND attendance_date = $2',
      [employeeId, attendanceDate]
    );
    
    let result;
    
    if (existingResult.rows.length === 0) {
      // Create new record
      result = await client.query(`
        INSERT INTO attendance_records 
          (company_id, employee_id, attendance_date, check_in_time, check_in_device_id, status, notes)
        VALUES ($1, $2, $3, $4, NULL, 'present', $5)
        RETURNING *
      `, [req.user.company_id, employeeId, attendanceDate, now, notes || 'Manual check-in']);
    } else if (type === 'check_out' && !existingResult.rows[0].check_out_time) {
      // Update with check-out
      const existing = existingResult.rows[0];
      const workHours = (now - new Date(existing.check_in_time)) / (1000 * 60 * 60);
      
      result = await client.query(`
        UPDATE attendance_records 
        SET check_out_time = $1, work_hours = $2, notes = COALESCE($3, notes)
        WHERE id = $4
        RETURNING *
      `, [now, workHours.toFixed(2), notes || 'Manual check-out', existing.id]);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance action for this record.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'MANUAL_ATTENDANCE',
      'attendance',
      result.rows[0].id,
      `Manual ${type} for employee ${employeeId}`
    );
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance:update', {
        type: 'manual_attendance',
        data: result.rows[0],
      });
    }
    
    res.json({
      success: true,
      message: `Manual ${type} recorded successfully.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record manual attendance.',
    });
  } finally {
    client.release();
  }
};

// Update attendance record
exports.update = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { 
      checkInTime, 
      checkOutTime, 
      workHours, 
      overtimeHours, 
      status, 
      notes,
      lateMinutes,
      earlyDepartureMinutes,
    } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (checkInTime) {
      updates.push(`check_in_time = $${paramCount++}`);
      values.push(checkInTime);
    }
    
    if (checkOutTime) {
      updates.push(`check_out_time = $${paramCount++}`);
      values.push(checkOutTime);
    }
    
    if (workHours !== undefined) {
      updates.push(`work_hours = $${paramCount++}`);
      values.push(workHours);
    }
    
    if (overtimeHours !== undefined) {
      updates.push(`overtime_hours = $${paramCount++}`);
      values.push(overtimeHours);
    }
    
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    
    if (lateMinutes !== undefined) {
      updates.push(`late_minutes = $${paramCount++}`);
      values.push(lateMinutes);
    }
    
    if (earlyDepartureMinutes !== undefined) {
      updates.push(`early_departure_minutes = $${paramCount++}`);
      values.push(earlyDepartureMinutes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }
    
    updates.push(`verified_by = $${paramCount++}`);
    values.push(req.user.id);
    
    updates.push(`verified_at = CURRENT_TIMESTAMP`);
    
    values.push(id, req.user.company_id);
    
    const result = await client.query(`
      UPDATE attendance_records 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount++} AND company_id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'UPDATE_ATTENDANCE',
      'attendance',
      id,
      `Updated attendance record ${id}`
    );
    
    res.json({
      success: true,
      message: 'Attendance record updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record.',
    });
  } finally {
    client.release();
  }
};

// Delete attendance record
exports.delete = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(
      'DELETE FROM attendance_records WHERE id = $1 AND company_id = $2 RETURNING *',
      [id, req.user.company_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'DELETE_ATTENDANCE',
      'attendance',
      id,
      `Deleted attendance record ${id}`
    );
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully.',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record.',
    });
  } finally {
    client.release();
  }
};

// Get attendance summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;
    
    let query = `
      SELECT 
        COUNT(DISTINCT ar.employee_id) as total_employees,
        COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.employee_id END) as present_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.employee_id END) as late_count,
        COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN ar.employee_id END) as absent_count,
        AVG(ar.work_hours) as avg_work_hours,
        SUM(ar.overtime_hours) as total_overtime_hours
      FROM attendance_records ar
      WHERE ar.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (startDate) {
      query += ` AND ar.attendance_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND ar.attendance_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    if (departmentId) {
      query += ` AND ar.employee_id IN (
        SELECT id FROM employees WHERE department_id = $${paramCount++}
      )`;
      values.push(departmentId);
    }
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance summary.',
    });
  }
};

// Process attendance logs (from devices)
exports.processLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as pending_count 
      FROM attendance_logs 
      WHERE processed = false
    `);
    
    const pendingCount = parseInt(result.rows[0].pending_count);
    
    // Trigger processing (in real app, this would be a background job)
    res.json({
      success: true,
      message: `Processing ${pendingCount} pending attendance logs.`,
      data: { pendingCount },
    });
  } catch (error) {
    console.error('Process logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process attendance logs.',
    });
  }
};
