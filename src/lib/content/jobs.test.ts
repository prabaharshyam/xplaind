import { describe, expect, it } from "vitest";
import { todayInIST } from "@/lib/dates";
import { getPaths } from "./index";
import { getJobs, jobLinks } from "./jobs";

describe("AI jobs and salaries (JB-1, JB-2)", () => {
  const jobs = getJobs();

  it("covers every role roadmap, and only real ones", () => {
    const paths = getPaths().map((p) => p.id).sort();
    expect(jobs.roles.map((r) => r.path).sort()).toEqual(paths);
  });

  it("has a checked date that is not in the future, and bands that rise with experience", () => {
    expect(jobs.checked <= todayInIST()).toBe(true);
    for (const r of jobs.roles) {
      for (let i = 1; i < r.bands.length; i++) expect(r.bands[i].min, r.path).toBeGreaterThanOrEqual(r.bands[i - 1].min);
      expect(r.bands.at(-1)!.max, r.path).toBeLessThan(200); // lakh a year: a sanity bound against typos
    }
  });

  it("links to live openings on Naukri and LinkedIn, searched across India", () => {
    const l = jobLinks("AI Product Manager");
    expect(l.naukri).toBe("https://www.naukri.com/ai-product-manager-jobs");
    expect(l.linkedin).toBe("https://www.linkedin.com/jobs/search/?keywords=AI%20Product%20Manager&location=India");
  });
});
