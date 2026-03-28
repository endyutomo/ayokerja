const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Get attendance report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, departmentId, format = 'json' } = req.query;
    
    let query = `
      SELECT 
        ar.*,
        e.employee_number,
        e.full_name,
        e.position,
        d.name as department_name,
        s.name as shift_name,
        s.start_time as shift_start,
        s.end_time as shift_end
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON e.shift_id = s.id
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
    
    query += ` ORDER BY ar.attendance_date DESC, e.full_name`;
    
    const result = await pool.query(query, values);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'EXPORT_REPORT',
      'report',
      null,
      `Generated attendance report from ${startDate} to ${endDate}`
    );
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        totalRecords: result.rows.length,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report.',
    });
  }
};

// Get employee summary report
exports.getEmployeeSummaryReport = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    let query = `
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        e.position,
        d.name as department_name,
        s.name as shift_name,
        COUNT(*) FILTER (WHERE ar.status = 'present') as present_days,
        COUNT(*) FILTER (WHERE ar.status = 'late') as late_days,
        COUNT(*) FILTER (WHERE ar.status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE ar.status = 'half_day') as half_days,
        SUM(ar.work_hours) as total_work_hours,
        SUM(ar.overtime_hours) as total_overtime_hours,
        SUM(ar.late_minutes) as total_late_minutes,
        COUNT(lr.id) FILTER (WHERE lr.status = 'approved') as approved_leaves,
        COUNT(lr.id) FILTER (WHERE lr.status = 'pending') as pending_leaves
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN shifts s ON e.shift_id = s.id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.attendance_date >= DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01'
        AND ar.attendance_date < (DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01' + INTERVAL '1 month')
      LEFT JOIN leave_requests lr ON e.id = lr.employee_id 
        AND lr.status IN ('approved', 'pending')
        AND lr.start_date <= (DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01' + INTERVAL '1 month')
        AND lr.end_date >= DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01'
      WHERE e.company_id = $1 AND e.is_active = true
    `;
    
    const values = [req.user.company_id];
    
    if (departmentId) {
      query += ` AND e.department_id = $2`;
      values.push(departmentId);
    }
    
    query += ` GROUP BY e.id, e.employee_number, e.full_name, e.position, d.name, s.name
      ORDER BY e.full_name`;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        month: targetMonth,
        year: targetYear,
        totalEmployees: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get employee summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee summary report.',
    });
  }
};

// Get late report
exports.getLateReport = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;
    
    let query = `
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE ar.late_minutes > 0) as late_count,
        SUM(ar.late_minutes) as total_late_minutes,
        AVG(ar.late_minutes) as avg_late_minutes,
        MAX(ar.late_minutes) as max_late_minutes,
        STRING_AGG(
          CASE WHEN ar.late_minutes > 0 THEN ar.attendance_date::text END, 
          ', ' 
          ORDER BY ar.attendance_date
        ) as late_dates
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.attendance_date >= $2 
        AND ar.attendance_date <= $3
      WHERE e.company_id = $1 AND e.is_active = true
      GROUP BY e.id, e.employee_number, e.full_name, d.name
      HAVING COUNT(*) FILTER (WHERE ar.late_minutes > 0) > 0
      ORDER BY late_count DESC, total_late_minutes DESC
    `;
    
    const values = [req.user.company_id, startDate, endDate];
    
    if (departmentId) {
      query = query.replace(
        'WHERE e.company_id = $1 AND e.is_active = true',
        'WHERE e.company_id = $1 AND e.is_active = true AND e.department_id = $4'
      );
      values.push(departmentId);
    }
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        startDate,
        endDate,
        totalLateEmployees: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get late report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate late report.',
    });
  }
};

// Get overtime report
exports.getOvertimeReport = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;
    
    let query = `
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        COUNT(*) FILTER (WHERE ar.overtime_hours > 0) as overtime_days,
        SUM(ar.overtime_hours) as total_overtime_hours,
        AVG(ar.overtime_hours) as avg_overtime_hours,
        MAX(ar.overtime_hours) as max_overtime_hours,
        STRING_AGG(
          CASE WHEN ar.overtime_hours > 0 THEN 
            ar.attendance_date::text || ':' || ar.overtime_hours::text 
          END, 
          ', ' 
          ORDER BY ar.attendance_date
        ) as overtime_details
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.attendance_date >= $2 
        AND ar.attendance_date <= $3
      WHERE e.company_id = $1 AND e.is_active = true
      GROUP BY e.id, e.employee_number, e.full_name, d.name
      HAVING SUM(ar.overtime_hours) > 0
      ORDER BY total_overtime_hours DESC
    `;
    
    const values = [req.user.company_id, startDate, endDate];
    
    if (departmentId) {
      query = query.replace(
        'WHERE e.company_id = $1 AND e.is_active = true',
        'WHERE e.company_id = $1 AND e.is_active = true AND e.department_id = $4'
      );
      values.push(departmentId);
    }
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        startDate,
        endDate,
        totalOvertimeEmployees: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get overtime report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate overtime report.',
    });
  }
};

// Get leave report
exports.getLeaveReport = async (req, res) => {
  try {
    const { startDate, endDate, status, employeeId } = req.query;
    
    let query = `
      SELECT 
        lr.*,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        lt.name as leave_type_name,
        lt.code as leave_type_code,
        u.username as approved_by_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users u ON lr.approved_by = u.id
      WHERE lr.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (startDate) {
      query += ` AND lr.start_date >= $${paramCount++}`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND lr.end_date <= $${paramCount++}`;
      values.push(endDate);
    }
    
    if (status) {
      query += ` AND lr.status = $${paramCount++}`;
      values.push(status);
    }
    
    if (employeeId) {
      query += ` AND lr.employee_id = $${paramCount++}`;
      values.push(employeeId);
    }
    
    query += ` ORDER BY lr.submitted_at DESC`;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        totalRequests: result.rows.length,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Get leave report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate leave report.',
    });
  }
};

// Get device activity report
exports.getDeviceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(`
      SELECT 
        d.id,
        d.name,
        d.device_id,
        d.ip_address,
        d.location,
        COUNT(al.id) as total_records,
        COUNT(al.id) FILTER (WHERE DATE(al.punch_time) = CURRENT_DATE) as today_records,
        MIN(al.punch_time) as first_record,
        MAX(al.punch_time) as last_record,
        d.status,
        d.last_connection
      FROM devices d
      LEFT JOIN attendance_logs al ON d.id = al.device_id 
        AND al.punch_time >= $2 
        AND al.punch_time <= $3
      WHERE d.company_id = $1 AND d.is_active = true
      GROUP BY d.id, d.name, d.device_id, d.ip_address, d.location, d.status, d.last_connection
      ORDER BY total_records DESC
    `, [req.user.company_id, startDate, endDate]);
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        startDate,
        endDate,
        totalDevices: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get device report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate device report.',
    });
  }
};
