-- OTP codes for password reset (server-only via service role)
-- Run in Supabase SQL Editor after schema.sql

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
-- No policies: only service role can read/write
