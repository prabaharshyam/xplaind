// AC-1 (amended 2026-11-01): the sign-in forms. Google, GitHub, email and password,
// or an email link. Every new account needs the "I am 18 or older" tick (PV-2). Pure.
import { z } from "zod";

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const PASSWORD_MIN = 8;

type FormLike = { get(name: string): FormDataEntryValue | null };
const str = (form: FormLike, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v : undefined;
};

export type FormError = "adult" | "email" | "password" | "provider";

/** "Continue with Google / GitHub". The tick is checked here because the button skips browser validation. */
export function parseOAuthForm(form: FormLike): { ok: true; provider: OAuthProvider; next?: string } | { ok: false; error: FormError } {
  const provider = z.enum(OAUTH_PROVIDERS).safeParse(str(form, "provider"));
  if (!provider.success) return { ok: false, error: "provider" };
  if (str(form, "adult") !== "yes") return { ok: false, error: "adult" };
  return { ok: true, provider: provider.data, next: str(form, "next")?.slice(0, 200) };
}

/**
 * AC-1a: Google's own button on xplaind.in hands back a signed ID token (a JWT) and we send it,
 * with the raw nonce it was issued for, to Supabase. The 18+ tick is required as for any
 * Google sign-in.
 */
export function parseGoogleIdForm(form: FormLike): { ok: true; credential: string; nonce: string; next?: string } | { ok: false; error: FormError } {
  const credential = z
    .string()
    .max(4096)
    .regex(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    .safeParse(str(form, "credential"));
  const nonce = z
    .string()
    .regex(/^[\w-]{16,128}$/)
    .safeParse(str(form, "nonce"));
  if (!credential.success || !nonce.success) return { ok: false, error: "provider" };
  if (str(form, "adult") !== "yes") return { ok: false, error: "adult" };
  return { ok: true, credential: credential.data, nonce: nonce.data, next: str(form, "next")?.slice(0, 200) };
}

const Email = z.email().max(254);
const Password = z.string().min(PASSWORD_MIN).max(72); // 72: the bcrypt limit Supabase uses

export type PasswordForm = { mode: "signup" | "signin"; email: string; password: string; adult: boolean; next?: string };

/** Email and password. Sign-up needs the 18+ tick; sign-in does not, the account already has it. */
export function parsePasswordForm(form: FormLike): { ok: true; data: PasswordForm } | { ok: false; error: FormError } {
  const mode = str(form, "mode") === "signin" ? "signin" : "signup";
  const email = Email.safeParse((str(form, "email") ?? "").trim());
  if (!email.success) return { ok: false, error: "email" };
  const password = Password.safeParse(str(form, "password") ?? "");
  if (!password.success) return { ok: false, error: "password" };
  const adult = str(form, "adult") === "yes";
  if (mode === "signup" && !adult) return { ok: false, error: "adult" };
  return { ok: true, data: { mode, email: email.data, password: password.data, adult, next: str(form, "next")?.slice(0, 200) } };
}

/** A new password for a signed-in learner (set one after signing in with Google or a link). */
export function parseNewPassword(form: FormLike): { ok: true; password: string } | { ok: false } {
  const p = Password.safeParse(str(form, "password") ?? "");
  return p.success ? { ok: true, password: p.data } : { ok: false };
}

/**
 * When the learner said they are 18 or older. From the sign-up form (stored on the auth user),
 * else from the tick made just before Google or GitHub (a short-lived cookie), else unknown:
 * then only an existing profile lets them in.
 */
export function adultConfirmedAt(metadata: unknown, cookie: string | undefined): string | null {
  const fromUser = (metadata as { adult_confirmed_at?: unknown } | null)?.adult_confirmed_at;
  for (const v of [fromUser, cookie]) {
    if (typeof v === "string" && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  }
  return null;
}

export const ADULT_COOKIE = "xp_adult";

/**
 * AC-1: Supabase answers a sign-up for an email that already has an account with no error, no
 * session and a user with no identities, and sends no email (so emails cannot be probed). Spot
 * that case so the learner is told to sign in instead of waiting for an email that never comes.
 */
export function signUpHitExistingAccount(user: { identities?: unknown[] | null } | null | undefined): boolean {
  return Boolean(user) && Array.isArray(user!.identities) && user!.identities.length === 0;
}
