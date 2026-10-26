// RD-1, RD-2: the details a learner gives before downloading a printable roadmap
// checklist. Pure, so the form and the API share one set of rules.
import { z } from "zod";

export const EXPERIENCE = [
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher, looking for a first job" },
  { id: "1-3", label: "1 to 3 years of work" },
  { id: "3-7", label: "3 to 7 years of work" },
  { id: "7-plus", label: "More than 7 years of work" },
  { id: "career-switch", label: "Switching careers into AI" },
] as const;
export type ExperienceId = (typeof EXPERIENCE)[number]["id"];

/** The words the learner agrees to, stored with their details. */
export const CONSENT_TEXT =
  "Xplaind may keep my details to send me this roadmap's updates and learning tips by email, and by phone only if I gave a number. I can ask for them to be deleted at any time.";

/** Indian mobile numbers with or without +91, or any international number of 10 to 15 digits. */
export const normalisePhone = (raw: string): string | null => {
  const digits = raw.replace(/[\s()-]/g, "");
  if (!digits) return null;
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  return /^\+?\d{10,15}$/.test(digits) ? digits : "invalid";
};

export const DownloadDetails = z.strictObject({
  pathId: z.string().regex(/^[a-z0-9-]{1,60}$/),
  name: z.string().trim().min(1, "Please enter your name.").max(80).regex(/^[\p{L}\p{M} .'-]+$/u, "Use letters and spaces only."),
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
  experience: z.enum(EXPERIENCE.map((e) => e.id) as [ExperienceId, ...ExperienceId[]], "Please choose your experience."),
  consent: z.literal(true, "Please agree, so we can keep your details."),
});
export type DownloadDetails = z.output<typeof DownloadDetails>;
