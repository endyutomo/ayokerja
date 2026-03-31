# ============================================
# DEPLOY FRONTEND TO VERCEL
# ============================================

## Prerequisites

- Backend deployed (Render/Railway)
- Device Server deployed (Render/Fly.io)
- Vercel account (free at https://vercel.com)

---

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Import Project

1. Go to https://vercel.com and login with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import repository: **`endyutomo/ayokerja`**
4. Click **"Import"**

### Step 2: Configure Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | `React` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

### Step 3: Add Environment Variables

Click **"Environment Variables"**, add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_DEVICE_SERVER_URL=https://your-device-server-url.onrender.com
```

Replace with your actual deployed URLs!

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

---

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

```bash
cd frontend

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 4: Set Environment Variables

```bash
# Production environment
vercel env add REACT_APP_API_URL production
# Enter: https://your-backend-url.onrender.com

vercel env add REACT_APP_DEVICE_SERVER_URL production
# Enter: https://your-device-server-url.onrender.com

# Pull environment variables
vercel env pull
```

---

## Update Backend CORS

After frontend is deployed, update the backend environment variables:

### In Render Dashboard:

1. Go to your backend service
2. Click **"Environment"** tab
3. Update these variables:

```
SOCKET_CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
```

4. Click **"Save Changes"**
5. Redeploy the service

---

## Test the Application

1. Open: `https://your-frontend-url.vercel.app`
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Test all features:
   - Dashboard
   - Employee management
   - Attendance records
   - Device management

---

## Custom Domain (Optional)

### In Vercel:

1. Go to project settings
2. Click **"Domains"**
3. Add your domain: `absensi-perusahaan.com`
4. Configure DNS:
   - Type: `A` or `CNAME`
   - Value: `cname.vercel-dns.com`

### In Render:

1. Go to service settings
2. Click **"Custom Domain"**
3. Add domain: `api.absensi-perusahaan.com`
4. Configure DNS at your domain provider

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are installed
- Run `npm run build` locally to test

### API Connection Errors
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Blank Screen
- Check browser console for errors
- Verify all environment variables are set
- Check network tab for failed requests

---

## Monitoring

### Vercel Dashboard
- **Analytics:** View page views and performance
- **Logs:** Check deployment logs
- **Speed Insights:** Monitor Core Web Vitals

### Render Dashboard
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Network usage
- **Events:** Deployment history

---

## Cost Estimate

| Service | Plan | Cost/Month |
|---------|------|------------|
| **Vercel Frontend** | Hobby (Free) | $0 |
| **Render Backend** | Free | $0 (sleeps after 15min) |
| **Render Backend** | Starter | $7 (always on) |
| **Render Device Server** | Free | $0 |
| **Render Device Server** | Starter | $7 (always on) |
| **Total (Free)** | | $0 |
| **Total (Production)** | | $14/month |

---

**🎉 Congratulations! Your application is now live!**
