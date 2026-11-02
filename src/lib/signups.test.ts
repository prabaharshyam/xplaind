import { describe, expect, it } from "vitest";
import { signupsOnHold } from "./signups";

describe("sign-up hold (SU-4)", () => {
  it("is on unless sign-ups are opened in the host's settings", () => {
    for (const v of [undefined, "", "false", "0", "no", "later"]) expect(signupsOnHold(v)).toBe(true);
    for (const v of ["true", "1", "on", "yes", " TRUE "]) expect(signupsOnHold(v)).toBe(false);
  });
});
