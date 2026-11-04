import { describe, expect, it } from "vitest";
import { makeGoogleNonce, sha256Hex } from "./google-nonce";

// AC-1a: Google signs the hash of the nonce; Supabase gets the raw one and checks they match.
describe("Google sign-in nonce", () => {
  it("is a fresh random value with its SHA-256 alongside", async () => {
    const a = await makeGoogleNonce();
    const b = await makeGoogleNonce();
    expect(a.raw).toMatch(/^[0-9a-f]{64}$/);
    expect(a.raw).not.toBe(b.raw);
    expect(a.hashed).toBe(await sha256Hex(a.raw));
  });

  it("hashes like the standard SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
