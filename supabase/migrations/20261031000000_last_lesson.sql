-- AC-6: the lesson a learner last opened, so they can carry on where they left off on any
-- device. The learner writes it with their own client; row-level security already limits
-- profiles to their own row.
alter table public.profiles
  add column last_stop_id text check (last_stop_id is null or char_length(last_stop_id) <= 80),
  add column last_stop_at timestamptz;

grant update (last_stop_id, last_stop_at) on public.profiles to authenticated;
