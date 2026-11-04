// AC-1a: a one-time nonce for Sign in with Google. Google signs the SHA-256 of it into the ID
// token; the raw value goes to our server, and Supabase checks that the two match, so a token
// caught elsewhere cannot be replayed. Works in browsers and in Node (Web Crypto).

const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function makeGoogleNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = hex(crypto.getRandomValues(new Uint8Array(32)));
  return { raw, hashed: await sha256Hex(raw) };
}

export async function sha256Hex(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}
