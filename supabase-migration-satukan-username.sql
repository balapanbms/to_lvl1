-- Opsional: jalankan sekali jika sebelumnya sudah ada data username lama.
-- Tujuan: Peserta01, peserta01, dan peserta  01 disatukan menjadi username yang sama.

-- 1. Samakan username pada riwayat pengerjaan.
update public.quiz_attempts
set username = lower(trim(regexp_replace(username, '\\s+', ' ', 'g')))
where username is not null;

-- 2. Hapus duplikat pada tabel users berdasarkan username yang sudah dinormalisasi.
with normalized_users as (
  select
    id,
    lower(trim(regexp_replace(username, '\\s+', ' ', 'g'))) as username_norm,
    row_number() over (
      partition by lower(trim(regexp_replace(username, '\\s+', ' ', 'g')))
      order by created_at asc, id asc
    ) as rn
  from public.users
)
delete from public.users u
using normalized_users n
where u.id = n.id
  and n.rn > 1;

-- 3. Ubah username tersisa menjadi format normal/lowercase.
update public.users
set username = lower(trim(regexp_replace(username, '\\s+', ' ', 'g')))
where username is not null;
