-- PREP-7 (2026-11-26, owner decision): a daily reminder email for the interview prep plan, at 7:30 am
-- India time. Opt-in only. The learner reads whether theirs is on; every write goes through the server
-- (service role) after it checks the session. The unsubscribe token lets one click in an email stop the
-- emails without signing in. Deleted with the account.
create table public.prep_reminders (
  user_id uuid primary key references auth.users on delete cascade,
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_text text not null,
  consent_at timestamptz not null default now(),
  last_sent_on date,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique
);

alter table public.prep_reminders enable row level security;
revoke all on public.prep_reminders from public, anon, authenticated;
create policy "read own prep reminder" on public.prep_reminders for select to authenticated using (user_id = auth.uid());
grant select (user_id, last_sent_on, unsubscribed_at) on public.prep_reminders to authenticated;
