-- Xplaind release 1 user data (PRD: Data model, User tables).
-- Every table has row-level security. Policy rule from the PRD: a row with a
-- user_id is visible and writable only by that user. Where a learner writing
-- directly could break a rule (a server re-score, a badge, a streak day), only
-- the server writes, using the service role, and learners can only read.
-- email_subscriptions, resource_clicks and rate_limits are server-only.

-- ------------------------------------------------------------------ tables --

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  goal_id text not null default 'genai-engineer',
  weekly_hours smallint check (weekly_hours between 1 and 40),
  adult_confirmed_at timestamptz not null,
  start_level text,
  created_at timestamptz not null default now()
);

create table public.quiz_attempts (            -- signed-in only; signed-out results stay in the browser
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  goal_id text not null, quiz_version text not null,
  answers jsonb not null,                      -- [{question_id, level, chosen, correct}]
  passed_level text, start_level text not null,
  gap_tags text[] not null default '{}',
  finished_at timestamptz not null default now()
);
create index quiz_attempts_user on public.quiz_attempts (user_id, finished_at desc);

create table public.stop_progress (
  user_id uuid not null references auth.users on delete cascade,
  stop_id text not null,
  status text not null check (status in ('in_progress','done')),
  done_how text check (done_how in ('check','project','self_skipped')),
  check_score smallint check (check_score between 0 and 100),
  project_url text check (project_url is null or project_url ~ '^https?://'),
  updated_at timestamptz not null default now(),
  primary key (user_id, stop_id),
  check (done_how is null or status = 'done')
);

create table public.activity_days (user_id uuid not null references auth.users on delete cascade, day date not null, primary key (user_id, day));
create table public.badges (user_id uuid not null references auth.users on delete cascade, badge_id text not null, earned_at timestamptz not null default now(), primary key (user_id, badge_id));
create table public.practice_ratings (user_id uuid not null references auth.users on delete cascade, question_id text not null, rating smallint not null check (rating in (0,1,2)), due_on date, updated_at timestamptz not null default now(), primary key (user_id, question_id));

create table public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique, user_id uuid references auth.users on delete set null,
  source text not null, consent_text text not null, consent_at timestamptz not null,
  confirmed_at timestamptz, unsubscribed_at timestamptz
);

create table public.level_cards (
  id uuid primary key default gen_random_uuid(),   -- the unguessable share link (AC-7)
  user_id uuid not null references auth.users on delete cascade,
  level text not null, goal_id text not null, weeks_active smallint not null,
  display_name text check (display_name is null or char_length(display_name) <= 40),
  created_at timestamptz not null default now()
);

create table public.resource_clicks (          -- no user id, no IP address
  id bigint generated always as identity primary key,
  resource_id text not null, stop_id text, level text, clicked_at timestamptz not null default now()
);

create table public.ai_usage (                 -- release 2: grader and tutor caps
  user_id uuid not null references auth.users on delete cascade,
  day date not null, kind text not null,
  calls int not null default 0, tokens_in int not null default 0, tokens_out int not null default 0,
  primary key (user_id, day, kind)
);

-- SC-3: fixed-window rate limits for /api/claim and /api/progress (and later /api/subscribe).
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

-- ------------------------------------------------------- row-level security --

alter table public.profiles enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.stop_progress enable row level security;
alter table public.activity_days enable row level security;
alter table public.badges enable row level security;
alter table public.practice_ratings enable row level security;
alter table public.email_subscriptions enable row level security;
alter table public.level_cards enable row level security;
alter table public.resource_clicks enable row level security;
alter table public.ai_usage enable row level security;
alter table public.rate_limits enable row level security;

-- Own rows, read only (the server writes them).
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "read own attempts" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
create policy "read own activity" on public.activity_days for select to authenticated using (user_id = auth.uid());
create policy "read own badges" on public.badges for select to authenticated using (user_id = auth.uid());
create policy "read own cards" on public.level_cards for select to authenticated using (user_id = auth.uid());
create policy "read own ai usage" on public.ai_usage for select to authenticated using (user_id = auth.uid());

-- Own rows, read and write (release 1 trusts self-reports, RM-7).
create policy "own progress" on public.stop_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own ratings" on public.practice_ratings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A learner may change their goal and weekly hours, and delete their own cards.
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "delete own cards" on public.level_cards for delete to authenticated using (user_id = auth.uid());

-- Column and table grants on top of the policies. Supabase grants every table
-- to anon and authenticated by default, so narrow them here.
revoke all on public.profiles, public.quiz_attempts, public.stop_progress, public.activity_days,
  public.badges, public.practice_ratings, public.email_subscriptions, public.level_cards,
  public.resource_clicks, public.ai_usage, public.rate_limits from anon, authenticated;

grant select on public.profiles, public.quiz_attempts, public.activity_days, public.badges,
  public.level_cards, public.ai_usage to authenticated;
grant update (goal_id, weekly_hours) on public.profiles to authenticated;
grant select, insert, update, delete on public.stop_progress, public.practice_ratings to authenticated;
grant delete on public.level_cards to authenticated;

-- ------------------------------------------------------------- rate limits --

-- Counts a hit and says whether it is within the limit. Server-only.
create function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
