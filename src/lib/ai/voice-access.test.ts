import { beforeEach, describe, expect, it, vi } from "vitest";

// VI-13: who may use the AI interviewer, with the session, settings and database replaced by fakes.
let caller = { guest: false, id: "u1", tier: "free" as "guest" | "free" | "pro" };
let open = true;
let accounts = true;
let trialRows: { calls: number }[] = [];

vi.mock("@/lib/account/http", () => ({
  problem: (status: number, message: string) => Response.json({ error: message }, { status }),
  json: (body: unknown, status = 200) => Response.json(body, { status }),
}));
vi.mock("@/lib/billing/config", () => ({ proOpen: () => open }));
vi.mock("@/lib/supabase/config", () => ({ accountsEnabled: () => accounts }));
vi.mock("./settings", () => ({ aiSettings: () => ({ monthlyCapUsd: 20 }) }));
vi.mock("@/lib/supabase/server", () => {
  const q = { eq: () => q, then: (ok: (v: { data: unknown }) => unknown) => Promise.resolve({ data: trialRows }).then(ok) };
  return { serviceClient: () => ({ from: () => ({ select: () => q }) }) };
});
vi.mock("./who", () => ({
  aiCaller: async () => caller,
  onTrial: (who: typeof caller) => !who.guest && who.tier === "free" && open,
  allowanceToday: async () => 1,
}));

const { voiceAccess, trialLeft } = await import("./voice-access");

beforeEach(() => {
  caller = { guest: false, id: "u1", tier: "free" };
  open = true;
  accounts = true;
  trialRows = [];
});

describe("who may use the AI interviewer (VI-3, VI-13)", () => {
  it("gives a free account its free interview while Pro is open", async () => {
    const access = await voiceAccess();
    expect(access).not.toBeInstanceOf(Response);
    expect((access as { trial: boolean }).trial).toBe(true);
  });

  it("gives a free account nothing before Pro opens, when every account shares one set of limits", async () => {
    open = false;
    const res = (await voiceAccess()) as Response;
    expect(res.status).toBe(403);
  });

  it("asks a signed-out visitor to sign in (AG-1, PV-2)", async () => {
    caller = { guest: true, id: "hash", tier: "guest" };
    const res = (await voiceAccess()) as Response;
    expect(res.status).toBe(401);
  });

  it("gives Pro the full interviewer, not the trial", async () => {
    caller = { guest: false, id: "u1", tier: "pro" };
    expect(((await voiceAccess()) as { trial: boolean }).trial).toBe(false);
  });

  it("keeps planning from a job description for Pro, also during the free interview", async () => {
    const res = (await voiceAccess({ proOnly: "Pro only." })) as Response;
    expect(res.status).toBe(403);
  });

  it("counts the free interview as used once any report was asked for, even one that failed", async () => {
    const access = await voiceAccess();
    if (access instanceof Response) throw new Error("expected access");
    expect(await trialLeft(access)).toBe(true);
    trialRows = [{ calls: 1 }];
    expect(await trialLeft(access)).toBe(false);
  });
});
