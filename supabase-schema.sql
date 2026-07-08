-- Jalankan file ini di Supabase SQL Editor.
-- Struktur ini untuk aplikasi Simulasi PBJP Level-1 + panel admin PIN.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  paket text not null,
  score integer not null default 0,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  empty_count integer not null default 0,
  doubtful_count integer not null default 0,
  is_passed boolean not null default false,
  started_at timestamptz,
  finished_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id text,
  question_number integer,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  selected_answer text,
  correct_answer text,
  is_correct boolean not null default false,
  is_doubtful boolean not null default false,
  materi text,
  tag text,
  pembahasan text,
  referensi text,
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_username on public.quiz_attempts(username);
create index if not exists idx_quiz_attempts_finished_at on public.quiz_attempts(finished_at desc);
create index if not exists idx_quiz_answers_attempt_id on public.quiz_answers(attempt_id);

-- Karena aplikasi menulis lewat Vercel Serverless API memakai Service Role Key,
-- tabel boleh tetap aman dari akses publik langsung.
alter table public.users enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
