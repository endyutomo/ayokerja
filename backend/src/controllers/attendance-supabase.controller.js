const { supabase } = require('../utils/supabaseClient');
const { logActivity } = require('../middleware/activityLogger');

// Get all attendance records
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, employeeId, departmentId, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        employees!left(full_name, employee_number, photo_url),
        departments!left(name),
        check_in_device:devices!attendance_records_check_in_device_id_fkey(name),
        check_out_device:devices!attendance_records_check_out_device_id_fkey(name)
      `, { count: 'exact' })
      .eq('company_id', req.user.company_id);

    if (startDate) query = query.gte('attendance_date', startDate);
    if (endDate) query = query.lte('attendance_date', endDate);
    if (employeeId) query = query.eq('employee_id', employeeId);
    if (status) query = query.eq('status', status);

    query = query
      .order('attendance_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance records.' });
  }
};

// Get attendance by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        employees!left(full_name, employee_number, photo_url),
        departments!left(name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance record.' });
  }
};

// Get today's attendance
exports.getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: attendanceToday } = await supabase
      .from('attendance_records')
      .select(`
        *,
        employees!left(full_name, employee_number, photo_url),
        departments!left(name)
      `)
      .eq('company_id', req.user.company_id)
      .eq('attendance_date', today)
      .order('check_in_time', { ascending: false });

    const { data: allEmployees } = await supabase
      .from('employees')
      .select('id, is_active')
      .eq('company_id', req.user.company_id)
      .eq('is_active', true);

    const summary = {
      total: attendanceToday?.length || 0,
      checkedIn: attendanceToday?.filter(r => r.check_in_time && !r.check_out_time).length || 0,
      checkedOut: attendanceToday?.filter(r => r.check_in_time && r.check_out_time).length || 0,
      notYet: (allEmployees?.length || 0) - (attendanceToday?.length || 0),
      late: attendanceToday?.filter(r => r.status === 'late').length || 0,
    };

    res.json({ success: true, data: attendanceToday || [], summary });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get today attendance.' });
  }
};

// Manual attendance
exports.manualAttendance = async (req, res) => {
  const { employeeId, type, time, notes } = req.body;
  const now = time ? new Date(time) : new Date();
  const attendanceDate = now.toISOString().split('T')[0];

  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', attendanceDate)
      .single();

    let result;
    if (!existing) {
      // Create new record
      result = await supabase
        .from('attendance_records')
        .insert({
          company_id: req.user.company_id,
          employee_id: employeeId,
          attendance_date: attendanceDate,
          check_in_time: now,
          status: 'present',
          notes: notes || 'Manual check-in',
        })
        .select()
        .single();
    } else if (type === 'check_out' && !existing.check_out_time) {
      const workHours = (now - new Date(existing.check_in_time)) / (1000 * 60 * 60);
      result = await supabase
        .from('attendance_records')
        .update({ check_out_time: now, work_hours: workHours.toFixed(2), notes: notes || 'Manual check-out' })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid attendance action.' });
    }

    await logActivity(req.user.company_id, req.user.id, 'MANUAL_ATTENDANCE', 'attendance', result.id, `Manual ${type} for employee ${employeeId}`);

    res.json({ success: true, message: `Manual ${type} recorded successfully.`, data: result });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to record manual attendance.' });
  }
};

// Update attendance
exports.update = async (req, res) => {
  const { id } = req.params;
  const { checkInTime, checkOutTime, workHours, overtimeHours, status, notes, lateMinutes, earlyDepartureMinutes } = req.body;

  try {
    const updates = {};
    if (checkInTime) updates.check_in_time = checkInTime;
    if (checkOutTime) updates.check_out_time = checkOutTime;
    if (workHours !== undefined) updates.work_hours = workHours;
    if (overtimeHours !== undefined) updates.overtime_hours = overtimeHours;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (lateMinutes !== undefined) updates.late_minutes = lateMinutes;
    if (earlyDepartureMinutes !== undefined) updates.early_departure_minutes = earlyDepartureMinutes;

    const { data, error } = await supabase
      .from('attendance_records')
      .update({ ...updates, verified_by: req.user.id, verified_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    await logActivity(req.user.company_id, req.user.id, 'UPDATE_ATTENDANCE', 'attendance', id, `Updated attendance record ${id}`);

    res.json({ success: true, message: 'Attendance record updated successfully.', data });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance record.' });
  }
};

// Delete attendance
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id)
      .eq('company_id', req.user.company_id);

    if (error) throw error;

    await logActivity(req.user.company_id, req.user.id, 'DELETE_ATTENDANCE', 'attendance', id, `Deleted attendance record ${id}`);

    res.json({ success: true, message: 'Attendance record deleted successfully.' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete attendance record.' });
  }
};

// Get attendance summary
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, departmentId } = req.query;

    const { data: records } = await supabase
      .from('attendance_records')
      .select('employee_id, status, work_hours, overtime_hours, late_minutes')
      .eq('company_id', req.user.company_id);

    if (startDate) {
      records = records?.filter(r => r.attendance_date >= startDate);
    }
    if (endDate) {
      records = records?.filter(r => r.attendance_date <= endDate);
    }

    const summary = {
      total_employees: new Set(records?.map(r => r.employee_id)).size || 0,
      present_count: records?.filter(r => r.status === 'present' || r.status === 'late').length || 0,
      late_count: records?.filter(r => r.status === 'late').length || 0,
      absent_count: 0,
      avg_work_hours: records?.reduce((sum, r) => sum + (parseFloat(r.work_hours) || 0), 0) / (records?.length || 1),
      total_overtime_hours: records?.reduce((sum, r) => sum + (parseFloat(r.overtime_hours) || 0), 0) || 0,
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance summary.' });
  }
};

// Process attendance logs
exports.processLogs = async (req, res) => {
  try {
    const { data: pendingLogs } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('processed', false);

    res.json({
      success: true,
      message: `Processing ${pendingLogs?.length || 0} pending attendance logs.`,
      data: { pendingCount: pendingLogs?.length || 0 },
    });
  } catch (error) {
    console.error('Process logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to process attendance logs.' });
  }
};
