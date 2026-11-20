-- CO-1 (2026-11-20): the site records each AI call's tokens and cost with
-- ai_record(user, kind, day, tokens_in, tokens_out, cost). That 6-argument version was replaced outside the
-- repo by a version with a reservation argument the code never sends, so every recording failed silently,
-- costs stayed at 0 and the monthly cap could never trigger. This restores it (applied to production on
-- 20 Nov 2026). The 7-argument reservation version and the 5-argument ai_reserve left in the database are
-- not used by the code.
create or replace function public.ai_record(p_user uuid, p_kind text, p_day date, p_tokens_in int, p_tokens_out int, p_cost_usd numeric)
returns void
language sql
set search_path = ''
as $$
  update public.ai_usage
  set tokens_in = tokens_in + p_tokens_in, tokens_out = tokens_out + p_tokens_out, cost_usd = cost_usd + p_cost_usd
  where user_id = p_user and day = p_day and kind = p_kind;
$$;

revoke all on function public.ai_record(uuid, text, date, int, int, numeric) from public, anon, authenticated;
grant execute on function public.ai_record(uuid, text, date, int, int, numeric) to service_role;

notify pgrst, 'reload schema';
