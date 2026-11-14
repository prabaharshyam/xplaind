// CB-1 (2026-11-14, owner decision): a college, training institute or company asks about Pro for a
// batch of learners. Pure, so the form and the API share one set of rules.
import { z } from "zod";
import { normalisePhone } from "@/lib/download/details";

export const ORG_TYPES = [
  { id: "college", label: "College or university" },
  { id: "training-institute", label: "Training institute" },
  { id: "company", label: "Company (team training)" },
  { id: "other", label: "Something else" },
] as const;
export type OrgTypeId = (typeof ORG_TYPES)[number]["id"];

/** The smallest batch we quote for; fewer learners can buy their own passes. */
export const MIN_BATCH = 10;
export const MAX_BATCH = 100_000;

/** The words the person agrees to, stored with the enquiry. */
export const ENQUIRY_CONSENT =
  "Xplaind may keep these details to reply to this enquiry by email, and by phone only if I gave a number. I can ask for them to be deleted at any time.";

export const BatchEnquiry = z.strictObject({
  orgName: z.string().trim().min(2, "Please enter the name of your organisation.").max(120),
  orgType: z.enum(ORG_TYPES.map((o) => o.id) as [OrgTypeId, ...OrgTypeId[]], "Please choose what kind of organisation it is."),
  contactName: z.string().trim().min(1, "Please enter your name.").max(80).regex(/^[\p{L}\p{M} .'-]+$/u, "Use letters and spaces only."),
  email: z.email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .max(20)
    .default("")
    .transform((v, ctx) => {
      const p = normalisePhone(v);
      if (p === "invalid") ctx.addIssue({ code: "custom", message: "Enter a 10-digit mobile number, or leave it empty." });
      return p === "invalid" ? null : p;
    }),
  learners: z.coerce
    .number("Please enter how many learners.")
    .int("Please enter a whole number.")
    .min(MIN_BATCH, `Batches start at ${MIN_BATCH} learners. Fewer learners can each buy a pass on the pricing page.`)
    .max(MAX_BATCH, "Please enter a smaller number, or write to us."),
  message: z.string().trim().max(1000).default(""),
  consent: z.literal(true, "Please agree so we can reply to you."),
});
export type BatchEnquiry = z.infer<typeof BatchEnquiry>;
