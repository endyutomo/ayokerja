# Deployment Secrets Template
# Copy this file to .github/secrets/README.md and fill in your actual values

# Railway Configuration
RAILWAY_TOKEN=your-railway-api-token
RAILWAY_DEVICE_SERVER_TOKEN=your-railway-device-server-token

# Vercel Configuration
VERCEL_TOKEN=your-vercel-api-token
VERCEL_ORG_ID=your-vercel-organization-id
VERCEL_PROJECT_ID=your-vercel-project-id

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Frontend Environment Variables
FRONTEND_API_URL=https://your-backend-url.railway.app
FRONTEND_DEVICE_SERVER_URL=wss://your-device-server-url.railway.app

# Production JWT Secret (IMPORTANT: Generate new one!)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-production-jwt-secret-min-32-characters

# Domain Configuration
PRODUCTION_DOMAIN=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
FRONTEND_URL=https://app.your-domain.com

# VPS Configuration (if using DigitalOcean)
VPS_HOST=your-vps-ip-address
VPS_USERNAME=root
VPS_SSH_KEY=your-ssh-private-key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
