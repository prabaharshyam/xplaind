// CT-1 (2026-11-14, owner decision): who can claim a verified certificate for a role. Pure.

/** Share of a role's lessons that must be done by passing the check or a project, not just marked done. */
export const VERIFIED_SHARE = 0.8;

export type DoneHow = "check" | "project" | "self_marked" | "self_skipped" | null;
export type Eligibility = { ok: boolean; lessonsDone: number; lessonsTotal: number; verified: number; verifiedNeeded: number; projectPassed: boolean };

/**
 * A role's certificate needs every lesson on its roadmap done, at least 80% of them by passing the
 * quick check or a project, and a passed AI review of one of the role's guided projects (any guided
 * project when the role has none).
 */
export function eligibility(pathLessons: string[], done: Map<string, DoneHow>, passedProjects: Set<string>, pathProjects: string[]): Eligibility {
  const lessonsDone = pathLessons.filter((id) => done.has(id)).length;
  const verified = pathLessons.filter((id) => done.get(id) === "check" || done.get(id) === "project").length;
  const verifiedNeeded = Math.ceil(pathLessons.length * VERIFIED_SHARE);
  const projectPassed = pathProjects.length ? pathProjects.some((p) => passedProjects.has(p)) : passedProjects.size > 0;
  return { ok: pathLessons.length > 0 && lessonsDone === pathLessons.length && verified >= verifiedNeeded && projectPassed, lessonsDone, lessonsTotal: pathLessons.length, verified, verifiedNeeded, projectPassed };
}

/** A certificate id: 10 lower-case letters and digits, no look-alikes. Pure given the bytes. */
export function certificateId(bytes: Uint8Array): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(bytes.slice(0, 10), (b) => alphabet[b % alphabet.length]).join("");
}

/** A handle as typed: lower case, letters, digits and inner hyphens, 3 to 30 long. Null if it cannot be one. */
export function normaliseHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const h = raw.trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(h) ? h : null;
}

/** LinkedIn's "Add licence or certification" link, filled in. Pure. */
export function linkedInAddUrl(c: { title: string; issuedAt: Date; url: string; id: string }): string {
  const q = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: c.title,
    organizationName: "Xplaind",
    issueYear: String(c.issuedAt.getUTCFullYear()),
    issueMonth: String(c.issuedAt.getUTCMonth() + 1),
    certUrl: c.url,
    certId: c.id,
  });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
