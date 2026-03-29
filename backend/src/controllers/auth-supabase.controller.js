const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { logActivity } = require('../middleware/activityLogger');

// Register new user
exports.register = async (req, res) => {
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

    // Insert user using Supabase REST API
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        company_id: companyId,
        employee_id: employeeId || null,
        username,
        email,
        password_hash: passwordHash,
        role,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists.',
        });
      }
      throw error;
    }

    await logActivity(companyId, user.id, 'REGISTER', 'user', user.id, `User ${username} registered`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
    });
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

    // Find user using Supabase REST API
    let query;
    if (username) {
      query = supabase.from('users').select(`
        id, company_id, username, email, password_hash, role, permissions, is_active,
        employees!left(full_name, employee_number, photo_url)
      `).eq('username', username).eq('is_active', true).single();
    } else {
      query = supabase.from('users').select(`
        id, company_id, username, email, password_hash, role, permissions, is_active,
        employees!left(full_name, employee_number, photo_url)
      `).eq('email', email).eq('is_active', true).single();
    }

    const { data: user, error } = await query;

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

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

    // Update last login using Supabase REST API
    await supabase.from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

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
          fullName: user.employees?.full_name,
          employeeNumber: user.employees?.employee_number,
          photoUrl: user.employees?.photo_url,
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
  try {
    const { fullName, email, phone } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    // Update employee using Supabase REST API
    const { data } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', req.user.employee_id)
      .select()
      .single();

    await logActivity(req.user.company_id, userId, 'UPDATE_PROFILE', 'user', userId, 'Profile updated');

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: data,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
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

    // Get current password hash using Supabase REST API
    const { data: user } = await supabase
      .from('users')
      .select('password_hash, company_id')
      .eq('id', userId)
      .single();

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

    // Update password using Supabase REST API
    await supabase.from('users')
      .update({ 
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', userId);

    await logActivity(user.company_id, userId, 'CHANGE_PASSWORD', 'user', userId, 'Password changed');

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
