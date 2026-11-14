-- PF-1 and CT-1 (2026-11-14, owner decisions).
-- PF-1: a public learner profile, free and off until the learner turns it on, at /u/<handle>.
-- CT-1: a verified certificate for a role (Pro), at /certificate/<id>, issued only by the server after
-- it checks the lessons and a passed project review.

create table public.public_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'),
  display_name text not null check (char_length(display_name) between 2 and 60),
  headline text not null default '' check (char_length(headline) <= 120),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.public_profiles enable row level security;
revoke all on public.public_profiles from public, anon, authenticated;
create policy "read own profile" on public.public_profiles for select to authenticated using (user_id = auth.uid());
grant select on public.public_profiles to authenticated;

create table public.certificates (
  id text primary key check (id ~ '^[a-z0-9]{10}$'),
  user_id uuid not null references auth.users on delete cascade,
  path_id text not null check (char_length(path_id) between 1 and 60),
  name_on_certificate text not null check (char_length(name_on_certificate) between 2 and 60),
  issued_at timestamptz not null default now(),
  unique (user_id, path_id)
);
alter table public.certificates enable row level security;
revoke all on public.certificates from public, anon, authenticated;
create policy "read own certificates" on public.certificates for select to authenticated using (user_id = auth.uid());
grant select on public.certificates to authenticated;
-- The public profile and certificate pages read through the server (service role), which shows only
-- what the learner turned on (profiles) or what anyone may verify (a certificate by its id).
