-- ANA (team-final-6) Supabase schema
-- Project: ppxjklwepownrdyboaaj
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null unique,
  age_group text not null,
  gender text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Skin profiles
create table if not exists public.skin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  skin_type text not null,
  concerns text[] not null default '{}',
  sensitivity text not null,
  updated_at timestamptz not null default now()
);

-- Routines
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  concern_label text not null,
  steps jsonb not null default '[]',
  source text not null check (source in ('manual', 'recommend')),
  status text not null check (status in ('active', 'ended')) default 'active',
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines(user_id);
create index if not exists routines_status_idx on public.routines(status);

-- Daily care logs
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  log_date date not null,
  completed_step_ids text[] not null default '{}',
  saved_at timestamptz not null default now(),
  unique (user_id, routine_id, log_date)
);

-- Weekly change records
create table if not exists public.weekly_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  week_key date not null,
  photo_url text,
  feeling text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, routine_id, week_key)
);

-- Skin notes (experience cards)
create table if not exists public.skin_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_nickname text not null,
  author_avatar text,
  skin_type text not null,
  concerns text[] not null default '{}',
  sensitivity text not null,
  age_group text not null,
  title text not null,
  tags text[] not null default '{}',
  products jsonb not null default '[]',
  duration_days int not null default 1,
  difficulty text not null,
  felt_change int not null default 0,
  end_reason text not null,
  change_timeline jsonb not null default '[]',
  visibility text not null check (visibility in ('private', 'public')) default 'private',
  is_abandoned boolean not null default false,
  save_count int not null default 0,
  help_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists skin_notes_visibility_idx on public.skin_notes(visibility);
create index if not exists skin_notes_author_idx on public.skin_notes(author_id);

-- Comments
create table if not exists public.note_comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_nickname text not null,
  author_avatar text,
  content text not null,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists note_comments_note_id_idx on public.note_comments(note_id);

-- User interactions
create table if not exists public.note_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.note_helps (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.comment_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.note_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table if not exists public.note_hides (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.note_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists public.comment_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.note_comments(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  target_author_id uuid not null references auth.users(id) on delete cascade,
  comment_content text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_routine_id uuid,
  banner_drawer boolean not null default false,
  banner_detail boolean not null default false,
  view_quota_date date,
  view_quota_count int not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.skin_profiles enable row level security;
alter table public.routines enable row level security;
alter table public.daily_logs enable row level security;
alter table public.weekly_changes enable row level security;
alter table public.skin_notes enable row level security;
alter table public.note_comments enable row level security;
alter table public.note_saves enable row level security;
alter table public.note_helps enable row level security;
alter table public.comment_likes enable row level security;
alter table public.note_hides enable row level security;
alter table public.note_reports enable row level security;
alter table public.comment_reports enable row level security;
alter table public.user_prefs enable row level security;

-- Profiles policies
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skin profiles
drop policy if exists "skin_profiles_own" on public.skin_profiles;
create policy "skin_profiles_own" on public.skin_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Routines
drop policy if exists "routines_own" on public.routines;
create policy "routines_own" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Daily logs
drop policy if exists "daily_logs_own" on public.daily_logs;
create policy "daily_logs_own" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Weekly changes
drop policy if exists "weekly_changes_own" on public.weekly_changes;
create policy "weekly_changes_own" on public.weekly_changes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skin notes
drop policy if exists "skin_notes_select" on public.skin_notes;
create policy "skin_notes_select" on public.skin_notes for select using (
  visibility = 'public' or author_id = auth.uid()
);
drop policy if exists "skin_notes_insert" on public.skin_notes;
create policy "skin_notes_insert" on public.skin_notes for insert with check (author_id = auth.uid());
drop policy if exists "skin_notes_update" on public.skin_notes;
create policy "skin_notes_update" on public.skin_notes for update using (author_id = auth.uid());
drop policy if exists "skin_notes_delete" on public.skin_notes;
create policy "skin_notes_delete" on public.skin_notes for delete using (author_id = auth.uid());

-- Comments
drop policy if exists "comments_select" on public.note_comments;
create policy "comments_select" on public.note_comments for select using (true);
drop policy if exists "comments_insert" on public.note_comments;
create policy "comments_insert" on public.note_comments for insert with check (author_id = auth.uid());
drop policy if exists "comments_delete" on public.note_comments;
create policy "comments_delete" on public.note_comments for delete using (author_id = auth.uid());
drop policy if exists "comments_update" on public.note_comments;
create policy "comments_update" on public.note_comments for update using (true);

-- Interactions (own rows)
drop policy if exists "note_saves_own" on public.note_saves;
create policy "note_saves_own" on public.note_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "note_helps_own" on public.note_helps;
create policy "note_helps_own" on public.note_helps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "comment_likes_own" on public.comment_likes;
create policy "comment_likes_own" on public.comment_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "note_hides_own" on public.note_hides;
create policy "note_hides_own" on public.note_hides for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "note_reports_own" on public.note_reports;
create policy "note_reports_own" on public.note_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "comment_reports_own" on public.comment_reports;
create policy "comment_reports_own" on public.comment_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_prefs_own" on public.user_prefs;
create policy "user_prefs_own" on public.user_prefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow authenticated users to bump public counters on notes they interact with
drop policy if exists "skin_notes_counter_update" on public.skin_notes;
create policy "skin_notes_counter_update" on public.skin_notes for update using (
  visibility = 'public' or author_id = auth.uid()
);

-- OTP codes for password reset (server-only via service role; no RLS policies)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified boolean not null default false,
  reset_token text,
  reset_token_expires_at timestamptz
);

create index if not exists otp_codes_email_created_idx
  on public.otp_codes (email, created_at desc);

create index if not exists otp_codes_reset_token_idx
  on public.otp_codes (reset_token)
  where reset_token is not null;

alter table public.otp_codes enable row level security;
