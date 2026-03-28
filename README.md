# Cloud Attendance System

A comprehensive cloud-based time attendance web application designed to support attendance machines (including fingerprint scanners) and company HR systems. This application automatically pushes data from attendance machines to the server using a push protocol similar to Woowtime.

## Features

### Core Features
- **Device Integration** - TCP/UDP server for attendance machine communication (ZK Protocol support)
- **Real-time Data Sync** - Automatic data push from devices to cloud server
- **Multi-tenant Support** - Cloud-based architecture for multiple companies
- **PostgreSQL Database** - Robust data storage with optimized schemas

### HR Management
- Employee Management (CRUD operations)
- Department & Shift Management
- Leave Request Management
- Overtime Tracking
- Attendance Reports & Analytics

### Dashboard & Reporting
- Real-time attendance monitoring
- Weekly/Monthly attendance trends
- Department-wise statistics
- Late arrivals & overtime reports
- Export to CSV functionality

### Security
- JWT-based authentication
- Role-based access control (Admin, Manager, HR, Employee)
- Activity logging
- Secure password hashing

## Technology Stack

### Backend
- **Node.js** + **Express.js** - RESTful API
- **PostgreSQL** - Database
- **Socket.io** - Real-time updates
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI Framework
- **Material-UI (MUI)** - Component library
- **Bootstrap 5** - Responsive design
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io-client** - Real-time communication
- **Recharts** - Data visualization
- **Formik + Yup** - Form handling & validation

### Device Server
- **TCP/UDP Server** - Attendance machine communication
- **ZK Protocol** - Device data parsing

## Project Structure

```
time-attendance-app/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & logging middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── database/       # Migrations & seeds
│   │   └── index.js        # Entry point
│   ├── .env                # Environment variables
│   └── package.json
├── frontend/               # React application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── App.js          # Main app component
│   └── package.json
├── device-server/          # TCP/UDP device server
│   ├── src/
│   │   ├── config/
│   │   └── index.js        # Device server entry
│   └── package.json
├── database/               # SQL scripts
└── package.json            # Root package (workspaces)
```

## Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 12.0
- **npm** or **yarn**

## Installation

### 1. Clone the Repository

```bash
cd /Users/admin/time-attendance-app
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb time_attendance

# Or using psql
psql -U postgres
CREATE DATABASE time_attendance;
\q

# Run migrations
cd backend
npm run migrate

# Seed initial data
npm run seed
```

### 4. Configure Environment

Edit `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time_attendance
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
DEVICE_SERVER_PORT=4370
```

## Running the Application

### Development Mode

Run all services concurrently:

```bash
# From root directory
npm run dev
```

Or run services individually:

```bash
# Backend API (Terminal 1)
npm run dev:backend

# Frontend (Terminal 2)
npm run dev:frontend

# Device Server (Terminal 3)
npm run dev:device
```

### Production Mode

```bash
# Build frontend
npm run build

# Start backend
npm start
```

## Default Credentials

After running the seed script:

- **Username:** admin
- **Password:** admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/statistics` - Dashboard statistics
- `GET /api/dashboard/weekly-chart` - Weekly attendance chart
- `GET /api/dashboard/monthly-summary` - Monthly summary
- `GET /api/dashboard/department-attendance` - Department-wise attendance

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today` - Today's attendance
- `POST /api/attendance/manual` - Manual attendance entry
- `PUT /api/attendance/:id` - Update attendance

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Register device
- `POST /api/devices/:id/test-connection` - Test connection
- `POST /api/devices/:id/restart` - Restart device

### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/employee-summary` - Employee summary
- `GET /api/reports/late` - Late arrivals report
- `GET /api/reports/overtime` - Overtime report
- `GET /api/reports/leave` - Leave report

## Device Integration

### Supported Protocols
- ZK Protocol (ZK6.0)
- TCP/IP communication
- UDP data push

### Device Configuration
1. Navigate to Devices page
2. Click "Add Device"
3. Enter device details:
   - Device Name
   - Device ID
   - IP Address
   - Port (default: 4370)
   - Location

### Data Flow
1. Employee scans fingerprint/card on device
2. Device pushes attendance data via TCP/UDP
3. Device server receives and parses data
4. Data is saved to attendance_logs table
5. Background process creates/updates attendance_records
6. Real-time update sent to frontend via Socket.io

## Customization

### Adding New Report Types
1. Create controller function in `backend/src/controllers/report.controller.js`
2. Add route in `backend/src/routes/report.routes.js`
3. Create API service in `frontend/src/services/api.js`
4. Add UI component in `frontend/src/pages/Reports.js`

### Custom Device Protocol
Modify `device-server/src/index.js`:
- Add new command handlers
- Implement custom data parsing
- Extend protocol support

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS)
brew services restart postgresql@14
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Device Connection Issues
- Ensure device IP is reachable
- Check firewall settings
- Verify device port configuration
- Check device server logs

## License

MIT License - See LICENSE file for details.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Built with ❤️ using Node.js, React, and PostgreSQL**
