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

## Deployment Guide (Online & Multi-User)

Aplikasi ini sudah **multi-user ready** dengan fitur authentication, role-based access control, dan multi-tenant support. Berikut panduan untuk deploy ke production agar bisa diakses online.

### 📋 Arsitektur Deployment

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend API   │────▶│   Supabase DB   │
│   (Vercel)      │     │   (Railway)      │     │   (Cloud)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  Device Server  │
                        │  (VPS $5/bln)   │
                        └─────────────────┘
```

### 🚀 Platform Rekomendasi

| Service | Platform | Biaya | Status |
|---------|----------|-------|--------|
| Database | Supabase | Gratis (500MB) | ✅ Sudah dikonfigurasi |
| Backend | Railway / Render | $0-7/bln | Perlu deploy |
| Frontend | Vercel | Gratis | Perlu deploy |
| Device Server | DigitalOcean VPS | $5/bln | Perlu deploy |
| Domain | Namecheap | ~$1/thn | Opsional |

**Total Estimasi:** ~$6-13/bln

---

### Step 1: Environment Variables Production

Buat file `backend/.env.production`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration (PENTING: Ganti dengan yang baru!)
JWT_SECRET=generate-new-secure-random-string-here-min-32-chars
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=https://your-domain.com
SOCKET_CORS_ORIGIN=https://your-domain.com

# Device Server Configuration
DEVICE_SERVER_PORT=4370
DEVICE_SERVER_HOST=your-vps-ip.com

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

### Step 2: Deploy Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login ke Railway
railway login

# Initialize project di folder backend
cd backend
railway init

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-new-secret-key
railway variables set FRONTEND_URL=https://your-domain.com
railway variables set SUPABASE_URL=https://your-project.supabase.co
# ... dst untuk variable lainnya
```

**Alternatif - Render.com:**

1. Push code ke GitHub
2. Buka https://render.com
3. Create New Web Service
4. Connect repository
5. Root Directory: `backend`
6. Build Command: `npm install`
7. Start Command: `npm start`
8. Add environment variables di dashboard

---

### Step 3: Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy dari folder frontend
cd frontend
vercel

# Set environment variables di Vercel Dashboard:
# VITE_API_URL=https://your-backend-url.railway.app
```

**Build Settings di Vercel:**
- Framework Preset: Create React App
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

---

### Step 4: Deploy Device Server (VPS)

**Opsi A: DigitalOcean Droplet ($5/bln)**

```bash
# SSH ke VPS
ssh root@your-vps-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-username/ayokerja.git
cd ayokerja/device-server

# Install dependencies
npm install

# Buat file .env
nano .env
```

Isi `.env` untuk device-server:
```env
PORT=4370
BACKEND_URL=https://your-backend-url.com
```

**Jalankan dengan PM2 (process manager):**

```bash
# Install PM2
npm install -g pm2

# Start device server
pm2 start src/index.js --name device-server

# Auto-start on boot
pm2 startup
pm2 save
```

**Opsi B: Cloudflare Tunnel (Tanpa VPS)**

Jika ingin device server jalan di backend hosting:

```bash
# Install cloudflared
# Di backend hosting, tambahkan tunnel untuk port 4370
```

---

### Step 5: Setup Domain & SSL

**Beli Domain (opsional):**

```bash
# Contoh di Namecheap
# absensi-perusahaan.com - ~$10/tahun
```

**Setup DNS Records:**

| Type | Name | Value |
|------|------|-------|
| A | @ | your-vps-ip |
| CNAME | api | your-backend-url.railway.app |
| CNAME | app | your-app.vercel.app |

**SSL/HTTPS:** Otomatis aktif di Vercel, Railway, Render

---

### Step 6: Update CORS di Backend

Edit `backend/src/index.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### Step 7: Keamanan Production

** Checklist Keamanan:**

- [ ] Ganti `JWT_SECRET` dengan string random baru (min 32 karakter)
- [ ] Update password default user `admin`
- [ ] Enable rate limiting (sudah ada di backend)
- [ ] Setup backup database rutin (Supabase auto-backup)
- [ ] Enable logging & monitoring
- [ ] Setup firewall rules di VPS
- [ ] Gunakan environment variables (jangan hardcode)

**Generate JWT Secret baru:**

```javascript
// Di Node.js REPL
require('crypto').randomBytes(32).toString('hex')
// Copy hasil dan paste ke JWT_SECRET
```

---

### Step 8: Monitoring & Maintenance

**Logs:**

```bash
# Railway
railway logs

# Vercel
vercel logs

# VPS (PM2)
pm2 logs device-server
```

**Backup Database:**

```bash
# Supabase auto-backup daily
# Manual backup via Supabase Dashboard
```

---

### Troubleshooting Deployment

**Backend tidak bisa connect ke database:**
```bash
# Pastikan SUPABASE_URL dan keys benar
# Check connection string di Supabase Dashboard
```

**CORS Error:**
```bash
# Update FRONTEND_URL di backend .env
# Restart backend deployment
```

**Device tidak connect:**
```bash
# Pastikan port 4370 terbuka di firewall VPS
# sudo ufw allow 4370/tcp
# Check device server logs: pm2 logs device-server
```

---

## License

MIT License - See LICENSE file for details.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Built with ❤️ using Node.js, React, and PostgreSQL**
