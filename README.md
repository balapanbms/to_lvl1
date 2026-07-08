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


## Update akun lintas perangkat

Versi ini menyamakan akun berdasarkan username yang sama. Username otomatis dinormalisasi menjadi huruf kecil, misalnya `Peserta01` dan `peserta01` dianggap akun yang sama.

Riwayat nilai peserta sekarang diambil dari Supabase lewat endpoint:

```text
/api/history?username=peserta01
```

Jadi jika peserta membuka aplikasi di laptop dan HP dengan username yang sama, riwayat nilai yang sudah tersimpan di Supabase akan terlihat sama.

Catatan: draft pengerjaan yang belum diselesaikan masih tersimpan di browser masing-masing perangkat. Yang disatukan lintas perangkat adalah akun dan riwayat hasil selesai mengerjakan.


### Jika sebelumnya sudah ada username lama

Kalau sebelumnya Bapak sudah pernah tes dengan username di HP/laptop dan terlihat terpisah, jalankan file ini sekali di Supabase SQL Editor:

```text
supabase-migration-satukan-username.sql
```

Setelah itu, username akan disamakan menjadi huruf kecil. Contoh `Peserta01`, `peserta01`, dan `PESERTA01` dianggap akun yang sama.

## Revisi mobile dan dashboard

Versi ini sudah diperbaiki:

- Tampilan HP dibuat lebih nyaman: ukuran teks soal diperkecil, jarak tombol dirapikan, kartu lebih ringan, dan navigasi nomor soal lebih padat.
- Tombol/link admin tetap tidak ditampilkan di dashboard. Admin hanya lewat `/admin/`.
- Riwayat nilai peserta tampil langsung di halaman awal, di atas pilihan paket soal.
- Tombol browser/HP **Kembali** dari halaman soal, mode belajar, quiz, hasil, atau riwayat akan membawa pengguna kembali ke halaman awal aplikasi.
- Paket try out yang ditampilkan di dashboard dibatasi ke **Paket A, Paket B, dan Paket C**.
