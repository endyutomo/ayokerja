#!/bin/bash

# ============================================
# DEPLOY TO RAILWAY - AUTOMATED SCRIPT
# ============================================

set -e

echo "🚀 Starting Railway Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in
echo -e "${BLUE}Checking Railway login...${NC}"
if ! railway whoami > /dev/null 2>&1; then
    echo -e "${RED}Not logged in. Please run: railway login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Logged in as $(railway whoami)${NC}"
echo ""

# ============================================
# DEPLOY BACKEND
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📦 DEPLOYING BACKEND${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd backend

# Check if project exists
if [ ! -f ".railway" ]; then
    echo -e "${YELLOW}Initializing new Railway project for backend...${NC}"
    echo "Select your workspace and create a new project when prompted."
    railway init
fi

# Set root directory
echo -e "${BLUE}Setting root directory to 'backend'...${NC}"
railway add --root .

# Add environment variables
echo -e "${BLUE}Setting environment variables...${NC}"

railway variables set NODE_ENV=production
railway variables set JWT_SECRET=b81a4b6e267e06637dd0dc992d1a04b59bfea112b1d5d60618603d371de27636
railway variables set JWT_EXPIRE=7d
railway variables set SUPABASE_URL=https://ezeyjzukfutkhlbajcbw.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDE4MjcsImV4cCI6MjA5MDI3NzgyN30.nbYVUBbje2A8cZhghp9ohhueOsTJ94pJuFYhx9Cb4p8
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwMTgyNywiZXhwIjoyMDkwMjc3ODI3fQ.MPcN_u6PnfsmzfxFxvu00TAckIPJzfk7z8kEw3Ayh8g
railway variables set DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
railway variables set DATABASE_DIRECT_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
railway variables set DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
railway variables set DB_PORT=6543
railway variables set DB_NAME=postgres
railway variables set DB_USER=postgres.ezeyjzukfutkhlbajcbw
railway variables set DB_PASSWORD=EceG8iQBdI5dDTU5
railway variables set DEVICE_SERVER_PORT=4370
railway variables set SOCKET_CORS_ORIGIN=\*
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set APP_NAME="Cloud Attendance System"
railway variables set COMPANY_NAME="Your Company"

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Deploy
echo -e "${BLUE}Deploying backend...${NC}"
railway up --detach

echo -e "${GREEN}✓ Backend deployed!${NC}"
echo ""

# Get the backend URL
echo -e "${BLUE}Getting backend URL...${NC}"
BACKEND_URL=$(railway domain | grep -o 'https://[^"]*' | head -1)
echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
echo ""

cd ..

# ============================================
# DEPLOY DEVICE SERVER
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📦 DEPLOYING DEVICE SERVER${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

cd device-server

# Check if project exists
if [ ! -f ".railway" ]; then
    echo -e "${YELLOW}Linking device-server to Railway project...${NC}"
    railway link
fi

# Add environment variables
echo -e "${BLUE}Setting environment variables for device server...${NC}"

railway variables set NODE_ENV=production
railway variables set PORT=4370
railway variables set BACKEND_URL="$BACKEND_URL"
railway variables set DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

echo -e "${GREEN}✓ Device server environment variables set${NC}"
echo ""

# Deploy
echo -e "${BLUE}Deploying device server...${NC}"
railway up --detach

echo -e "${GREEN}✓ Device server deployed!${NC}"
echo ""

cd ..

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the backend API: $BACKEND_URL/api/health"
echo "2. Deploy frontend to Vercel (see DEPLOY_FRONTEND.md)"
echo "3. Update SOCKET_CORS_ORIGIN and FRONTEND_URL after frontend deployment"
echo ""
echo -e "${YELLOW}Monitor deployments:${NC}"
echo "- Railway Dashboard: https://railway.app"
echo "- CLI: railway logs"
echo ""
