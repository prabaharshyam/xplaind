import { describe, expect, it } from "vitest";
import { adultConfirmedAt, parseNewPassword, parseOAuthForm, parsePasswordForm } from "./auth-forms";

const form = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });

describe("sign-in forms (AC-1, PV-2)", () => {
  it("Google and GitHub need the 18+ tick and a known provider", () => {
    expect(parseOAuthForm(form({ provider: "google", adult: "yes" }))).toMatchObject({ ok: true, provider: "google" });
    expect(parseOAuthForm(form({ provider: "github" }))).toEqual({ ok: false, error: "adult" });
    expect(parseOAuthForm(form({ provider: "facebook", adult: "yes" }))).toEqual({ ok: false, error: "provider" });
  });

  it("sign-up with a password needs the tick, a real email and 8 or more characters", () => {
    const ok = { mode: "signup", email: " a@example.com ", password: "longenough", adult: "yes" };
    expect(parsePasswordForm(form(ok))).toMatchObject({ ok: true, data: { email: "a@example.com", mode: "signup" } });
    expect(parsePasswordForm(form({ ...ok, adult: "" }))).toEqual({ ok: false, error: "adult" });
    expect(parsePasswordForm(form({ ...ok, email: "nope" }))).toEqual({ ok: false, error: "email" });
    expect(parsePasswordForm(form({ ...ok, password: "short" }))).toEqual({ ok: false, error: "password" });
  });

  it("signing in to an existing account does not ask for the tick again", () => {
    expect(parsePasswordForm(form({ mode: "signin", email: "a@example.com", password: "longenough" }))).toMatchObject({ ok: true });
  });

  it("a new password must be 8 to 72 characters", () => {
    expect(parseNewPassword(form({ password: "longenough" })).ok).toBe(true);
    expect(parseNewPassword(form({ password: "x".repeat(73) })).ok).toBe(false);
  });

  it("finds the 18+ time on the account first, then in the cookie", () => {
    expect(adultConfirmedAt({ adult_confirmed_at: "2026-11-01T10:00:00Z" }, "2026-01-01T00:00:00Z")).toBe("2026-11-01T10:00:00.000Z");
    expect(adultConfirmedAt({}, "2026-11-01T10:00:00Z")).toBe("2026-11-01T10:00:00.000Z");
    expect(adultConfirmedAt(null, "garbage")).toBeNull();
    expect(adultConfirmedAt({ adult_confirmed_at: 5 }, undefined)).toBeNull();
  });
});
