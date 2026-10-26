// Whether AI features are on, from the host's settings (SC-1: never from the repository).
import { accountsEnabled, supabaseServiceKey } from "@/lib/supabase/config";
import { DEFAULT_MODEL, DEFAULT_MONTHLY_CAP_USD, positiveNumber } from "./limits";

export type AiSettings = { apiKey: string; model: string; monthlyCapUsd: number };

/** The AI settings, or null when AI is off: no key, accounts not set up, or the kill switch on. */
export function aiSettings(): AiSettings | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !accountsEnabled() || !supabaseServiceKey()) return null;
  if (["1", "true", "on", "yes"].includes((process.env.AI_KILL_SWITCH ?? "").trim().toLowerCase())) return null;
  return {
    apiKey,
    model: process.env.AI_MODEL?.trim() || DEFAULT_MODEL,
    monthlyCapUsd: positiveNumber(process.env.AI_MONTHLY_CAP_USD, DEFAULT_MONTHLY_CAP_USD),
  };
}

export const aiEnabled = () => aiSettings() !== null;

