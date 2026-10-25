// ED-5 writes data/link-status.json weekly (slice S6). Resource cards show each
// link's check date from it (RM-4). Until the first run the file does not exist
// and every card says the link has not been checked yet. Node only.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const LinkResult = z.object({
  status: z.enum(["ok", "broken", "unknown"]),
  /** YYYY-MM-DD in India. */
  checked_on: z.iso.date(),
});
export type LinkResult = z.infer<typeof LinkResult>;

export const LinkStatusFile = z.object({ results: z.record(z.string(), LinkResult) });

export function parseLinkStatus(raw: unknown): Record<string, LinkResult> {
  const parsed = LinkStatusFile.safeParse(raw);
  return parsed.success ? parsed.data.results : {};
}

let cached: Record<string, LinkResult> | undefined;

export function getLinkStatus(): Record<string, LinkResult> {
  if (cached) return cached;
  const file = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "link-status.json");
  try {
    cached = parseLinkStatus(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    cached = {};
  }
  return cached;
}
