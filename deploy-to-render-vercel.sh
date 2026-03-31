#!/bin/bash

# ============================================
# DEPLOY TO RENDER + VERCEL - AUTOMATED SCRIPT
# ============================================

set -e

echo "🚀 Starting Deployment to Render + Vercel..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# CHECK PREREQUISITES
# ============================================
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check for 'jq' (JSON parser)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}'jq' not found. Installing...${NC}"
    brew install jq 2>/dev/null || sudo apt-get install -y jq 2>/dev/null || {
        echo -e "${RED}Please install jq manually: brew install jq${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"
echo ""

# ============================================
# RENDER DEPLOYMENT
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📦 DEPLOYING TO RENDER${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}Please follow these steps in your browser:${NC}"
echo ""
echo "1. Go to: https://render.com/dashboard"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect repository: endyutomo/ayokerja"
echo ""

# Backend deployment instructions
echo -e "${BLUE}--- BACKEND SERVICE ---${NC}"
echo ""
echo "Service Configuration:"
echo "  Name: attendance-backend"
echo "  Region: Singapore"
echo "  Root Directory: backend"
echo "  Build Command: npm install"
echo "  Start Command: npm start"
echo ""
echo "Environment Variables (copy these):"
echo "----------------------------------------"
cat << 'EOF'
NODE_ENV=production
JWT_SECRET=b81a4b6e267e06637dd0dc992d1a04b59bfea112b1d5d60618603d371de27636
JWT_EXPIRE=7d
SUPABASE_URL=https://ezeyjzukfutkhlbajcbw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDE4MjcsImV4cCI6MjA5MDI3NzgyN30.nbYVUBbje2A8cZhghp9ohhueOsTJ94pJuFYhx9Cb4p8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwMTgyNywiZXhwIjoyMDkwMjc3ODI3fQ.MPcN_u6PnfsmzfxFxvu00TAckIPJzfk7z8kEw3Ayh8g
DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_DIRECT_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ezeyjzukfutkhlbajcbw
DB_PASSWORD=EceG8iQBdI5dDTU5
DEVICE_SERVER_PORT=4370
SOCKET_CORS_ORIGIN=*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
APP_NAME=Cloud Attendance System
COMPANY_NAME=Your Company
EOF
echo "----------------------------------------"
echo ""

read -p "Press Enter after you've deployed the backend..."

# Get backend URL
echo -e "${BLUE}Enter your deployed backend URL:${NC}"
read -e BACKEND_URL
echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
echo ""

# Device Server deployment instructions
echo -e "${BLUE}--- DEVICE SERVER SERVICE ---${NC}"
echo ""
echo "Service Configuration:"
echo "  Name: attendance-device-server"
echo "  Region: Singapore"
echo "  Root Directory: device-server"
echo "  Build Command: npm install"
echo "  Start Command: npm start"
echo ""
echo "Environment Variables (copy these):"
echo "----------------------------------------"
cat << EOF
NODE_ENV=production
PORT=4370
BACKEND_URL=$BACKEND_URL
DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
EOF
echo "----------------------------------------"
echo ""

read -p "Press Enter after you've deployed the device server..."

echo -e "${BLUE}Enter your deployed device server URL:${NC}"
read -e DEVICE_SERVER_URL
echo -e "${GREEN}✓ Device Server URL: $DEVICE_SERVER_URL${NC}"
echo ""

# ============================================
# VERCEL DEPLOYMENT
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🎨 DEPLOYING TO VERCEL${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Login to Vercel
echo -e "${BLUE}Logging in to Vercel...${NC}"
vercel login

cd frontend

# Deploy to Vercel
echo -e "${BLUE}Deploying frontend to Vercel...${NC}"
vercel --prod

# Set environment variables
echo -e "${BLUE}Setting environment variables...${NC}"
vercel env add REACT_APP_API_URL "$BACKEND_URL" production
vercel env add REACT_APP_DEVICE_SERVER_URL "$DEVICE_SERVER_URL" production

# Pull environment variables
vercel env pull

cd ..

echo -e "${GREEN}✓ Frontend deployed!${NC}"
echo ""

# ============================================
# UPDATE BACKEND CORS
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔄 UPDATING BACKEND CORS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}IMPORTANT: Update backend environment variables in Render Dashboard:${NC}"
echo ""
echo "Go to: https://render.com/dashboard → attendance-backend → Environment"
echo ""
echo "Add/Update these variables:"
echo "----------------------------------------"
echo "SOCKET_CORS_ORIGIN=$FRONTEND_URL"
echo "FRONTEND_URL=$FRONTEND_URL"
echo "----------------------------------------"
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Your Application URLs:${NC}"
echo "  Frontend:       $FRONTEND_URL"
echo "  Backend API:    $BACKEND_URL"
echo "  Device Server:  $DEVICE_SERVER_URL"
echo ""
echo -e "${YELLOW}Default Login Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update backend CORS variables in Render Dashboard"
echo "2. Test the application at: $FRONTEND_URL"
echo "3. Configure custom domains (optional)"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  - Render Dashboard: https://render.com/dashboard"
echo "  - Vercel Dashboard: https://vercel.com/dashboard"
echo ""
