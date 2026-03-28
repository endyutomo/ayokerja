# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 12+ installed and running
- [ ] npm or yarn package manager

## Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
cd /Users/admin/time-attendance-app

# Run the setup script
./setup.sh

# Follow the prompts to configure database
```

### Option 2: Manual Setup

#### 1. Install Dependencies

```bash
cd /Users/admin/time-attendance-app

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd device-server && npm install && cd ..
```

#### 2. Create Database

```bash
# Using createdb
createdb time_attendance

# Or using psql
psql -U postgres
CREATE DATABASE time_attendance;
\q
```

#### 3. Configure Environment

Create `backend/.env` file:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time_attendance
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-this
DEVICE_SERVER_PORT=4370
```

#### 4. Run Migrations & Seed

```bash
cd backend
npm run migrate
npm run seed
cd ..
```

#### 5. Start the Application

```bash
# Start all services (backend, frontend, device-server)
npm run dev
```

## Access the Application

1. **Frontend:** http://localhost:3000
2. **Backend API:** http://localhost:3001/api
3. **Device Server:** Port 4370 (TCP), 4371 (UDP)

### Default Login

- **Username:** admin
- **Password:** admin123

## Project Structure Overview

```
time-attendance-app/
├── backend/           # API server (Port 3001)
├── frontend/          # React app (Port 3000)
├── device-server/     # Device communication (Port 4370)
└── database/          # SQL scripts
```

## Common Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:device       # Start device server only

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed initial data

# Production
npm run build            # Build frontend
npm start                # Start backend
```

## Testing Device Connection

### Simulate Device Data

You can test the device server using netcat:

```bash
# Send test data to device server
echo -n "test data" | nc localhost 4370
```

### Configure Physical Device

1. Access device menu
2. Network settings → Server IP
3. Set server IP to your computer's IP
4. Set port to 4370
5. Enable "Auto Send Attendance"

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 4370
lsof -ti:4370 | xargs kill -9
```

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS with Homebrew)
brew services restart postgresql
```

### Frontend Build Error

```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules/.cache
npm run build
```

## Next Steps

1. **Configure Devices** - Add your attendance machines in the Devices page
2. **Add Employees** - Import or create employee records
3. **Set Up Departments** - Create organizational structure
4. **Configure Shifts** - Define work schedules
5. **Test Attendance** - Verify data sync from devices

## Support

- Documentation: `README.md`
- API Documentation: See backend routes in `backend/src/routes/`
- Device Protocol: See `device-server/src/index.js`

---

**Happy Managing! 🎉**
