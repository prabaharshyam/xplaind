-- RD-2: who downloaded a printable roadmap checklist. Server-only: the API route
-- writes with the service role; learners and visitors can neither read nor write.
-- PV-1 as amended: phone is optional and only kept with the learner's consent.
create table public.roadmap_downloads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path_id text not null check (char_length(path_id) <= 60),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^\+?[0-9]{10,15}$'),
  experience text not null check (experience in ('student','fresher','1-3','3-7','7-plus','career-switch')),
  consent_text text not null,
  user_id uuid references auth.users on delete set null
);

create index roadmap_downloads_email on public.roadmap_downloads (email);
create index roadmap_downloads_user on public.roadmap_downloads (user_id);

alter table public.roadmap_downloads enable row level security;
revoke all on public.roadmap_downloads from public, anon, authenticated;
