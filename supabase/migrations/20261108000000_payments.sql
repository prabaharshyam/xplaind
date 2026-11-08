-- PAY-2: Pro passes paid through Cashfree. A pass is a one-time payment for 1, 6 or 12 months of
-- higher daily AI limits; there is no recurring mandate. Learners can read their own rows; every
-- write goes through the server (service role), which confirms the payment with Cashfree first.
--
-- payments keeps the order even after the account is deleted (the user id is cleared), because
-- payment records must be kept for tax and accounting. It holds no card, UPI or phone details.

create table public.payments (
  order_id text primary key check (order_id ~ '^xp_[A-Za-z0-9_-]{6,42}$'),
  user_id uuid references auth.users on delete set null,
  plan_id text not null check (plan_id in ('pass_month', 'pass_6month', 'pass_year')),
  amount_paise int not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  environment text not null check (environment in ('sandbox', 'production')),
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  cf_payment_id text check (char_length(cf_payment_id) <= 64),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_user on public.payments (user_id, created_at desc);

-- One row per learner: the plan they last bought and when Pro ends.
create table public.entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  plan_id text not null check (plan_id in ('pass_month', 'pass_6month', 'pass_year')),
  valid_until timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.entitlements enable row level security;
revoke all on public.payments from public, anon, authenticated;
revoke all on public.entitlements from public, anon, authenticated;
create policy "read own payments" on public.payments for select to authenticated using (user_id = auth.uid());
create policy "read own entitlement" on public.entitlements for select to authenticated using (user_id = auth.uid());
grant select on public.payments, public.entitlements to authenticated;

-- Marks an order paid and grants or extends the pass, once. Called only after the server has
-- confirmed with Cashfree that the order is PAID for the right amount. A pass bought while one is
-- still running starts when the current one ends. Returns 'granted', 'already' or 'missing'.
create function public.grant_pass(p_order text, p_cf_payment text, p_now timestamptz)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_pay public.payments%rowtype;
  v_months int;
  v_from timestamptz;
begin
  select * into v_pay from public.payments where order_id = p_order for update;
  if not found or v_pay.user_id is null then
    return 'missing';
  end if;
  if v_pay.status = 'paid' then
    return 'already';
  end if;
  v_months := case v_pay.plan_id when 'pass_month' then 1 when 'pass_6month' then 6 else 12 end;
  update public.payments set status = 'paid', paid_at = p_now, cf_payment_id = p_cf_payment where order_id = p_order;
  select greatest(p_now, coalesce((select valid_until from public.entitlements where user_id = v_pay.user_id), p_now)) into v_from;
  insert into public.entitlements as e (user_id, plan_id, valid_until, updated_at)
  values (v_pay.user_id, v_pay.plan_id, v_from + make_interval(months => v_months), p_now)
  on conflict (user_id) do update set plan_id = excluded.plan_id, valid_until = excluded.valid_until, updated_at = excluded.updated_at;
  return 'granted';
end;
$$;

revoke all on function public.grant_pass(text, text, timestamptz) from public, anon, authenticated;
