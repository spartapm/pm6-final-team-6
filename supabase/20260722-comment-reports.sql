-- Comment reports (댓글 신고)
create table if not exists public.comment_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id uuid not null references public.note_comments(id) on delete cascade,
  note_id uuid not null references public.skin_notes(id) on delete cascade,
  target_author_id uuid not null references auth.users(id) on delete cascade,
  comment_content text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

alter table public.comment_reports enable row level security;

drop policy if exists "comment_reports_own" on public.comment_reports;
create policy "comment_reports_own" on public.comment_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
