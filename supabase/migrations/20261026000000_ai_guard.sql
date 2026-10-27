-- Release 2 AI features (CO-1). The owner set a US$20 monthly cap, so each call's
-- cost is stored next to its tokens, and two server-only functions guard spend:
-- ai_reserve counts a call before it is made and refuses it at the daily or the
-- monthly cap; ai_record adds the tokens and cost once the call returns.

alter table public.ai_usage add column cost_usd numeric(12, 6) not null default 0;
create index ai_usage_day on public.ai_usage (day);

-- Returns 'ok', 'day' (this learner's daily cap for this kind) or 'month' (the site's monthly cap).
create function public.ai_reserve(p_user uuid, p_kind text, p_day date, p_month_start date, p_daily_max int, p_month_cap_usd numeric)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_spent numeric;
  v_calls int;
begin
  -- One reservation at a time, so two requests cannot both take the last slot.
  perform pg_advisory_xact_lock(hashtext('ai_reserve'));
  select coalesce(sum(cost_usd), 0) into v_spent from public.ai_usage where day >= p_month_start;
  if v_spent >= p_month_cap_usd then
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

create function public.ai_record(p_user uuid, p_kind text, p_day date, p_tokens_in int, p_tokens_out int, p_cost_usd numeric)
returns void
language sql
set search_path = ''
as $$
  update public.ai_usage
  set tokens_in = tokens_in + p_tokens_in, tokens_out = tokens_out + p_tokens_out, cost_usd = cost_usd + p_cost_usd
  where user_id = p_user and day = p_day and kind = p_kind;
$$;

revoke all on function public.ai_reserve(uuid, text, date, date, int, numeric) from public, anon, authenticated;
revoke all on function public.ai_record(uuid, text, date, int, int, numeric) from public, anon, authenticated;
