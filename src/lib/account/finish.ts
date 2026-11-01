// After any sign-in (link, Google, GitHub or password): make sure the profile exists with
// its 18+ time (AC-1). A brand-new account with no 18+ tick is signed out again (PV-2).
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADULT_COOKIE, adultConfirmedAt } from "./auth-forms";
import { ensureProfile, profileExists } from "./repo";

export async function finishSignIn(client: SupabaseClient, admin: SupabaseClient): Promise<"ok" | "adult"> {
  const { data } = await client.auth.getUser();
  if (!data.user) return "adult";
  const store = await cookies();
  const adultAt = adultConfirmedAt(data.user.user_metadata, store.get(ADULT_COOKIE)?.value);
  store.delete({ name: ADULT_COOKIE, path: "/auth" });
  if (adultAt) {
    await ensureProfile(admin, data.user.id, adultAt);
    return "ok";
  }
  if (await profileExists(admin, data.user.id)) return "ok";
  await client.auth.signOut();
  return "adult";
}
