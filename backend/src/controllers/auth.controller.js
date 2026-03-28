const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Register new user
exports.register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, password, employeeId, role = 'employee', companyId } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await client.query(`
      INSERT INTO users (company_id, employee_id, username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, role, is_active, created_at
    `, [companyId, employeeId || null, username, email, passwordHash, role, true]);
    
    const user = result.rows[0];
    
    await logActivity(companyId, user.id, 'REGISTER', 'user', user.id, `User ${username} registered`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: user,
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
    });
  } finally {
    client.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
    }
    
    // Find user
    const query = username 
      ? `SELECT u.*, e.full_name, e.employee_number, e.photo_url 
         FROM users u 
         LEFT JOIN employees e ON u.employee_id = e.id 
         WHERE u.username = $1 AND u.is_active = true`
      : `SELECT u.*, e.full_name, e.employee_number, e.photo_url 
         FROM users u 
         LEFT JOIN employees e ON u.employee_id = e.id 
         WHERE u.email = $1 AND u.is_active = true`;
    
    const result = await pool.query(query, [username || email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    await logActivity(user.company_id, user.id, 'LOGIN', 'user', user.id, `User ${user.username} logged in`);
    
    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          employeeNumber: user.employee_number,
          photoUrl: user.photo_url,
          companyId: user.company_id,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        employeeNumber: user.employee_number,
        photoUrl: user.photo_url,
        companyId: user.company_id,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile.',
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { fullName, email, phone } = req.body;
    const userId = req.user.id;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (fullName) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    
    if (phone) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    
    const result = await client.query(`
      UPDATE employees 
      SET ${updates.join(', ')} 
      WHERE id = (SELECT employee_id FROM users WHERE id = $${paramCount})
      RETURNING full_name, email, phone
    `, values);
    
    await logActivity(req.user.company_id, userId, 'UPDATE_PROFILE', 'user', userId, 'Profile updated');
    
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  } finally {
    client.release();
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }
    
    // Get current password hash
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [newPasswordHash, userId]);
    
    await logActivity(req.user.company_id, userId, 'CHANGE_PASSWORD', 'user', userId, 'Password changed');
    
    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    await logActivity(req.user.company_id, req.user.id, 'LOGOUT', 'user', req.user.id, 'User logged out');
    
    res.json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
    });
  }
};
