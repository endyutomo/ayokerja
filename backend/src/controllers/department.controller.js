const pool = require('../config/database');

// Get all departments
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.is_active = true) as employee_count,
        parent.name as parent_name
      FROM departments d
      LEFT JOIN departments parent ON d.parent_id = parent.id
      WHERE d.company_id = $1 AND d.is_active = true
      ORDER BY d.name
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments.',
    });
  }
};

// Get department by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT d.*, parent.name as parent_name
      FROM departments d
      LEFT JOIN departments parent ON d.parent_id = parent.id
      WHERE d.id = $1 AND d.company_id = $2
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department.',
    });
  }
};

// Create department
exports.create = async (req, res) => {
  try {
    const { name, code, parentId, description } = req.body;
    
    const result = await pool.query(`
      INSERT INTO departments (company_id, name, code, parent_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.company_id, name, code, parentId, description]);
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department.',
    });
  }
};

// Update department
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, parentId, description } = req.body;
    
    const result = await pool.query(`
      UPDATE departments 
      SET name = COALESCE($1, name),
          code = COALESCE($2, code),
          parent_id = COALESCE($3, parent_id),
          description = COALESCE($4, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND company_id = $6
      RETURNING *
    `, [name, code, parentId, description, id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Department updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department.',
    });
  }
};

// Delete department
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE departments 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department.',
    });
  }
};
