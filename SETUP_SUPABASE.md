# Setup Default Login dengan Supabase

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

## Cara Setup Database di Supabase

### Langkah 1: Buka SQL Editor Supabase

1. Buka link: https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/sql/new
2. Copy semua isi file `backend/supabase-setup.sql`
3. Paste ke SQL Editor
4. Klik **Run** untuk menjalankan script

### Langkah 2: Verifikasi Tabel

Setelah script berhasil dijalankan:

1. Buka https://supabase.com/dashboard/project/ezeyjzukfutkhlbajcbw/editor
2. Anda akan melihat tabel-tabel berikut:
   - companies
   - departments
   - shifts
   - employees
   - users (berisi user admin)
   - devices
   - attendance_records
   - attendance_logs
   - leave_types
   - leave_requests
   - overtime_requests
   - employee_schedules
   - holidays
   - notifications
   - activity_logs

### Langkah 3: Verifikasi User Admin

1. Buka Table Editor untuk tabel `users`
2. Anda akan melihat user dengan:
   - username: `admin`
   - email: `admin@company.com`
   - role: `admin`

### Langkah 4: Jalankan Backend

```bash
cd backend
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### Langkah 5: Jalankan Frontend

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### Langkah 6: Login

1. Buka browser: `http://localhost:3000`
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`

## Konfigurasi Database

File `.env` sudah dikonfigurasi untuk Supabase:

```env
SUPABASE_URL=https://ezeyjzukfutkhlbajcbw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

DATABASE_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:***@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_DIRECT_URL=postgresql://postgres.ezeyjzukfutkhlbajcbw:***@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## Troubleshooting

### Error: "Tenant or user not found"

Ini berarti koneksi database gagal. Pastikan:
1. Password database benar
2. Project Supabase aktif
3. Connection string benar

### User admin tidak bisa login

Jika user admin sudah ada tapi tidak bisa login:

1. Buka SQL Editor di Supabase
2. Jalankan query ini untuk reset password:

```sql
UPDATE users 
SET password_hash = '$2a$10$Ie1Dvdrp4MYqPyJ74MeRMOEPTE6ffJoZPRHO3z5W664h3vW.TTHzC'
WHERE username = 'admin';
```

### Tabel tidak muncul

Jalankan ulang script SQL di `backend/supabase-setup.sql` melalui SQL Editor.

## Keamanan

⚠️ **PENTING:** Setelah login pertama kali, segera ubah password default untuk keamanan!

## Script Tambahan

### Reset Password Admin via SQL

```sql
UPDATE users 
SET password_hash = '$2a$10$Ie1Dvdrp4MYqPyJ74MeRMOEPTE6ffJoZPRHO3z5W664h3vW.TTHzC'
WHERE username = 'admin';
```

### Cek User Admin

```sql
SELECT id, username, email, role, is_active, created_at 
FROM users 
WHERE username = 'admin';
```

### Hapus User Admin (untuk reset)

```sql
DELETE FROM users WHERE username = 'admin';
```

Kemudian jalankan ulang bagian INSERT dari script `supabase-setup.sql`.
