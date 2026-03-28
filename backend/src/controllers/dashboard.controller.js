const pool = require('../config/database');

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Employee statistics
    const employeeStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as total_employees,
        COUNT(*) FILTER (WHERE is_active = true AND employment_status = 'active') as active_employees,
        COUNT(*) FILTER (WHERE hire_date >= CURRENT_DATE - INTERVAL '30 days') as new_employees_this_month
      FROM employees
      WHERE company_id = $1
    `, [req.user.company_id]);
    
    // Today's attendance statistics
    const attendanceStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT ar.employee_id) as present_today,
        COUNT(DISTINCT ar.employee_id) FILTER (WHERE ar.check_in_time IS NOT NULL AND ar.check_out_time IS NOT NULL) as checked_out,
        COUNT(DISTINCT ar.employee_id) FILTER (WHERE ar.check_in_time IS NOT NULL AND ar.check_out_time IS NULL) as still_working,
        COUNT(DISTINCT ar.employee_id) FILTER (WHERE ar.status = 'late') as late_today,
        COUNT(DISTINCT e.id) FILTER (WHERE ar.employee_id IS NULL AND e.is_active = true) as absent_today
      FROM employees e
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND ar.attendance_date = $1
      WHERE e.company_id = $2 AND e.is_active = true
    `, [today, req.user.company_id]);
    
    // Device statistics
    const deviceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE status = 'online') as online_devices,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_devices
      FROM devices
      WHERE company_id = $1
    `, [req.user.company_id]);
    
    // Leave statistics
    const leaveStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_leaves,
        COUNT(*) FILTER (WHERE status = 'approved' AND start_date <= $1 AND end_date >= $1) as on_leave_today,
        COUNT(*) FILTER (WHERE status = 'approved' AND EXTRACT(MONTH FROM start_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as approved_this_month
      FROM leave_requests
      WHERE company_id = $1
    `, [today]);
    
    // Recent attendance activity
    const recentActivity = await pool.query(`
      SELECT 
        ar.*,
        e.full_name,
        e.employee_number,
        e.photo_url
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
      WHERE ar.company_id = $1 AND ar.attendance_date = $2
      ORDER BY ar.check_in_time DESC NULLS LAST
      LIMIT 10
    `, [req.user.company_id, today]);
    
    res.json({
      success: true,
      data: {
        employees: employeeStats.rows[0],
        attendance: attendanceStats.rows[0],
        devices: deviceStats.rows[0],
        leaves: leaveStats.rows[0],
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    console.error('Get dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics.',
    });
  }
};

// Get weekly attendance chart data
exports.getWeeklyChart = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('week', attendance_date) as week_start,
        COUNT(DISTINCT employee_id) as total_employees,
        COUNT(DISTINCT employee_id) FILTER (WHERE status = 'present' OR status = 'late') as present_count,
        COUNT(DISTINCT employee_id) FILTER (WHERE status = 'absent') as absent_count,
        AVG(work_hours) as avg_work_hours
      FROM attendance_records
      WHERE company_id = $1 
        AND attendance_date >= CURRENT_DATE - INTERVAL '${weeks} weeks'
      GROUP BY DATE_TRUNC('week', attendance_date)
      ORDER BY week_start DESC
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get weekly chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly chart data.',
    });
  }
};

// Get monthly attendance summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        COUNT(*) FILTER (WHERE ar.status = 'present') as present_days,
        COUNT(*) FILTER (WHERE ar.status = 'late') as late_days,
        COUNT(*) FILTER (WHERE ar.status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE ar.status = 'half_day') as half_days,
        SUM(ar.work_hours) as total_work_hours,
        SUM(ar.overtime_hours) as total_overtime_hours,
        SUM(ar.late_minutes) as total_late_minutes
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.attendance_date >= DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01'
        AND ar.attendance_date < (DATE '${targetYear}-${String(targetMonth).padStart(2, '0')}-01' + INTERVAL '1 month')
      WHERE e.company_id = $1 AND e.is_active = true
      GROUP BY e.id, e.employee_number, e.full_name, d.name
      ORDER BY e.full_name
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly summary.',
    });
  }
};

// Get department-wise attendance
exports.getDepartmentAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        d.id,
        d.name,
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT ar.employee_id) as present_count,
        COUNT(DISTINCT ar.employee_id) FILTER (WHERE ar.status = 'late') as late_count,
        COUNT(DISTINCT e.id) - COUNT(DISTINCT ar.employee_id) as absent_count,
        ROUND(100.0 * COUNT(DISTINCT ar.employee_id) / NULLIF(COUNT(DISTINCT e.id), 0), 2) as attendance_percentage
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = true
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id AND ar.attendance_date = $1
      WHERE d.company_id = $2 AND d.is_active = true
      GROUP BY d.id, d.name
      ORDER BY attendance_percentage DESC NULLS LAST
    `, [today, req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get department attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department attendance.',
    });
  }
};

// Get overtime summary
exports.getOvertimeSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        COUNT(*) as overtime_days,
        SUM(ar.overtime_hours) as total_overtime_hours,
        AVG(ar.overtime_hours) as avg_overtime_hours
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ar.company_id = $1 
        AND ar.overtime_hours > 0
    `, [req.user.company_id];
    
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
    
    query += ` GROUP BY e.id, e.employee_number, e.full_name, d.name
      ORDER BY total_overtime_hours DESC
      LIMIT 20`;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get overtime summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get overtime summary.',
    });
  }
};

// Get late arrivals
exports.getLateArrivals = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        e.id,
        e.employee_number,
        e.full_name,
        d.name as department_name,
        COUNT(*) FILTER (WHERE ar.late_minutes > 0) as late_count,
        SUM(ar.late_minutes) as total_late_minutes,
        MAX(ar.late_minutes) as max_late_minutes,
        AVG(ar.late_minutes) as avg_late_minutes
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
        AND ar.attendance_date >= CURRENT_DATE - INTERVAL '${days} days'
      WHERE e.company_id = $1 AND e.is_active = true
      GROUP BY e.id, e.employee_number, e.full_name, d.name
      HAVING COUNT(*) FILTER (WHERE ar.late_minutes > 0) > 0
      ORDER BY late_count DESC, total_late_minutes DESC
      LIMIT 20
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get late arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get late arrivals.',
    });
  }
};
