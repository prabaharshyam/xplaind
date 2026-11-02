-- SU-5: the AI helpers work without an account. A visitor who is not signed in is counted by a
-- short hash of their address that changes every day (the address itself is never stored), with
-- the same per-kind daily limits as learners. Guest spend counts toward the site's one monthly
-- cap (CO-1), so the owner's US$ cap still bounds everything.

create table public.ai_guest_usage (
  visitor text not null,                       -- daily-rotating hash, not an address
  day date not null, kind text not null,
  calls int not null default 0, tokens_in int not null default 0, tokens_out int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  primary key (visitor, day, kind)
);
create index ai_guest_usage_day on public.ai_guest_usage (day);
-- Server only: row-level security on and no policies, so no visitor or learner can read or write it.
alter table public.ai_guest_usage enable row level security;
-- Supabase grants every table to anon and authenticated by default; take that back too.
revoke all on public.ai_guest_usage from public, anon, authenticated;

-- The monthly spend across learners and guests.
create function public.ai_month_spend(p_month_start date)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce((select sum(cost_usd) from public.ai_usage where day >= p_month_start), 0)
       + coalesce((select sum(cost_usd) from public.ai_guest_usage where day >= p_month_start), 0);
$$;

-- Learners: as before, but the monthly cap now includes guest spend.
create or replace function public.ai_reserve(p_user uuid, p_kind text, p_day date, p_month_start date, p_daily_max int, p_month_cap_usd numeric)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_calls int;
begin
  perform pg_advisory_xact_lock(hashtext('ai_reserve'));
  if public.ai_month_spend(p_month_start) >= p_month_cap_usd then
    return 'month';
  end if;
  select calls into v_calls from public.ai_usage where user_id = p_user and day = p_day and kind = p_kind;
  if coalesce(v_calls, 0) >= p_daily_max then
    return 'day';
  end if;
  insert into public.ai_usage as u (user_id, day, kind, calls) values (p_user, p_day, p_kind, 1)
  on conflict (user_id, day, kind) do update set calls = u.calls + 1;
  return 'ok';
end;
$$;

-- Guests: the same checks, counted per visitor hash.
create function public.ai_reserve_guest(p_visitor text, p_kind text, p_day date, p_month_start date, p_daily_max int, p_month_cap_usd numeric)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_calls int;
begin
  perform pg_advisory_xact_lock(hashtext('ai_reserve'));
  if public.ai_month_spend(p_month_start) >= p_month_cap_usd then
    return 'month';
  end if;
  select calls into v_calls from public.ai_guest_usage where visitor = p_visitor and day = p_day and kind = p_kind;
  if coalesce(v_calls, 0) >= p_daily_max then
    return 'day';
  end if;
  insert into public.ai_guest_usage as u (visitor, day, kind, calls) values (p_visitor, p_day, p_kind, 1)
  on conflict (visitor, day, kind) do update set calls = u.calls + 1;
  return 'ok';
end;
$$;

create function public.ai_record_guest(p_visitor text, p_kind text, p_day date, p_tokens_in int, p_tokens_out int, p_cost_usd numeric)
returns void
language sql
set search_path = ''
as $$
  update public.ai_guest_usage
  set tokens_in = tokens_in + p_tokens_in, tokens_out = tokens_out + p_tokens_out, cost_usd = cost_usd + p_cost_usd
  where visitor = p_visitor and day = p_day and kind = p_kind;
$$;

revoke all on function public.ai_month_spend(date) from public, anon, authenticated;
revoke all on function public.ai_reserve(uuid, text, date, date, int, numeric) from public, anon, authenticated;
revoke all on function public.ai_reserve_guest(text, text, date, date, int, numeric) from public, anon, authenticated;
revoke all on function public.ai_record_guest(text, text, date, int, int, numeric) from public, anon, authenticated;
