-- PR-1 (2026-11-14, owner decision): AI project review against the guided project's rubric. Each review
-- keeps its score and whether it passed (70 or more), so a certificate can later check it (CT-1).
-- The write-up and the README are not stored. Learners read their own rows; only the server writes.
create table public.project_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  project_id text not null check (project_id ~ '^[a-z0-9-]{2,80}$'),
  score int not null check (score between 0 and 100),
  passed boolean not null,
  repo_url text check (repo_url is null or (char_length(repo_url) <= 300 and repo_url ~ '^https://')),
  reviewed_at timestamptz not null default now()
);
create index project_reviews_user on public.project_reviews (user_id, project_id, reviewed_at desc);
alter table public.project_reviews enable row level security;
revoke all on public.project_reviews from public, anon, authenticated;
create policy "read own project reviews" on public.project_reviews for select to authenticated using (user_id = auth.uid());
grant select on public.project_reviews to authenticated;
