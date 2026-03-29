# 🚀 Deploy Backend ke Railway - Panduan Lengkap

## Langkah 1: Login ke Railway

1. Buka: **https://railway.app/**
2. Klik **"Login"** atau **"Get Started"**
3. Login dengan **GitHub** (recommended) atau email

---

## Langkah 2: Buat Project Baru

1. Klik tombol **"New Project"** (atau **"+ New"** → **"New Project"**)
2. Pilih **"Deploy from GitHub repo"**
3. Klik **"Configure GitHub App"** jika diminta
4. Pilih repository: **`endyutomo/ayokerja`**
5. Klik **"Install"**

---

## Langkah 3: Deploy Backend Service

### 3.1 Tambah Service

1. Klik **"New"** (di project yang baru dibuat)
2. Pilih **"Empty Service"**
3. Service akan terbuat dengan nama default

### 3.2 Configure Service

Klik service yang baru dibuat, lalu di tab **"Settings"**:

| Setting | Value |
|---------|-------|
| **Name** | `backend` (atau `attendance-api`) |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### 3.3 Add Environment Variables

Klik tab **"Variables"**, tambahkan satu per satu:

```
NODE_ENV=production
```

```
JWT_SECRET=b81a4b6e267e06637dd0dc992d1a04b59bfea112b1d5d60618603d371de27636
```

```
JWT_EXPIRE=7d
```

```
SUPABASE_URL=https://ezeyjzukfutkhlbajcbw.supabase.co
```

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDE4MjcsImV4cCI6MjA5MDI3NzgyN30.nbYVUBbje2A8cZhghp9ohhueOsTJ94pJuFYhx9Cb4p8
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZXlqenVrZnV0a2hsYmFqY2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcwMTgyNywiZXhwIjoyMDkwMjc3ODI3fQ.MPcN_u6PnfsmzfxFxvu00TAckIPJzfk7z8kEw3Ayh8g
```

```
DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

```
DATABASE_DIRECT_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:EceG8iQBdI5dDTU5@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

```
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
```

```
DB_PORT=6543
```

```
DB_NAME=postgres
```

```
DB_USER=postgres.ezeyjzukfutkhlbajcbw
```

```
DB_PASSWORD=EceG8iQBdI5dDTU5
```

```
DEVICE_SERVER_PORT=4370
```

```
SOCKET_CORS_ORIGIN=*
```

```
SMTP_HOST=smtp.gmail.com
```

```
SMTP_PORT=587
```

```
SMTP_USER=your-email@gmail.com
```

```
SMTP_PASS=your-app-password
```

```
APP_NAME=Cloud Attendance System
```

```
COMPANY_NAME=Your Company
```

### 3.4 Deploy

1. Railway akan **auto-deploy** setelah variables ditambahkan
2. Klik tab **"Deployments"** untuk melihat progress
3. Tunggu sampai status jadi **"Running"** (biasanya 1-2 menit)

---

## Langkah 4: Dapatkan URL Backend

1. Setelah deploy berhasil, klik tab **"Settings"**
2. Scroll ke bagian **"Domains"**
3. Copy URL yang tertera, contoh:
   ```
   https://backend-production-xxxx.up.railway.app
   ```
4. **Simpan URL ini** untuk digunakan di frontend!

---

## Langkah 5: Test Backend API

Buka browser dan test endpoint berikut:

**Health Check:**
```
https://your-backend-url.up.railway.app/api/health
```

**Test Login:**
```
POST https://your-backend-url.up.railway.app/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Jika berhasil, Anda akan dapat response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## Langkah 6: Setup Public Domain (Optional)

Railway memberikan domain gratis, tapi jika ingin custom domain:

1. Beli domain (contoh: `absensi-perusahaan.com`)
2. Di Railway, tab **"Settings"** → **"Domains"**
3. Klik **"Add Custom Domain"**
4. Masukkan domain Anda
5. Setup DNS records di provider domain:
   - Type: `CNAME`
   - Name: `api` (atau `@`)
   - Value: `your-railway-app.up.railway.app`

---

## Troubleshooting

### ❌ Error: Build Failed

**Penyebab:** Dependencies tidak terinstall dengan benar

**Solusi:**
```bash
# Di local
cd backend
npm install
git push
```

### ❌ Error: Cannot connect to database

**Penyebab:** Environment variables salah atau Supabase tidak accessible

**Solusi:**
1. Check semua `SUPABASE_*` variables benar
2. Test koneksi di Supabase Dashboard
3. Pastikan project Supabase aktif

### ❌ Error: Port not assigned

**Penyebab:** Railway tidak mendeteksi port

**Solusi:**
1. Pastikan `PORT=3001` ada di environment variables
2. Railway akan assign port otomatis, jangan hardcode port

### ❌ Error: CORS

**Penyebab:** Frontend URL belum diizinkan

**Solusi:**
Setelah frontend deploy, update:
```
SOCKET_CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app
```

---

## Next Steps

Setelah backend berhasil deploy:

1. ✅ **Catat URL backend** untuk step berikutnya
2. 📦 **Deploy Frontend** ke Vercel (lihat `DEPLOY_FRONTEND.md`)
3. 🔧 **Deploy Device Server** (lihat `DEPLOY_DEVICE_SERVER.md`)
4. 🧪 **Test Integration** antara semua service

---

## Monitoring

### Logs
- Tab **"Deployments"** → Klik deployment → **"View Logs"**
- Atau CLI: `railway logs`

### Metrics
- Tab **"Metrics"** untuk melihat CPU, Memory, Network usage

### Alerts
- Tab **"Settings"** → **"Notifications"** untuk setup alerts

---

## Biaya

Railway memberikan:
- **Free tier:** $5 credit/month (cukup untuk development)
- **Hobby:** $5/month + usage
- **Pro:** $20/month + usage

Monitor usage di tab **"Usage"** untuk menghindari overage charges.

---

**Selamat! Backend Anda sudah online! 🎉**

Lanjut ke deploy frontend di `DEPLOY_FRONTEND.md`
