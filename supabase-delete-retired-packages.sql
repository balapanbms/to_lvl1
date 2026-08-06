-- Jalankan sekali di Supabase SQL Editor untuk menghapus seluruh riwayat
-- Paket D, Paket E, dan Quiz yang sudah tidak digunakan.
-- Detail pada quiz_answers ikut terhapus karena foreign key ON DELETE CASCADE.

begin;

with deleted_attempts as (
  delete from public.quiz_attempts
  where paket in (
    'Paket D - Try Out 16',
    'Paket E - Bank Soal Merged',
    'Quiz - Coaching Privat',
    'Quiz - Modul Materi'
  )
  returning id
)
select count(*) as deleted_attempt_count
from deleted_attempts;

commit;

-- Verifikasi: hasilnya harus 0.
select count(*) as remaining_retired_attempts
from public.quiz_attempts
where paket in (
  'Paket D - Try Out 16',
  'Paket E - Bank Soal Merged',
  'Quiz - Coaching Privat',
  'Quiz - Modul Materi'
);
