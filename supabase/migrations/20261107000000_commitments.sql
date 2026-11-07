-- CM-90: "Commit to 90 days". A learner opts in to one email a week for 13 weeks.
-- The learner can read their own row; every write goes through the server (service role),
-- which checks the session first. The unsubscribe token lets one click in an email stop
-- the emails without signing in. Deleted with the account.
create table public.commitments (
  user_id uuid primary key references auth.users on delete cascade,
  path_id text not null check (char_length(path_id) <= 60),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  started_on date not null default ((now() at time zone 'Asia/Kolkata')::date),
  consent_text text not null,
  consent_at timestamptz not null default now(),
  last_sent_week int not null default 0 check (last_sent_week between 0 and 13),
  last_sent_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique
);

create index commitments_active on public.commitments (started_on) where unsubscribed_at is null;

alter table public.commitments enable row level security;
revoke all on public.commitments from public, anon, authenticated;
create policy "read own commitment" on public.commitments for select to authenticated using (user_id = auth.uid());
grant select (user_id, path_id, started_on, last_sent_week, unsubscribed_at) on public.commitments to authenticated;
