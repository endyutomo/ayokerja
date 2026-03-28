const pool = require('../config/database');

// Get all shifts
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM shifts
      WHERE company_id = $1 AND is_active = true
      ORDER BY start_time
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shifts.',
    });
  }
};

// Get shift by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM shifts
      WHERE id = $1 AND company_id = $2
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shift.',
    });
  }
};

// Create shift
exports.create = async (req, res) => {
  try {
    const { name, code, startTime, endTime, breakStart, breakEnd, workHours, isOvernight } = req.body;
    
    const result = await pool.query(`
      INSERT INTO shifts (company_id, name, code, start_time, end_time, break_start, break_end, work_hours, is_overnight)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.company_id, name, code, startTime, endTime, breakStart, breakEnd, workHours, isOvernight || false]);
    
    res.status(201).json({
      success: true,
      message: 'Shift created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shift.',
    });
  }
};

// Update shift
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, startTime, endTime, breakStart, breakEnd, workHours, isOvernight } = req.body;
    
    const result = await pool.query(`
      UPDATE shifts 
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          break_start = COALESCE($5, break_start),
          break_end = COALESCE($6, break_end),
          work_hours = COALESCE($7, work_hours),
          is_overnight = COALESCE($8, is_overnight),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND company_id = $10
      RETURNING *
    `, [name, code, startTime, endTime, breakStart, breakEnd, workHours, isOvernight, id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Shift updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift.',
    });
  }
};

// Delete shift
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE shifts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Shift deleted successfully.',
    });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift.',
    });
  }
};
