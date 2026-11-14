-- CB-1 (2026-11-14, owner decision): enquiries about Pro for a batch of learners, from a college,
-- training institute or company. Server-only: the API route writes with the service role; nobody
-- else can read or write. The owner reads them in the Supabase dashboard.
create table public.batch_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_name text not null check (char_length(org_name) between 2 and 120),
  org_type text not null check (org_type in ('college', 'training-institute', 'company', 'other')),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^\+?[0-9]{10,15}$'),
  learners int not null check (learners between 10 and 100000),
  message text not null default '' check (char_length(message) <= 1000),
  consent_text text not null
);
create index batch_enquiries_created on public.batch_enquiries (created_at desc);

alter table public.batch_enquiries enable row level security;
revoke all on public.batch_enquiries from public, anon, authenticated;
