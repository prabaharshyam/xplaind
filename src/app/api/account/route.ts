// AC-11: delete the account. Removing the auth user cascades to every learner
// table in the same request; email subscriptions are deleted explicitly, because
// their foreign key only sets user_id to null.
import { json, problem, requireSession } from "@/lib/account/http";

export async function DELETE() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;

  const { error: subError } = await admin.from("email_subscriptions").delete().eq("user_id", user.id);
  if (!subError && user.email) await admin.from("email_subscriptions").delete().eq("email", user.email);
  // RD-2: checklist download details go with the account.
  await admin.from("roadmap_downloads").delete().eq("user_id", user.id);
  if (user.email) await admin.from("roadmap_downloads").delete().eq("email", user.email);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error || subError) return problem(500, "Could not delete the account. Nothing was removed from your sign-in.");
  await client.auth.signOut();
  return json({ ok: true });
}
