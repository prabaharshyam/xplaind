import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// The guarded runner with the database, the session and the SDK replaced by fakes.
const rpc = vi.fn();
const create = vi.fn();
const rateLimitMock = vi.hoisted(() => vi.fn(async (...args: unknown[]) => (args.length >= 0 ? null : null)));
let profile: { id: string } | null = { id: "u1" };
let user: { id: string; email: null } | null = { id: "u1", email: null };
/** PAY-7: rows of earlier days' usage of one feature, for the free trial. */
let pastUsage: { calls: number }[] = [];

/** A chainable fake query: .eq() and .lt() keep chaining, .maybeSingle() gives the profile, awaiting gives usage rows. */
function query() {
  const q = {
    eq: () => q,
    lt: () => q,
    maybeSingle: async () => ({ data: profile }),
    then: (ok: (v: { data: unknown }) => unknown) => Promise.resolve({ data: pastUsage }).then(ok),
  };
  return q;
}

vi.mock("@/lib/account/http", () => ({
  problem: (status: number, message: string) => Response.json({ error: message }, { status }),
  json: (body: unknown, status = 200) => Response.json(body, { status }),
  rateLimit: rateLimitMock,
  visitorKey: () => "visitor-hash",
}));
vi.mock("@/lib/supabase/server", () => ({
  serviceClient: () => ({ rpc, from: () => ({ select: () => query() }) }),
  userClient: async () => ({}),
  currentUser: async () => user,
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
/** PAY-13: whether the Pro learner's 30-day AI allowance is used up. */
let allowanceUsed = false;
vi.mock("./allowance", () => ({ proAllowanceUsed: async () => allowanceUsed }));

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class Anthropic {
    static APIError = APIError;
    static RateLimitError = class extends APIError {};
    static InternalServerError = class extends APIError {};
    static APIConnectionError = class extends APIError {};
    beta = { messages: { create } };
  }
  return { default: Anthropic };
});

const { runAi } = await import("./run");

const schema = z.object({ answer: z.string() });
const req = { kind: "tutor" as const, system: "s", messages: [{ role: "user" as const, content: "hi" }], schema, maxTokens: 100, effort: "low" as const };
const reply = (text: string, extra: object = {}) => ({
  stop_reason: "end_turn",
  content: [{ type: "text", text }],
  usage: { input_tokens: 1000, output_tokens: 100, iterations: null },
  ...extra,
});

beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "true");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubEnv("AI_KILL_SWITCH", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_MONTHLY_CAP_USD", "");
  profile = { id: "u1" };
  user = { id: "u1", email: null };
  rpc.mockReset();
  create.mockReset();
  rateLimitMock.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("runAi (CO-1, SC-5, PV-2)", () => {
  it("stops a Pro learner whose 30-day AI allowance is used up, before any money is spent (PAY-13)", async () => {
    allowanceUsed = true;
    const res = (await runAi({ ...req, caller: { guest: false, id: "u1", tier: "pro" } })) as Response;
    allowanceUsed = false;
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/AI allowance for the last 30 days/);
    expect(create).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("logs a failed cost record instead of losing it silently (CO-1, 20 Nov 2026)", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValueOnce({ data: "ok", error: null }).mockResolvedValueOnce({ data: null, error: { message: "function not found" } });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    expect(await runAi(req)).toEqual({ data: { answer: "42" }, tier: "free" });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("ai_record failed for tutor: function not found"));
    log.mockRestore();
  });

  it("returns checked output and records tokens and cost", async () => {
    rpc.mockResolvedValueOnce({ data: "ok", error: null }).mockResolvedValueOnce({ data: null, error: null });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    const out = await runAi(req);
    expect(out).toEqual({ data: { answer: "42" }, tier: "free" });
    expect(rpc.mock.calls[0][0]).toBe("ai_reserve");
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_kind: "tutor", p_daily_max: 40, p_month_cap_usd: 20 });
    // PAY-1: the tutor runs on the fast model, which has no server-side fallback.
    expect(rpc.mock.calls[1]).toEqual(["ai_record", expect.objectContaining({ p_tokens_in: 1000, p_tokens_out: 100, p_cost_usd: 0.00015 })]);
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-haiku-5-5", output_config: { effort: "low" } });
    expect(create.mock.calls[0][0]).not.toHaveProperty("fallbacks");
  });

  it("allows 6 calls a minute by default, and a request can ask for more (MB-12 reads picture pages in batches)", async () => {
    rpc.mockResolvedValue({ data: "ok", error: null });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    await runAi(req);
    expect(rateLimitMock.mock.calls[0]).toEqual([expect.anything(), "ai:u1", 60, 6]);
    await runAi({ ...req, burst: 12 });
    expect(rateLimitMock.mock.calls[1]).toEqual([expect.anything(), "ai:u1", 60, 12]);
  });

  it("keeps the main model, with its fallback, for grading (PAY-1)", async () => {
    rpc.mockResolvedValueOnce({ data: "ok", error: null }).mockResolvedValueOnce({ data: null, error: null });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    await runAi({ ...req, kind: "grade" });
    expect(rpc.mock.calls[1]).toEqual(["ai_record", expect.objectContaining({ p_cost_usd: 0.006 })]);
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default" });
  });

  it("gives a free account a one-time trial once Pro is open, counted across days, then offers a pass (PAY-7)", async () => {
    vi.stubEnv("PAYMENTS_MODE", "sandbox");
    vi.stubEnv("CASHFREE_APP_ID", "app");
    vi.stubEnv("CASHFREE_SECRET_KEY", "secret");
    pastUsage = [{ calls: 1 }, { calls: 1 }];
    rpc.mockResolvedValueOnce({ data: "day", error: null });
    const res = (await runAi(req)) as Response;
    // The tutor trial is 3; two were used on earlier days, so one is left today.
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_kind: "tutor", p_daily_max: 1 });
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ upgrade: "/pricing", error: expect.stringMatching(/last free try/) });
    expect(create).not.toHaveBeenCalled();
    pastUsage = [];
  });

  it("never calls the model when the kill switch is on", async () => {
    vi.stubEnv("AI_KILL_SWITCH", "true");
    const out = (await runAi(req)) as Response;
    expect(out.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("treats a visitor without an account as a guest with their own allowance while sign-ups are on hold (SU-5)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "");
    user = null;
    rpc.mockResolvedValueOnce({ data: "ok", error: null }).mockResolvedValueOnce({ data: null, error: null });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    expect(await runAi(req)).toEqual({ data: { answer: "42" }, tier: "guest" });
    expect(rpc.mock.calls[0]).toEqual(["ai_reserve_guest", expect.objectContaining({ p_visitor: "visitor-hash", p_kind: "tutor", p_month_cap_usd: 20 })]);
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("p_user");
    expect(rpc.mock.calls[1]).toEqual(["ai_record_guest", expect.objectContaining({ p_visitor: "visitor-hash", p_tokens_in: 1000 })]);
  });

  it("counts a signed-in learner without an 18+ profile, and everyone during the sign-up hold, as a guest", async () => {
    profile = null;
    rpc.mockResolvedValue({ data: "day", error: null });
    expect(((await runAi(req)) as Response).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    vi.stubEnv("NEXT_PUBLIC_SIGNUPS_OPEN", "");
    profile = { id: "u1" };
    expect(((await runAi(req)) as Response).status).toBe(429);
    expect(rpc.mock.calls[0][0]).toBe("ai_reserve_guest");
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses AI to a visitor without an account once sign-ups are open, spending nothing (AG-1)", async () => {
    user = null;
    const res = (await runAi(req)) as Response;
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ signin: true, error: expect.stringMatching(/part of Pro. Create a free account/) });
    expect(rpc).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("is off without the database for the spend guard, even with a key", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(((await runAi(req)) as Response).status).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses at the daily or monthly cap with a friendly message, and when the guard cannot be checked", async () => {
    rpc.mockResolvedValueOnce({ data: "day", error: null });
    const day = (await runAi(req)) as Response;
    expect(day.status).toBe(429);
    expect((await day.json()).error).toMatch(/resets at midnight India time/);
    rpc.mockResolvedValueOnce({ data: "month", error: null });
    const month = (await runAi(req)) as Response;
    expect(month.status).toBe(429);
    expect((await month.json()).error).toMatch(/resets on the 1st/);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "down" } });
    expect(((await runAi(req)) as Response).status).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });

  it("records usage even when the output fails the schema, or the model refuses", async () => {
    rpc.mockResolvedValue({ data: "ok", error: null });
    create.mockResolvedValueOnce(reply("not json"));
    expect(((await runAi(req)) as Response).status).toBe(502);
    create.mockResolvedValueOnce(reply("", { stop_reason: "refusal" }));
    expect(((await runAi(req)) as Response).status).toBe(422);
    expect(rpc.mock.calls.filter((c) => c[0] === "ai_record")).toHaveLength(2);
  });

  it("uses the model and cap from settings", async () => {
    vi.stubEnv("AI_MODEL", "claude-haiku-5-5");
    vi.stubEnv("AI_MONTHLY_CAP_USD", "5");
    rpc.mockResolvedValue({ data: "ok", error: null });
    create.mockResolvedValue(reply('{"answer":"x"}'));
    await runAi(req);
    expect(create.mock.calls[0][0].model).toBe("claude-haiku-5-5");
    expect(rpc.mock.calls[0][1].p_month_cap_usd).toBe(5);
  });
});
