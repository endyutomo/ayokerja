# Deployment Scripts

## Quick Deploy Commands

### 1. Deploy Backend to Railway

```bash
cd backend

# Login to Railway
railway login

# Initialize project (first time only)
railway init

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set FRONTEND_URL=https://your-domain.com
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-key

# View logs
railway logs
```

### 2. Deploy Frontend to Vercel

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables via CLI or Vercel Dashboard
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_DEVICE_SERVER_URL production
```

### 3. Deploy Device Server to VPS

```bash
# SSH to VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
cd /opt
git clone https://github.com/your-username/ayokerja.git
cd ayokerja/device-server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=4370
BACKEND_URL=https://your-backend-url.com
EOF

# Start with PM2
pm2 start src/index.js --name device-server

# Setup PM2 to start on boot
pm2 startup
pm2 save

# Configure firewall
ufw allow 4370/tcp
ufw allow 4371/udp
ufw enable

# View logs
pm2 logs device-server
```

### 4. Docker Deploy (All-in-One)

```bash
# Copy environment template
cp .env.docker .env

# Edit .env with your values
nano .env

# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart
```

### 5. Database Setup

```bash
# Run migrations
cd backend
npm run migrate

# Seed initial data
npm run seed

# Or using Supabase Dashboard
# 1. Go to SQL Editor
# 2. Run backend/supabase-setup.sql
```

### 6. SSL Certificate (Optional - for VPS)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal is setup automatically
# Test renewal
certbot renew --dry-run
```

## Monitoring Commands

### Railway
```bash
# View logs
railway logs

# View metrics
railway metrics

# Open dashboard
railway open
```

### Vercel
```bash
# View deployment logs
vercel logs

# List deployments
vercel ls

# Open dashboard
vercel open
```

### VPS (PM2)
```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# List processes
pm2 list

# Restart process
pm2 restart device-server

# View status
pm2 status
```

### Docker
```bash
# View logs
docker-compose logs -f

# View running containers
docker-compose ps

# View resource usage
docker stats

# Restart services
docker-compose restart
```

## Backup Commands

### Database Backup (Supabase)
```bash
# Via Supabase Dashboard
# 1. Go to Settings > Database
# 2. Click "Backup"
# 3. Download backup file

# Or via pg_dump (if you have direct connection)
pg_dump "postgresql://postgres:password@host:port/database" > backup.sql
```

### Application Backup
```bash
# Backup environment variables
railway variables list > railway-env-backup.txt
vercel env ls > vercel-env-backup.txt

# Backup code
git push origin main
```

## Rollback Commands

### Railway
```bash
# View deployments
railway deployments

# Rollback to previous
railway rollback <deployment-id>
```

### Vercel
```bash
# List deployments
vercel ls

# Rollback
vercel rollback <deployment-id>
```

### VPS
```bash
# Rollback code
cd /opt/ayokerja
git checkout <previous-commit>
pm2 restart device-server
```
