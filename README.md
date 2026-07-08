# Simulasi PBJP Level-1 — Vercel Static + Supabase

Versi ini **tidak memakai Next.js**. Project dibuat sebagai HTML/CSS/JavaScript biasa supaya deploy di Vercel lebih ringan dan cepat.

## Fitur

- User wajib membuat/mengisi username sebelum mengerjakan soal.
- Paket A, B, dan C masing-masing 100 soal.
- Hasil pengerjaan tersimpan ke Supabase.
- Panel admin memakai PIN saja di `/admin/`.
- Admin bisa melihat history, detail jawaban, status lulus/tidak, dan export CSV.
- Endpoint `/api/ping` + Vercel Cron untuk membantu menjaga Supabase tetap aktif.

## Struktur file

```text
pbj-level1-vercel-static/
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ styles.css
│  ├─ data/
│  │  └─ bankSoal.json
│  └─ admin/
│     ├─ index.html
│     └─ admin.js
├─ api/
│  ├─ users.js
│  ├─ attempts.js
│  ├─ ping.js
│  ├─ admin/
│  │  └─ attempts.js
│  └─ _lib/
│     └─ supabase.js
├─ supabase-schema.sql
├─ vercel.json
├─ package.json
└─ .env.example
```

## 1. Siapkan Supabase

1. Buka Supabase.
2. Buat project baru.
3. Masuk ke **SQL Editor**.
4. Copy semua isi file `supabase-schema.sql`.
5. Klik **Run**.

Tidak perlu import bank soal ke Supabase. Bank soal sudah ada di:

```text
public/data/bankSoal.json
```

Supabase hanya menyimpan username dan riwayat pengerjaan.

## 2. Ambil key Supabase

Di Supabase buka:

```text
Project Settings → API
```

Ambil:

```text
Project URL
service_role key
```

Catatan penting: `service_role key` jangan dibagikan ke orang lain.

## 3. Deploy ke Vercel

1. Extract ZIP project ini.
2. Upload folder ke GitHub.
3. Buka Vercel.
4. Klik **Add New Project**.
5. Pilih repository GitHub project ini.
6. Framework preset pilih **Other** kalau Vercel menanyakan framework.
7. Build Command boleh dikosongkan, atau isi:

```bash
npm run build
```

8. Output Directory kosongkan/default.
9. Tambahkan Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL = Project URL Supabase
SUPABASE_SERVICE_ROLE_KEY = service_role key Supabase
ADMIN_PIN = PIN admin yang Bapak mau
```

Contoh:

```text
ADMIN_PIN = 123456
```

10. Klik **Deploy**.

## 4. Akses aplikasi

Halaman peserta:

```text
https://nama-aplikasi.vercel.app
```

Halaman admin:

```text
https://nama-aplikasi.vercel.app/admin/
```

Cek ping Supabase:

```text
https://nama-aplikasi.vercel.app/api/ping
```

Jika berhasil, responsnya seperti:

```json
{
  "ok": true,
  "message": "Ping berhasil. Supabase aktif."
}
```

## 5. Cara coba di lokal untuk pemula

Cara paling mudah tetap deploy langsung ke Vercel. Kalau ingin coba lokal, install Vercel CLI:

```bash
npm install -g vercel
```

Masuk ke folder project, lalu install dependency:

```bash
npm install
```

Buat file `.env.local` dari `.env.example`, lalu isi key Supabase dan PIN admin.

Jalankan:

```bash
vercel dev
```

Buka:

```text
http://localhost:3000
```

Admin lokal:

```text
http://localhost:3000/admin/
```

## 6. Kenapa versi ini lebih cepat dari Next.js?

Karena halaman peserta dan admin hanya HTML/CSS/JavaScript biasa. Vercel tidak perlu melakukan build React/Next.js yang berat. Bagian server hanya API kecil di folder `api/` untuk menyimpan data ke Supabase dan membaca data admin.
