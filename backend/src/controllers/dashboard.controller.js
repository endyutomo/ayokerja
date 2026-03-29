const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Employee statistics
    const { data: employeeStats } = await supabase
      .from('employees')
      .select('is_active, employment_status, hire_date')
      .eq('company_id', req.user.company_id);

    const employeeStatsResult = {
      total_employees: employeeStats?.filter(e => e.is_active).length || 0,
      active_employees: employeeStats?.filter(e => e.is_active && e.employment_status === 'active').length || 0,
      new_employees_this_month: employeeStats?.filter(e => {
        const hireDate = new Date(e.hire_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return hireDate >= thirtyDaysAgo;
      }).length || 0,
    };

    // Today's attendance statistics
    const { data: attendanceToday } = await supabase
      .from('attendance_records')
      .select('employee_id, check_in_time, check_out_time, status')
      .eq('company_id', req.user.company_id)
      .eq('attendance_date', today);

    const { data: allEmployees } = await supabase
      .from('employees')
      .select('id, is_active')
      .eq('company_id', req.user.company_id)
      .eq('is_active', true);

    const attendanceStatsResult = {
      present_today: new Set(attendanceToday?.map(r => r.employee_id)).size || 0,
      checked_out: attendanceToday?.filter(r => r.check_in_time && r.check_out_time).length || 0,
      still_working: attendanceToday?.filter(r => r.check_in_time && !r.check_out_time).length || 0,
      late_today: attendanceToday?.filter(r => r.status === 'late').length || 0,
      absent_today: (allEmployees?.length || 0) - (new Set(attendanceToday?.map(r => r.employee_id)).size || 0),
    };

    // Device statistics
    const { data: devices } = await supabase
      .from('devices')
      .select('status')
      .eq('company_id', req.user.company_id);

    const deviceStatsResult = {
      total_devices: devices?.length || 0,
      online_devices: devices?.filter(d => d.status === 'online').length || 0,
      offline_devices: devices?.filter(d => d.status === 'offline').length || 0,
    };

    // Leave statistics
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('status, start_date, end_date')
      .eq('company_id', req.user.company_id);

    const leaveStatsResult = {
      pending_leaves: leaves?.filter(l => l.status === 'pending').length || 0,
      on_leave_today: leaves?.filter(l => {
        const startDate = new Date(l.start_date);
        const endDate = new Date(l.end_date);
        const todayDate = new Date(today);
        return l.status === 'approved' && todayDate >= startDate && todayDate <= endDate;
      }).length || 0,
      approved_this_month: leaves?.filter(l => {
        const startDate = new Date(l.start_date);
        return l.status === 'approved' && startDate.getMonth() === new Date().getMonth();
      }).length || 0,
    };

    // Recent attendance activity
    const { data: recentActivity } = await supabase
      .from('attendance_records')
      .select(`
        *,
        employees!left(full_name, employee_number, photo_url)
      `)
      .eq('company_id', req.user.company_id)
      .eq('attendance_date', today)
      .order('check_in_time', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        employees: employeeStatsResult,
        attendance: attendanceStatsResult,
        devices: deviceStatsResult,
        leaves: leaveStatsResult,
        recentActivity: recentActivity || [],
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
