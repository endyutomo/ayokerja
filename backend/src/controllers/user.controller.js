const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../middleware/activityLogger');

// Get all users
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.*, e.full_name, e.employee_number
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (search) {
      query += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR e.full_name ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    if (role) {
      query += ` AND u.role = $${paramCount++}`;
      values.push(role);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE company_id = $1',
      [req.user.company_id]
    );
    
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users.',
    });
  }
};

// Get user by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT u.*, e.full_name, e.employee_number
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    const user = result.rows[0];
    delete user.password_hash;
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user.',
    });
  }
};

// Create user
exports.create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, password, employeeId, role = 'employee' } = req.body;
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await client.query(`
      INSERT INTO users (company_id, employee_id, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, is_active, created_at
    `, [req.user.company_id, employeeId, username, email, passwordHash, role]);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'CREATE_USER',
      'user',
      result.rows[0].id,
      `Created user ${username}`
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user.',
    });
  } finally {
    client.release();
  }
};

// Update user
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;
    
    const result = await pool.query(`
      UPDATE users 
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, username, email, role, is_active, updated_at
    `, [username, email, role, isActive, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user.',
    });
  }
};

// Delete user
exports.delete = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'DELETE_USER',
      'user',
      id,
      `Deleted user ${id}`
    );
    
    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
    });
  } finally {
    client.release();
  }
};

// Get user permissions
exports.getPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT permissions FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0].permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get permissions.',
    });
  }
};

// Update user permissions
exports.updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    const result = await pool.query(`
      UPDATE users 
      SET permissions = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, permissions
    `, [JSON.stringify(permissions), id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    res.json({
      success: true,
      message: 'Permissions updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions.',
    });
  }
};
