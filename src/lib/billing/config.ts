// PAY-1: whether Pro passes are on sale, from the host's settings (SC-1: never from the repository).
// PAYMENTS_MODE=sandbox uses the gateway's test environment, where no real money moves;
// PAYMENTS_MODE=production takes real payments. Unset, Pro is closed and nothing changes.
// The gateway is Cashfree (PAY-3) or Razorpay (RZ-1), with keys in the host's settings only.
// Pro also needs accounts open (a pass belongs to a signed-in 18+ learner) and the database.
import { accountsEnabled, supabaseServiceKey } from "@/lib/supabase/config";

export type PaymentsMode = "sandbox" | "production";
export type PaymentsConfig = { mode: PaymentsMode; appId: string; secret: string; baseUrl: string };

/** RZ-1: which gateway takes payments. PAYMENTS_PROVIDER picks one; unset, Razorpay wins when its keys are set. */
export type PaymentProvider = "cashfree" | "razorpay";

function modeOf(env: NodeJS.ProcessEnv): PaymentsMode | null {
  const mode = (env.PAYMENTS_MODE ?? "").trim().toLowerCase();
  return mode === "sandbox" || mode === "production" ? mode : null;
}

export function paymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
  const chosen = (env.PAYMENTS_PROVIDER ?? "").trim().toLowerCase();
  if (chosen === "cashfree" || chosen === "razorpay") return chosen;
  return env.RAZORPAY_KEY_ID?.trim() && env.RAZORPAY_KEY_SECRET?.trim() ? "razorpay" : "cashfree";
}

/** Cashfree's settings, when Cashfree is the provider and is fully set up. */
export function paymentsConfig(env: NodeJS.ProcessEnv = process.env): PaymentsConfig | null {
  const mode = modeOf(env);
  const appId = env.CASHFREE_APP_ID?.trim();
  const secret = env.CASHFREE_SECRET_KEY?.trim();
  if (paymentProvider(env) !== "cashfree" || !mode || !appId || !secret) return null;
  return { mode, appId, secret, baseUrl: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg" };
}

export type RazorpayConfig = { mode: PaymentsMode; keyId: string; secret: string; webhookSecret: string | null };

/**
 * RZ-1: Razorpay's settings, when Razorpay is the provider. The key itself says test or live
 * (rzp_test_ / rzp_live_), and it must agree with PAYMENTS_MODE, so a live key can never run
 * while the site says "test mode", nor a test key while it says live.
 */
export function razorpayConfig(env: NodeJS.ProcessEnv = process.env): RazorpayConfig | null {
  const mode = modeOf(env);
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const secret = env.RAZORPAY_KEY_SECRET?.trim();
  if (paymentProvider(env) !== "razorpay" || !mode || !keyId || !secret) return null;
  const keyMode: PaymentsMode | null = keyId.startsWith("rzp_test_") ? "sandbox" : keyId.startsWith("rzp_live_") ? "production" : null;
  if (keyMode !== mode) return null;
  return { mode, keyId, secret, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET?.trim() || null };
}

/** The live provider and its mode, or null while payments are off. */
export function activePayments(env: NodeJS.ProcessEnv = process.env): { provider: PaymentProvider; mode: PaymentsMode } | null {
  const c = paymentsConfig(env) ?? razorpayConfig(env);
  return c ? { provider: paymentProvider(env), mode: c.mode } : null;
}

/** The name learners see on policies and receipts. */
export const providerName = (env: NodeJS.ProcessEnv = process.env): string => (paymentProvider(env) === "razorpay" ? "Razorpay" : "Cashfree");

/** Pro is open: payments configured, accounts on, and the database reachable by the server. */
export const proOpen = (): boolean => activePayments() !== null && accountsEnabled() && supabaseServiceKey() !== null;
