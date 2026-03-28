const net = require('net');
const dgram = require('dgram');
const pool = require('./config/database');
require('dotenv').config({ path: '../backend/.env' });

const DEVICE_PORT = process.env.DEVICE_SERVER_PORT || 4370;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Attendance Machine Protocol Constants
const CMD_CONNECT = 1000;
const CMD_EXIT = 1001;
const CMD_ENABLE_DEVICE = 1002;
const CMD_DISABLE_DEVICE = 1003;
const CMD_RESTART = 1004;
const CMD_POWEROFF = 1005;
const CMD_ACK = 2000;
const CMD_DATA = 2001;
const CMD_ATTLOG_RRN = 2002;
const CMD_CLEAR_ATTLOG = 2003;
const CMD_CLEAR_DATA = 2004;
const CMD_WRITE_LCD = 2005;
const CMD_GET_TIME = 2006;
const CMD_SET_TIME = 2007;
const CMD_VERSION = 2008;
const CMD_DEVICE_NAME = 2009;
const CMD_PUSH_ATTLOG = 5000;

class DeviceServer {
  constructor() {
    this.tcpServer = null;
    this.udpServer = null;
    this.clients = new Map();
    this.commandQueue = new Map();
  }

  async start() {
    await this.startTCPServer();
    await this.startUDPServer();
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📡 Device Communication Server                          ║
║                                                           ║
║   TCP Server: port ${DEVICE_PORT}                            ║
║   UDP Server: port ${DEVICE_PORT + 1}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  }

  async startTCPServer() {
    return new Promise((resolve) => {
      this.tcpServer = net.createServer((socket) => {
        const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`🔌 Device connected: ${clientId}`);
        
        this.clients.set(clientId, {
          socket,
          deviceId: null,
          connectedAt: new Date(),
          lastActivity: new Date(),
        });

        socket.on('data', async (data) => {
          try {
            await this.handleTCPData(clientId, data);
          } catch (error) {
            console.error('Error handling TCP data:', error);
          }
        });

        socket.on('error', (error) => {
          console.error(`Socket error ${clientId}:`, error);
        });

        socket.on('close', () => {
          console.log(`🔌 Device disconnected: ${clientId}`);
          this.clients.delete(clientId);
        });

        // Send welcome message
        socket.write(this.encodeCommand(CMD_ACK, 0));
      });

      this.tcpServer.listen(DEVICE_PORT, () => {
        console.log(`✅ TCP Server listening on port ${DEVICE_PORT}`);
        resolve();
      });
    });
  }

  async startUDPServer() {
    return new Promise((resolve) => {
      this.udpServer = dgram.createSocket('udp4');

      this.udpServer.on('message', async (msg, rinfo) => {
        try {
          await this.handleUDPData(msg, rinfo);
        } catch (error) {
          console.error('Error handling UDP data:', error);
        }
      });

      this.udpServer.on('error', (error) => {
        console.error('UDP Server error:', error);
      });

      this.udpServer.bind(DEVICE_PORT + 1, () => {
        console.log(`✅ UDP Server listening on port ${DEVICE_PORT + 1}`);
        resolve();
      });
    });
  }

  async handleTCPData(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    // Parse command
    const command = data.readUInt16LE(0);
    const sessionId = data.readUInt16LE(2);
    const replyId = data.readUInt16LE(4);
    const dataLength = data.readUInt32LE(8);

    console.log(`📥 Command: ${command}, Session: ${sessionId}, Data Length: ${dataLength}`);

    switch (command) {
      case CMD_CONNECT:
        await this.handleConnect(clientId, sessionId);
        break;

      case CMD_EXIT:
        await this.handleExit(clientId, sessionId);
        break;

      case CMD_PUSH_ATTLOG:
      case CMD_DATA:
        await this.handleAttendanceData(clientId, data, sessionId);
        break;

      case CMD_VERSION:
        await this.handleVersion(clientId, sessionId);
        break;

      case CMD_DEVICE_NAME:
        await this.handleDeviceName(clientId, data, sessionId);
        break;

      default:
        // Send ACK for unknown commands
        this.sendCommand(client.socket, CMD_ACK, sessionId);
    }
  }

  async handleUDPData(msg, rinfo) {
    const command = msg.readUInt16LE(0);
    console.log(`📥 UDP Command: ${command} from ${rinfo.address}:${rinfo.port}`);

    // Handle UDP attendance push (common in some devices)
    if (command === CMD_PUSH_ATTLOG || msg.length > 8) {
      await this.processAttendanceData(msg, rinfo.address);
    }

    // Send ACK
    const response = Buffer.alloc(8);
    response.writeUInt16LE(CMD_ACK, 0);
    response.writeUInt16LE(0, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(0, 8);
    
    this.udpServer.send(response, rinfo.port, rinfo.address);
  }

  async handleConnect(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`🔐 Device authentication: ${clientId}`);
    
    // Send ACK with session info
    const response = Buffer.alloc(8);
    response.writeUInt16LE(CMD_ACK, 0);
    response.writeUInt16LE(sessionId + 1, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(0, 8);
    
    client.socket.write(response);
  }

  async handleExit(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`👋 Device exit: ${clientId}`);
    client.socket.end();
  }

  async handleAttendanceData(clientId, data, sessionId) {
    console.log(`📊 Processing attendance data from ${clientId}`);

    // Parse attendance records from data
    const records = this.parseAttendanceData(data);
    
    for (const record of records) {
      await this.saveAttendanceRecord(record, clientId);
    }

    // Send ACK
    this.sendCommand(client.socket, CMD_ACK, sessionId);
    
    console.log(`✅ Processed ${records.length} attendance records`);
  }

  async handleVersion(clientId, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const version = 'ZK6.0';
    const response = Buffer.alloc(8 + version.length);
    response.writeUInt16LE(CMD_ACK, 0);
    response.writeUInt16LE(sessionId + 1, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(version.length, 8);
    response.write(version, 12);
    
    client.socket.write(response);
  }

  async handleDeviceName(clientId, data, sessionId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Extract device name from request
    const deviceName = data.toString('utf8', 12, data.length).trim();
    console.log(`📱 Device name: ${deviceName}`);

    // Update device info in database
    await this.updateDeviceInfo(clientId, { name: deviceName });

    const response = Buffer.alloc(8);
    response.writeUInt16LE(CMD_ACK, 0);
    response.writeUInt16LE(sessionId + 1, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(0, 8);
    
    client.socket.write(response);
  }

  parseAttendanceData(data) {
    const records = [];
    const dataStart = 12; // Skip header
    const recordSize = 40; // Typical record size

    for (let i = dataStart; i < data.length - recordSize; i += recordSize) {
      try {
        const employeeNumber = data.readUInt32LE(i).toString();
        const timestamp = this.decodeTimestamp(data.slice(i + 4, i + 8));
        const status = data.readUInt8(i + 8);
        const punchType = data.readUInt8(i + 9);

        if (timestamp && employeeNumber !== '0') {
          records.push({
            employeeNumber,
            timestamp,
            status,
            punchType,
          });
        }
      } catch (error) {
        console.error('Error parsing record:', error);
      }
    }

    return records;
  }

  decodeTimestamp(buffer) {
    try {
      // ZK protocol timestamp decoding
      const second = buffer.readUInt8(0);
      const minute = buffer.readUInt8(1);
      const hour = buffer.readUInt8(2);
      const day = buffer.readUInt8(3);
      const month = buffer.readUInt8(4);
      const year = buffer.readUInt8(5) + 2000;

      const date = new Date(year, month - 1, day, hour, minute, second);
      
      if (date.getFullYear() > 2020 && date.getFullYear() < 2030) {
        return date;
      }
    } catch (error) {
      // Ignore timestamp decode errors
    }
    return null;
  }

  async saveAttendanceRecord(record, clientId) {
    try {
      // Find device by IP address
      const ip = clientId.split(':')[0];
      const deviceResult = await pool.query(
        'SELECT id, company_id FROM devices WHERE ip_address = $1 AND is_active = true',
        [ip]
      );

      let deviceId = null;
      let companyId = null;

      if (deviceResult.rows.length > 0) {
        deviceId = deviceResult.rows[0].id;
        companyId = deviceResult.rows[0].company_id;
      }

      // Save to attendance logs
      await pool.query(`
        INSERT INTO attendance_logs (device_id, employee_number, punch_time, punch_type, status, raw_data, processed)
        VALUES ($1, $2, $3, $4, $5, $6, false)
      `, [
        deviceId,
        record.employeeNumber,
        record.timestamp,
        record.punchType,
        record.status,
        JSON.stringify({ clientId, ...record }),
      ]);

      console.log(`💾 Saved attendance: Employee ${record.employeeNumber} at ${record.timestamp}`);

      // Notify backend via HTTP or process immediately
      await this.processAttendanceLog();
    } catch (error) {
      console.error('Error saving attendance record:', error);
    }
  }

  async updateDeviceInfo(clientId, info) {
    try {
      const ip = clientId.split(':')[0];
      await pool.query(`
        UPDATE devices 
        SET name = COALESCE($1, name),
            last_connection = CURRENT_TIMESTAMP,
            status = 'online'
        WHERE ip_address = $2
      `, [info.name, ip]);
    } catch (error) {
      console.error('Error updating device info:', error);
    }
  }

  sendCommand(socket, command, sessionId, data = null) {
    const dataLength = data ? data.length : 0;
    const response = Buffer.alloc(8 + dataLength);
    
    response.writeUInt16LE(command, 0);
    response.writeUInt16LE(sessionId + 1, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(dataLength, 8);
    
    if (data) {
      data.copy(response, 12);
    }
    
    socket.write(response);
  }

  encodeCommand(command, sessionId) {
    const response = Buffer.alloc(8);
    response.writeUInt16LE(command, 0);
    response.writeUInt16LE(sessionId, 2);
    response.writeUInt16LE(0, 4);
    response.writeUInt32LE(0, 8);
    return response;
  }

  async processAttendanceLog() {
    try {
      // Get unprocessed logs
      const result = await pool.query(`
        SELECT al.*, d.company_id, e.id as employee_id
        FROM attendance_logs al
        LEFT JOIN devices d ON al.device_id = d.id
        LEFT JOIN employees e ON e.employee_number = al.employee_number
        WHERE al.processed = false
        ORDER BY al.punch_time ASC
        LIMIT 100
      `);

      for (const log of result.rows) {
        await this.createOrUpdateAttendanceRecord(log);
        
        // Mark as processed
        await pool.query(
          'UPDATE attendance_logs SET processed = true, processed_at = CURRENT_TIMESTAMP WHERE id = $1',
          [log.id]
        );
      }
    } catch (error) {
      console.error('Error processing attendance logs:', error);
    }
  }

  async createOrUpdateAttendanceRecord(log) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const attendanceDate = log.punch_time.toISOString().split('T')[0];

      // Check if record exists for this employee and date
      const existingResult = await client.query(
        'SELECT * FROM attendance_records WHERE employee_id = $1 AND attendance_date = $2',
        [log.employee_id, attendanceDate]
      );

      if (existingResult.rows.length === 0) {
        // Create new record
        await client.query(`
          INSERT INTO attendance_records 
            (company_id, employee_id, device_id, attendance_date, check_in_time, check_in_device_id, status, raw_data)
          VALUES ($1, $2, $3, $4, $5, $6, 'present', $7)
        `, [
          log.company_id,
          log.employee_id,
          log.device_id,
          attendanceDate,
          log.punch_time,
          log.device_id,
          JSON.stringify(log),
        ]);
      } else {
        // Update existing record (check-out)
        const existing = existingResult.rows[0];
        
        if (!existing.check_out_time && log.punch_time > existing.check_in_time) {
          await client.query(`
            UPDATE attendance_records 
            SET check_out_time = $1, check_out_device_id = $2
            WHERE id = $3
          `, [log.punch_time, log.device_id, existing.id]);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating attendance record:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.tcpServer) {
        this.tcpServer.close(() => {
          console.log('TCP Server stopped');
        });
      }
      
      if (this.udpServer) {
        this.udpServer.close(() => {
          console.log('UDP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Start the device server
const server = new DeviceServer();

// Process unprocessed logs periodically
setInterval(() => {
  server.processAttendanceLog();
}, 30000); // Every 30 seconds

server.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down device server...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down device server...');
  await server.stop();
  process.exit(0);
});

module.exports = DeviceServer;
