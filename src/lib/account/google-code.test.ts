import { describe, expect, it } from "vitest";
import { encodeCodeCookie, googleAuthUrl, googleCodeConfig, readCodeCookie } from "./google-code";

const env = { NEXT_PUBLIC_GOOGLE_CLIENT_ID: "id.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "secret" };

describe("Google sign-in through xplaind.in, never the Supabase address (AC-1c)", () => {
  it("is on only with a client id and secret, on the site's own address", () => {
    expect(googleCodeConfig(env, "https://xplaind.in", "https://xplaind.in")).toEqual({
      clientId: "id.apps.googleusercontent.com",
      clientSecret: "secret",
      redirectUri: "https://xplaind.in/auth/google",
    });
    expect(googleCodeConfig({ ...env, GOOGLE_CLIENT_SECRET: "" }, "https://xplaind.in", "https://xplaind.in")).toBeNull();
    // A preview is not listed with Google, so it keeps the old way.
    expect(googleCodeConfig(env, "https://xplaind-git-x.vercel.app", "https://xplaind.in")).toBeNull();
  });

  it("sends the visitor to Google with our return address, the state and the hashed nonce", () => {
    const url = new URL(googleAuthUrl(googleCodeConfig(env, "https://xplaind.in", "https://xplaind.in")!, "st", "hashed"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("redirect_uri")).toBe("https://xplaind.in/auth/google");
    expect(url.searchParams.get("redirect_uri")).not.toMatch(/supabase/);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ response_type: "code", state: "st", nonce: "hashed", scope: "openid email profile" });
  });

  it("accepts Google's answer only when the state matches the cookie", () => {
    const cookie = encodeCodeCookie("st", "raw", "/paths?x=1");
    expect(readCodeCookie(cookie, "st")).toEqual({ nonce: "raw", next: "/paths?x=1" });
    expect(readCodeCookie(cookie, "other")).toBeNull();
    expect(readCodeCookie(undefined, "st")).toBeNull();
    expect(readCodeCookie(cookie, null)).toBeNull();
  });
});
