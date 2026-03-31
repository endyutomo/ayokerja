# ============================================
# DEPLOY BACKEND TO RENDER
# ============================================

## Option 1: Deploy via Render Dashboard (Recommended)

### Step 1: Create Web Service

1. Go to https://render.com and login with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your repository: **`endyutomo/ayokerja`**
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `attendance-backend` |
| **Region** | Singapore (closest to Indonesia) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or `Starter` for production) |

### Step 2: Add Environment Variables

Click **"Environment"** tab, add these variables:

```
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
```

### Step 3: Deploy

1. Click **"Create Web Service"**
2. Wait for build and deployment (2-5 minutes)
3. Copy the service URL (e.g., `https://attendance-backend-xxxx.onrender.com`)

---

## Option 2: Deploy via Render CLI

```bash
# Install Render CLI (macOS)
brew install render-oss/cli/render

# Or via npm
npm install -g @render-cloud/cli

# Login
render login

# Create service
cd backend
render service create --name attendance-backend --root-dir backend --build-command "npm install" --start-command "npm start"

# Add environment variables
render service env-vars set attendance-backend NODE_ENV=production
render service env-vars set attendance-backend JWT_SECRET=b81a4b6e267e06637dd0dc992d1a04b59bfea112b1d5d60618603d371de27636
# ... (add all variables above)

# Deploy
render service deploy attendance-backend
```

---

## Test Backend

After deployment, test the API:

```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Test login
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Troubleshooting

### Build Fails
- Check logs in Render Dashboard
- Ensure all dependencies are in package.json
- Run `npm install` locally to verify

### Service Goes to Sleep (Free Tier)
- Free services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to Starter plan ($7/month) to prevent sleep

### Database Connection Errors
- Verify all DATABASE_* variables are correct
- Test Supabase connection in Supabase Dashboard
- Check if connection pooler is accessible

---

## Next Steps

After backend is deployed:
1. ✅ Copy the backend URL
2. 📦 Deploy Device Server (see DEPLOY_DEVICE_SERVER_RENDER.md)
3. 🎨 Deploy Frontend to Vercel
4. 🔗 Update environment variables with actual URLs
