import { describe, expect, it } from "vitest";
import { parseEmailLinkForm } from "./email-link";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe("parseEmailLinkForm (AC-1)", () => {
  it("accepts an email with the 18+ tick", () => {
    expect(parseEmailLinkForm(form({ email: " asha@example.com ", adult: "yes" }))).toEqual({
      ok: true,
      data: { email: "asha@example.com", adult: "yes" },
    });
  });

  it("refuses without the tick, even with a valid email", () => {
    expect(parseEmailLinkForm(form({ email: "asha@example.com" }))).toEqual({ ok: false, error: "adult" });
    expect(parseEmailLinkForm(form({ email: "asha@example.com", adult: "no" }))).toEqual({ ok: false, error: "adult" });
  });

  it("refuses a bad email", () => {
    expect(parseEmailLinkForm(form({ email: "not-an-email", adult: "yes" }))).toEqual({ ok: false, error: "email" });
  });
});
