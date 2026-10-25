// AC-1: the sign-in form. No link is sent without the "I am 18 or older" tick. Pure.
import { z } from "zod";

const Form = z.object({
  email: z.email().max(254),
  adult: z.literal("yes"),
  next: z.string().max(200).optional(),
});

export type EmailLinkForm = z.infer<typeof Form>;

export function parseEmailLinkForm(form: { get(name: string): FormDataEntryValue | null }): { ok: true; data: EmailLinkForm } | { ok: false; error: "adult" | "email" } {
  const parsed = Form.safeParse({
    email: String(form.get("email") ?? "").trim(),
    adult: form.get("adult") ?? undefined,
    next: form.get("next") ? String(form.get("next")) : undefined,
  });
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "adult") ? "adult" : "email" };
}
