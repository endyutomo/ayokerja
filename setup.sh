#!/bin/bash

# Cloud Attendance System - Setup Script
# This script helps you set up the application

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🚀 Cloud Attendance System - Setup Wizard              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not installed. Please install PostgreSQL 12+${NC}"
    echo "   Download from: https://www.postgresql.org/download/"
else
    echo -e "${GREEN}✅ PostgreSQL found${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "📦 Installing device-server dependencies..."
cd device-server && npm install && cd ..

# Database setup
echo ""
echo "🗄️  Database Setup"
echo "   Please ensure PostgreSQL is running and create a database named 'time_attendance'"
echo ""
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Enter PostgreSQL password: " -s DB_PASS
echo ""

read -p "Enter database name (default: time_attendance): " DB_NAME
DB_NAME=${DB_NAME:-time_attendance}

# Create .env file
echo ""
echo "⚙️  Creating backend .env file..."
cat > backend/.env << EOF
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
JWT_SECRET=cloud-attendance-secret-key-$(openssl rand -hex 16)
JWT_EXPIRE=7d
DEVICE_SERVER_PORT=4370
SOCKET_CORS_ORIGIN=http://localhost:3000
APP_NAME=Cloud Attendance System
COMPANY_NAME=Your Company
EOF

echo -e "${GREEN}✅ Backend .env created${NC}"

# Run migrations
echo ""
echo "🔄 Running database migrations..."
cd backend
npm run migrate

echo ""
echo "🌱 Seeding initial data..."
npm run seed
cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Setup Complete!                                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the application:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Open your browser:"
echo "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "3. Login with default credentials:"
echo "   Username: ${YELLOW}admin${NC}"
echo "   Password: ${YELLOW}admin123${NC}"
echo ""
echo "📚 Documentation: README.md"
echo ""
