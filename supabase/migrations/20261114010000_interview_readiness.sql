-- IR-1 (2026-11-14, owner decision): an interview readiness score per role. Each AI-reviewed mock
-- interview stores one score out of 100 (the average answer score). Readiness is the average of the
-- last three, with the change since the three before. Learners read their own rows; only the server writes.
create table public.interview_readiness (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  path_id text not null check (char_length(path_id) between 1 and 60),
  score int not null check (score between 0 and 100),
  answered int not null check (answered between 1 and 10),
  taken_at timestamptz not null default now()
);
create index interview_readiness_user_path on public.interview_readiness (user_id, path_id, taken_at desc);
alter table public.interview_readiness enable row level security;
revoke all on public.interview_readiness from public, anon, authenticated;
create policy "read own readiness" on public.interview_readiness for select to authenticated using (user_id = auth.uid());
grant select on public.interview_readiness to authenticated;
