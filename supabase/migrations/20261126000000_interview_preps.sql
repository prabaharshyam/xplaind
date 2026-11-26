-- PREP-3 (2026-11-26, owner request): the learner's interview prep plan, so it follows them to another
-- device. One plan per learner, holding only what they chose: the date, the role, their experience, the
-- minutes a day and the day they started. The questions and progress are worked out from these and from
-- practice_ratings. A learner reads and writes only their own row. Deleted with the account.
create table public.interview_preps (
  user_id uuid primary key references auth.users on delete cascade,
  path_id text not null check (path_id ~ '^[a-z0-9-]{1,64}$'),
  experience text not null check (experience in ('fresher', 'junior', 'mid', 'senior')),
  interview_on date not null,
  minutes smallint not null check (minutes in (30, 60, 90)),
  started_on date not null,
  updated_at timestamptz not null default now()
);

alter table public.interview_preps enable row level security;
revoke all on public.interview_preps from public, anon, authenticated;
create policy "own interview prep" on public.interview_preps for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.interview_preps to authenticated;
