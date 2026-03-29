# Setup Default Login Credentials

## Default Credentials

The system comes with a default admin user:

- **Username:** `admin`
- **Password:** `admin123`

## Prerequisites

Before you can use the default login, you need to:

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
createdb time_attendance
```

Or using psql:
```sql
CREATE DATABASE time_attendance;
```

### 3. Configure Database Connection

Update `backend/.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=time_attendance
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

### 5. Seed Database (creates default admin user)

```bash
npm run seed
```

After running the seed script, you'll see:
```
✅ Admin user created (username: admin, password: admin123)
```

### 6. Start the Backend Server

```bash
npm run dev
```

### 7. Start the Frontend

```bash
cd ../frontend
npm run dev
```

## Access the Application

Open your browser and navigate to: `http://localhost:3000`

Login with:
- Username: `admin`
- Password: `admin123`

## Security Note

⚠️ **IMPORTANT:** After logging in for the first time, please change the default password immediately for security purposes.

## Troubleshooting

### PostgreSQL Connection Error

If you get a database connection error, make sure PostgreSQL is running:

```bash
# macOS
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Reset Admin Password

If you need to reset the admin password, run the seed script again or update directly in the database:

```sql
UPDATE users 
SET password_hash = '$2a$10$YourNewHashHere' 
WHERE username = 'admin';
```

Or create a new password hash using bcrypt and update the database.
