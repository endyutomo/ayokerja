# 🚀 Quick Deploy Guide - Attendance System

## Fastest Way to Deploy (Free)

This guide will help you deploy your attendance system in under 15 minutes using free tiers.

---

## 📋 What You'll Deploy

| Service | Platform | Purpose | Cost |
|---------|----------|---------|------|
| **Backend API** | Render | REST API, Auth, Database | Free |
| **Device Server** | Render | TCP/UDP device communication | Free |
| **Frontend** | Vercel | Web UI | Free |

---

## ⚡ Quick Start (5 Steps)

### Step 1: Deploy Backend to Render (5 min)

1. Go to https://render.com and login with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect repository: `endyutomo/ayokerja`
4. Configure:
   - **Name:** `attendance-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance:** Free
5. Add environment variables (click "Environment" tab):

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

6. Click **"Create Web Service"**
7. Wait for deployment, then copy the URL (e.g., `https://attendance-backend-xxxx.onrender.com`)

---

### Step 2: Deploy Device Server to Render (3 min)

1. Click **"New +"** → **"Web Service"**
2. Connect repository: `endyutomo/ayokerja`
3. Configure:
   - **Name:** `attendance-device-server`
   - **Root Directory:** `device-server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance:** Free
4. Add environment variables:

```
NODE_ENV=production
PORT=4370
BACKEND_URL=https://your-backend-url.onrender.com
DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

5. Click **"Create Web Service"**
6. Copy the URL

---

### Step 3: Deploy Frontend to Vercel (3 min)

1. Go to https://vercel.com and login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import repository: `endyutomo/ayokerja`
4. Configure:
   - **Framework Preset:** React
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Add environment variables:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_DEVICE_SERVER_URL=https://your-device-server-url.onrender.com
```

6. Click **"Deploy"**
7. Wait for deployment, your app will be at `https://your-project.vercel.app`

---

### Step 4: Update Backend CORS (1 min)

1. Go back to Render Dashboard → `attendance-backend`
2. Click **"Environment"** tab
3. Update these variables with your Vercel URL:

```
SOCKET_CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
```

4. Click **"Save Changes"** (service will auto-redeploy)

---

### Step 5: Test Your Application! 🎉

1. Open: `https://your-frontend-url.vercel.app`
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. You're in! 🚀

---

## 📝 Detailed Documentation

- **Backend (Render):** See `DEPLOY_BACKEND_RENDER.md`
- **Device Server (Render):** See `DEPLOY_DEVICE_SERVER_RENDER.md`
- **Frontend (Vercel):** See `DEPLOY_FRONTEND_VERCEL.md`

---

## 🛠️ Troubleshooting

### Backend won't start
- Check logs in Render Dashboard
- Verify all environment variables are set
- Test database connection in Supabase

### Frontend shows blank screen
- Check browser console for errors
- Verify `REACT_APP_API_URL` is correct
- Check network tab for failed API calls

### CORS errors
- Update `SOCKET_CORS_ORIGIN` in backend with frontend URL
- Redeploy backend after changing variables

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Render Backend** | Free (sleeps after 15min) | $7/month (always on) |
| **Render Device Server** | Free (sleeps after 15min) | $7/month (always on) |
| **Vercel Frontend** | Free (unlimited) | $20/month (pro) |
| **Supabase Database** | Free (500MB) | $25/month (pro) |
| **Total** | **$0/month** | **$39/month** |

---

## 🔐 Security Notes

- Change default admin password after first login
- Use strong JWT_SECRET in production
- Enable HTTPS for all services (automatic on Render/Vercel)
- Don't commit `.env` files to Git

---

**Need help?** Check the detailed guides or open an issue on GitHub.
