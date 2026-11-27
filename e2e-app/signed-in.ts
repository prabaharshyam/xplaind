import { test as base, type Page } from "@playwright/test";
import { USER } from "./learner.mjs";

// APP-0: signs the stand-in learner in. The test build's Supabase address is http://localhost:54321, so
// @supabase/ssr keeps the session in the cookie "sb-localhost-auth-token" (base64url encoded). The stand-in server
// (mock-supabase.mjs) accepts any token shaped like a JWT, so the browser and the Next server both see this learner.
const COOKIE = "sb-localhost-auth-token";
const b64url = (s: string) => Buffer.from(s).toString("base64url");

export function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: USER.id, email: USER.email, role: "authenticated", aud: "authenticated", exp: now + 3600, iat: now };
  const jwt = [b64url(JSON.stringify({ alg: "HS256", typ: "JWT" })), b64url(JSON.stringify(claims)), "test"].join(".");
  return { access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: "test-refresh", user: { ...USER, last_sign_in_at: new Date().toISOString() } };
}

/** Puts a signed-in session in the browser. Call before the first page.goto. */
export async function signIn(page: Page) {
  const session = fakeSession();
  await page.context().addCookies([{ name: COOKIE, value: `base64-${b64url(JSON.stringify(session))}`, url: "http://localhost:3200" }]);
  return session;
}

/** A test that starts signed in. */
export const test = base.extend<{ signedIn: void }>({
  signedIn: [
    async ({ page }, use) => {
      await signIn(page);
      await use();
    },
    { auto: true },
  ],
});
export { expect } from "@playwright/test";
