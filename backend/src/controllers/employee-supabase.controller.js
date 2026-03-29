const { supabase } = require('../utils/supabaseClient');
const { logActivity } = require('../middleware/activityLogger');

// Get all employees
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, departmentId, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('employees')
      .select(`
        *,
        departments!left(name, code),
        shifts!left(name, code)
      `, { count: 'exact' })
      .eq('company_id', req.user.company_id);

    if (departmentId) query = query.eq('department_id', departmentId);
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,employee_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order('full_name', { ascending: true }).range(offset, offset + parseInt(limit) - 1);

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
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get employees.' });
  }
};

// Get employee by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('employees')
      .select('*, departments!left(name, code), shifts!left(name, code)')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get employee.' });
  }
};

// Create employee
exports.create = async (req, res) => {
  try {
    const employeeData = { ...req.body, company_id: req.user.company_id };
    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.user.company_id, req.user.id, 'CREATE_EMPLOYEE', 'employee', data.id, `Created employee ${data.full_name}`);

    res.status(201).json({ success: true, message: 'Employee created successfully.', data });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
};

// Update employee
exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(req.body)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    await logActivity(req.user.company_id, req.user.id, 'UPDATE_EMPLOYEE', 'employee', id, `Updated employee ${data.full_name}`);

    res.json({ success: true, message: 'Employee updated successfully.', data });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
};

// Delete employee
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('company_id', req.user.company_id);

    if (error) throw error;

    await logActivity(req.user.company_id, req.user.id, 'DELETE_EMPLOYEE', 'employee', id, 'Deleted employee');

    res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete employee.' });
  }
};

// Get employee attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', id);

    if (startDate) query = query.gte('attendance_date', startDate);
    if (endDate) query = query.lte('attendance_date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const summary = {
      totalDays: data?.length || 0,
      presentDays: data?.filter(r => r.status === 'present').length || 0,
      lateDays: data?.filter(r => r.status === 'late').length || 0,
      absentDays: data?.filter(r => r.status === 'absent').length || 0,
      totalWorkHours: data?.reduce((sum, r) => sum + (parseFloat(r.work_hours) || 0), 0) || 0,
      totalOvertimeHours: data?.reduce((sum, r) => sum + (parseFloat(r.overtime_hours) || 0), 0) || 0,
      totalLateMinutes: data?.reduce((sum, r) => sum + (r.late_minutes || 0), 0) || 0,
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendance summary.' });
  }
};
