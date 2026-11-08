// PAY-1: whether Pro passes are on sale, from the host's settings (SC-1: never from the repository).
// PAYMENTS_MODE=sandbox uses Cashfree's test environment, where no real money moves;
// PAYMENTS_MODE=production takes real payments. Unset, Pro is closed and nothing changes.
// Pro also needs accounts open (a pass belongs to a signed-in 18+ learner) and the database.
import { accountsEnabled, supabaseServiceKey } from "@/lib/supabase/config";

export type PaymentsMode = "sandbox" | "production";
export type PaymentsConfig = { mode: PaymentsMode; appId: string; secret: string; baseUrl: string };

export function paymentsConfig(env: NodeJS.ProcessEnv = process.env): PaymentsConfig | null {
  const mode = (env.PAYMENTS_MODE ?? "").trim().toLowerCase();
  const appId = env.CASHFREE_APP_ID?.trim();
  const secret = env.CASHFREE_SECRET_KEY?.trim();
  if ((mode !== "sandbox" && mode !== "production") || !appId || !secret) return null;
  return { mode, appId, secret, baseUrl: mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg" };
}

/** Pro is open: payments configured, accounts on, and the database reachable by the server. */
export const proOpen = (): boolean => paymentsConfig() !== null && accountsEnabled() && supabaseServiceKey() !== null;
