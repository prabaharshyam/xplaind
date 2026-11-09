-- AG-1 (2026-11-09, owner decision): once sign-ups are open, a visitor without an account gets one
-- free AI action a day across every AI tool, then is asked to sign in. Counted on the same
-- server-only table as other guest calls (ai_guest_usage), under the same lock as every reservation.
create function public.ai_reserve_guest_sample(p_visitor text, p_kind text, p_day date, p_month_start date, p_total_max int, p_month_cap_usd numeric)
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
  select coalesce(sum(calls), 0) into v_calls from public.ai_guest_usage where visitor = p_visitor and day = p_day;
  if v_calls >= p_total_max then
    return 'signin';
  end if;
  insert into public.ai_guest_usage as u (visitor, day, kind, calls) values (p_visitor, p_day, p_kind, 1)
  on conflict (visitor, day, kind) do update set calls = u.calls + 1;
  return 'ok';
end;
$$;
revoke all on function public.ai_reserve_guest_sample(text, text, date, date, int, numeric) from public, anon, authenticated;
