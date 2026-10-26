import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// The guarded runner with the database, the session and the SDK replaced by fakes.
const rpc = vi.fn();
const create = vi.fn();
let profile: { id: string } | null = { id: "u1" };

vi.mock("@/lib/account/http", () => ({
  problem: (status: number, message: string) => Response.json({ error: message }, { status }),
  rateLimit: async () => null,
  requireSession: async () => ({
    user: { id: "u1", email: null },
    client: {},
    admin: { rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }) }) },
  }),
}));

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
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubEnv("AI_KILL_SWITCH", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_MONTHLY_CAP_USD", "");
  profile = { id: "u1" };
  rpc.mockReset();
  create.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("runAi (CO-1, SC-5, PV-2)", () => {
  it("returns checked output and records tokens and cost", async () => {
    rpc.mockResolvedValueOnce({ data: "ok", error: null }).mockResolvedValueOnce({ data: null, error: null });
    create.mockResolvedValue(reply('{"answer":"42"}'));
    const out = await runAi(req);
    expect(out).toEqual({ data: { answer: "42" } });
    expect(rpc.mock.calls[0][0]).toBe("ai_reserve");
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_kind: "tutor", p_daily_max: 30, p_month_cap_usd: 20 });
    expect(rpc.mock.calls[1]).toEqual(["ai_record", expect.objectContaining({ p_tokens_in: 1000, p_tokens_out: 100, p_cost_usd: 0.006 })]);
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-opus-5-5", fallbacks: "default", output_config: { effort: "low" } });
  });

  it("never calls the model when the kill switch is on", async () => {
    vi.stubEnv("AI_KILL_SWITCH", "true");
    const out = (await runAi(req)) as Response;
    expect(out.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("never calls the model without an 18+ profile", async () => {
    profile = null;
    expect(((await runAi(req)) as Response).status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses at the daily or monthly cap with a friendly message, and when the guard cannot be checked", async () => {
    rpc.mockResolvedValueOnce({ data: "day", error: null });
    const day = (await runAi(req)) as Response;
    expect(day.status).toBe(429);
    expect((await day.json()).error).toMatch(/tomorrow/);
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
