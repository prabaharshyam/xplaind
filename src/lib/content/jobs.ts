// JB-1: AI jobs and salaries in India, read from content/jobs/salaries.yaml. Node only.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { JobsFile } from "./schema";

export function getJobs(root = path.join(/* turbopackIgnore: true */ process.cwd(), "content")): JobsFile {
  return JobsFile.parse(parse(fs.readFileSync(path.join(root, "jobs", "salaries.yaml"), "utf8")));
}

/** JB-2: live openings on Naukri and LinkedIn, searched for the role across India. */
export function jobLinks(search: string): { naukri: string; linkedin: string } {
  const slug = search
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    naukri: `https://www.naukri.com/${slug}-jobs`,
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(search)}&location=India`,
  };
}
