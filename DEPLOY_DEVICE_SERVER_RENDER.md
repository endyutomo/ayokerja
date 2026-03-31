# ============================================
# DEPLOY DEVICE SERVER TO RENDER
# ============================================

## Option 1: Deploy via Render Dashboard (Recommended)

### Step 1: Create Web Service

1. Go to https://render.com and login with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your repository: **`endyutomo/ayokerja`**
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `attendance-device-server` |
| **Region** | Singapore (same as backend) |
| **Branch** | `main` |
| **Root Directory** | `device-server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or `Starter` for production) |

### Step 2: Add Environment Variables

Click **"Environment"** tab, add these variables:

```
NODE_ENV=production
PORT=4370
BACKEND_URL=https://your-backend-url.onrender.com
DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Step 3: Configure TCP/UDP Ports

For device communication, you need to expose ports:

1. Go to **"Settings"** tab
2. Scroll to **"Ports"**
3. Add ports:
   - **4370** (TCP) - Device communication
   - **4371** (UDP) - Device discovery

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for build and deployment (2-5 minutes)
3. Copy the service URL

---

## Option 2: Deploy via Render CLI

```bash
# Login to Render
render login

# Create service
cd device-server
render service create --name attendance-device-server --root-dir device-server --build-command "npm install" --start-command "npm start"

# Add environment variables
render service env-vars set attendance-device-server NODE_ENV=production
render service env-vars set attendance-device-server PORT=4370
render service env-vars set attendance-device-server BACKEND_URL=https://your-backend-url.onrender.com
render service env-vars set attendance-device-server DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Deploy
render service deploy attendance-device-server
```

---

## Alternative: Deploy to Fly.io (Better for TCP/UDP)

Fly.io is better suited for TCP/UDP server applications:

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Or via curl
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login and Deploy

```bash
# Login
fly auth login

# Create app
cd device-server
fly launch --name attendance-device-server --region sin --org personal

# Set environment variables
fly secrets set NODE_ENV=production
fly secrets set PORT=8000
fly secrets set BACKEND_URL=https://your-backend-url.onrender.com
fly secrets set DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Add ports for TCP/UDP
fly ports add 4370 --proto tcp
fly ports add 4371 --proto udp

# Deploy
fly deploy
```

---

## Test Device Server

After deployment:

```bash
# Check if service is running
curl https://your-device-server-url.onrender.com/health

# Check logs in Render Dashboard
```

---

## Troubleshooting

### Device Connection Issues
- Ensure ports 4370 (TCP) and 4371 (UDP) are exposed
- Check firewall settings
- Verify BACKEND_URL is correct

### Service Crashes
- Check logs in Render Dashboard
- Verify DATABASE_URL is accessible
- Ensure BACKEND_URL is reachable

---

## Next Steps

After device server is deployed:
1. ✅ Copy the device server URL
2. 🎨 Deploy Frontend to Vercel (see DEPLOY_FRONTEND_VERCEL.md)
3. 🔗 Update backend SOCKET_CORS_ORIGIN with frontend URL
4. 🧪 Test full integration
