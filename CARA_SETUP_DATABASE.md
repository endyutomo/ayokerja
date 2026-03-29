# 🚀 Cara Menjalankan Script SQL di Supabase

## Default Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## 📋 Langkah-langkah Setup Database

### 1. Buka Supabase SQL Editor

Klik link ini: **https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/sql/new**

### 2. Copy Script SQL

Buka file `backend/supabase-setup.sql` dan **COPY SEMUA ISI FILE** (Ctrl+A, Ctrl+C)

### 3. Paste dan Jalankan

1. **Paste** script SQL ke editor (Ctrl+V)
2. Klik tombol **"Run"** atau tekan **Ctrl+Enter**
3. Tunggu hingga semua statement selesai dijalankan

### 4. Verifikasi

Setelah berhasil, Anda akan melihat pesan "Success. No rows returned" untuk setiap statement.

Untuk memverifikasi:

1. Buka **Table Editor**: https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/editor
2. Anda akan melihat tabel-tabel berikut:
   - ✅ companies
   - ✅ departments
   - ✅ shifts
   - ✅ employees
   - ✅ users
   - ✅ devices
   - ✅ attendance_records
   - ✅ attendance_logs
   - ✅ leave_types
   - ✅ leave_requests
   - ✅ overtime_requests
   - ✅ employee_schedules
   - ✅ holidays
   - ✅ notifications
   - ✅ activity_logs

### 5. Cek User Admin

1. Klik tabel **users**
2. Anda akan melihat user dengan:
   - **username:** `admin`
   - **email:** `admin@company.com`
   - **role:** `admin`

---

## ▶️ Menjalankan Backend & Frontend

### Backend
```bash
cd backend
npm run dev
```
Backend akan berjalan di: **http://localhost:3001**

### Frontend
```bash
cd frontend
npm run dev
```
Frontend akan berjalan di: **http://localhost:3000**

---

## 🔐 Login

1. Buka browser: **http://localhost:3000**
2. Login dengan:
   - **Username:** `admin`
   - **Password:** `admin123`

---

## ⚠️ Troubleshooting

### Error: "relation already exists"
Ini artinya tabel sudah ada. Tidak masalah, lanjutkan.

### Error: "duplicate key value violates unique constraint"
Ini artinya data sudah ada. Tidak masalah.

### User admin tidak bisa login
Jalankan query ini di SQL Editor untuk reset password:

```sql
UPDATE users 
SET password_hash = '$2a$10$Ie1Dvdrp4MYqPyJ74MeRMOEPTE6ffJoZPRHO3z5W664h3vW.TTHzC'
WHERE username = 'admin';
```

### Hapus semua tabel (reset total)
Jika ingin mulai dari awal:

```sql
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS employee_schedules CASCADE;
DROP TABLE IF EXISTS overtime_requests CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
```

Kemudian jalankan ulang `supabase-setup.sql`.

---

## 📞 Bantuan

Jika ada masalah, buka:
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw
- **SQL Editor:** https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/editor
