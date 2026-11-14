import { describe, expect, it } from "vitest";
import { BatchEnquiry, MIN_BATCH } from "./enquiry";

const ok = { orgName: "Anna College of Engineering", orgType: "college", contactName: "Priya R", email: "tpo@example.edu", phone: "98765 43210", learners: "120", message: "", consent: true };

describe("CB-1 batch enquiry", () => {
  it("accepts a full enquiry and cleans the phone and number", () => {
    const e = BatchEnquiry.parse(ok);
    expect(e.phone).toBe("+919876543210");
    expect(e.learners).toBe(120);
  });
  it("keeps the phone optional", () => {
    expect(BatchEnquiry.parse({ ...ok, phone: "" }).phone).toBeNull();
  });
  it("refuses small batches, a missing consent and unknown kinds", () => {
    expect(BatchEnquiry.safeParse({ ...ok, learners: MIN_BATCH - 1 }).success).toBe(false);
    expect(BatchEnquiry.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(BatchEnquiry.safeParse({ ...ok, orgType: "school" }).success).toBe(false);
    expect(BatchEnquiry.safeParse({ ...ok, phone: "12" }).success).toBe(false);
  });
  it("refuses unknown fields", () => {
    expect(BatchEnquiry.safeParse({ ...ok, price: 1 }).success).toBe(false);
  });
});
