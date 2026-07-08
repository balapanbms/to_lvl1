# Simulasi PBJP Level-1 - Vercel Static + Supabase + Tampilan Original

Versi ini memakai tampilan `index.html` original dari paket komposisi A-C, tetapi sudah ditambah:

- wajib input username sebelum mulai;
- simpan username ke Supabase;
- simpan hasil pengerjaan dan detail jawaban ke Supabase;
- panel admin berbasis PIN di `/admin/`;
- endpoint ping Supabase di `/api/ping`;
- cron Vercel harian di `vercel.json`.

Bank soal tetap berada di dalam `public/index.html` seperti versi original, sehingga tidak perlu import bank soal ke Supabase.

## 1. Setup Supabase

Buka Supabase > SQL Editor, lalu jalankan isi file:

```sql
supabase-schema.sql
```

Jika masih muncul error RLS saat input username, pastikan `SUPABASE_SERVICE_ROLE_KEY` di Vercel memakai **service_role key**, bukan anon key. Setelah mengganti environment variable, lakukan Redeploy.

Untuk trial cepat, boleh jalankan:

```sql
alter table public.users disable row level security;
alter table public.quiz_attempts disable row level security;
alter table public.quiz_answers disable row level security;
```

## 2. Environment Variables di Vercel

Isi:

```text
NEXT_PUBLIC_SUPABASE_URL = URL Project Supabase
SUPABASE_SERVICE_ROLE_KEY = service_role key Supabase
ADMIN_PIN = PIN admin yang diinginkan
```

## 3. Deploy ke Vercel

- Upload semua isi folder ini ke GitHub.
- Di Vercel pilih **Add New Project**.
- Framework Preset: **Other**.
- Build Command boleh dikosongkan atau pakai `npm run build`.
- Output Directory kosong/default.
- Tambahkan Environment Variables.
- Klik Deploy.

## 4. Akses

Peserta:

```text
https://nama-aplikasi.vercel.app/
```

Admin:

```text
https://nama-aplikasi.vercel.app/admin/
```

Ping Supabase:

```text
https://nama-aplikasi.vercel.app/api/ping
```
