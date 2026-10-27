import { describe, expect, it } from "vitest";
import { DownloadDetails, normalisePhone } from "./details";

const ok = { pathId: "genai-engineer", name: "Asha Rao", email: "asha@example.com", phone: "", experience: "fresher", consent: true };

describe("checklist download details (RD-1, RD-2)", () => {
  it("accepts a name, email and experience, with phone left empty", () => {
    const d = DownloadDetails.parse(ok);
    expect(d.phone).toBeNull();
  });

  it("stores Indian mobile numbers with +91 and keeps international ones", () => {
    expect(normalisePhone("98765 43210")).toBe("+919876543210");
    expect(normalisePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalisePhone("12345")).toBe("invalid");
    expect(DownloadDetails.parse({ ...ok, phone: "(987) 654-3210" }).phone).toBe("+919876543210");
  });

  it("refuses a missing consent, a bad email, a bad phone or an unknown experience", () => {
    for (const bad of [{ consent: false }, { email: "asha" }, { phone: "abc" }, { experience: "wizard" }, { name: "" }, { name: "<script>" }]) {
      expect(DownloadDetails.safeParse({ ...ok, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it("explains a bad phone in plain words", () => {
    const r = DownloadDetails.safeParse({ ...ok, phone: "12" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/10-digit mobile number/);
  });
});
