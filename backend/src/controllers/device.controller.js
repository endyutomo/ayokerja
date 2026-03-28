const pool = require('../config/database');
const { logActivity } = require('../middleware/activityLogger');

// Get all devices
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT d.*, dep.name as department_name
      FROM devices d
      LEFT JOIN departments dep ON d.department_id = dep.id
      WHERE d.company_id = $1
    `;
    
    const values = [req.user.company_id];
    let paramCount = 2;
    
    if (status) {
      query += ` AND d.status = $${paramCount++}`;
      values.push(status);
    }
    
    if (search) {
      query += ` AND (d.name ILIKE $${paramCount} OR d.device_id ILIKE $${paramCount} OR d.serial_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM devices WHERE company_id = $1`;
    const countValues = [req.user.company_id];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countValues.push(status);
    }
    
    const countResult = await pool.query(countQuery, countValues);
    
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
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices.',
    });
  }
};

// Get device by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT d.*, dep.name as department_name
      FROM devices d
      LEFT JOIN departments dep ON d.department_id = dep.id
      WHERE d.id = $1 AND d.company_id = $2
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device.',
    });
  }
};

// Create device
exports.create = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      name, deviceId, serialNumber, model, manufacturer,
      firmwareVersion, ipAddress, port, location, departmentId,
    } = req.body;
    
    const result = await client.query(`
      INSERT INTO devices (
        company_id, name, device_id, serial_number, model, manufacturer,
        firmware_version, ip_address, port, location, department_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      req.user.company_id, name, deviceId, serialNumber, model, manufacturer,
      firmwareVersion, ipAddress, port || 4370, location, departmentId,
    ]);
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'CREATE_DEVICE',
      'device',
      result.rows[0].id,
      `Created device ${name} (${deviceId})`
    );
    
    res.status(201).json({
      success: true,
      message: 'Device created successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Device ID already exists.',
      });
    }
    console.error('Create device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device.',
    });
  } finally {
    client.release();
  }
};

// Update device
exports.update = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = [
      'name', 'device_id', 'serial_number', 'model', 'manufacturer',
      'firmware_version', 'ip_address', 'port', 'location', 'department_id', 'settings',
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.company_id);
    
    const result = await client.query(`
      UPDATE devices 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount++} AND company_id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'UPDATE_DEVICE',
      'device',
      id,
      `Updated device ${result.rows[0].name}`
    );
    
    res.json({
      success: true,
      message: 'Device updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Device ID already exists.',
      });
    }
    console.error('Update device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device.',
    });
  } finally {
    client.release();
  }
};

// Delete device
exports.delete = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      UPDATE devices 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `, [id, req.user.company_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }
    
    await logActivity(
      req.user.company_id,
      req.user.id,
      'DELETE_DEVICE',
      'device',
      id,
      `Deleted device ${result.rows[0].name}`
    );
    
    res.json({
      success: true,
      message: 'Device deleted successfully.',
    });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device.',
    });
  } finally {
    client.release();
  }
};

// Test device connection
exports.testConnection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM devices WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }
    
    const device = result.rows[0];
    
    // Simulate connection test (in real app, would actually connect)
    const isConnected = device.status === 'online' && device.last_connection;
    const lastConnection = device.last_connection 
      ? new Date(device.last_connection).toISOString()
      : 'Never';
    
    res.json({
      success: true,
      data: {
        deviceId: device.id,
        name: device.name,
        ipAddress: device.ip_address,
        status: device.status,
        lastConnection,
        isConnected,
      },
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test device connection.',
    });
  }
};

// Restart device
exports.restart = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM devices WHERE id = $1 AND company_id = $2',
      [id, req.user.company_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }
    
    // In real implementation, send restart command to device
    await logActivity(
      req.user.company_id,
      req.user.id,
      'RESTART_DEVICE',
      'device',
      id,
      `Restarted device ${result.rows[0].name}`
    );
    
    res.json({
      success: true,
      message: 'Restart command sent to device.',
    });
  } catch (error) {
    console.error('Restart device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart device.',
    });
  }
};

// Get device statistics
exports.getStatistics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(*) FILTER (WHERE status = 'online') as online_devices,
        COUNT(*) FILTER (WHERE status = 'offline') as offline_devices,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_devices
      FROM devices
      WHERE company_id = $1
    `, [req.user.company_id]);
    
    // Get recent activity
    const activityResult = await pool.query(`
      SELECT COUNT(*) as today_records
      FROM attendance_logs al
      JOIN devices d ON al.device_id = d.id
      WHERE d.company_id = $1 
        AND DATE(al.punch_time) = CURRENT_DATE
    `, [req.user.company_id]);
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        todayAttendanceRecords: parseInt(activityResult.rows[0].today_records),
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device statistics.',
    });
  }
};
