import { afterEach, describe, expect, it, vi } from "vitest";
import { canSave, needAccount, setSignedIn } from "./account-sync";

describe("sign-up gate (SU-1, SU-2)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    setSignedIn(false);
  });

  it("leaves everything open while accounts are off", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(canSave()).toBe(true);
    expect(needAccount("pdf")).toBe(true);
  });

  it("leaves everything open while sign-ups are on hold, even with Supabase set up (SU-4)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "");
    setSignedIn(false);
    expect(canSave()).toBe(true);
    expect(needAccount("tools")).toBe(true);
  });

  it("blocks signed-out visitors once accounts are on, and lets signed-in learners through", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "true");
    setSignedIn(false);
    expect(needAccount("interview", true)).toBe(false);
    setSignedIn(true);
    expect(needAccount("interview")).toBe(true);
  });

  it("asks the page to open the sign-up prompt, unless the save was quiet", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "true");
    const events: string[] = [];
    vi.stubGlobal("window", { dispatchEvent: (e: CustomEvent) => events.push(e.detail.reason) });
    setSignedIn(false);
    needAccount("pdf");
    needAccount("progress", true);
    expect(events).toEqual(["pdf"]);
    vi.unstubAllGlobals();
  });
});
