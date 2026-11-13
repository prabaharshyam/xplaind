import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { activePayments, paymentProvider, paymentsConfig, razorpayConfig, type RazorpayConfig } from "./config";
import { checkoutIsGenuine, checkoutSignature, confirmRazorpay, createRazorpayOrder, webhookIsGenuine } from "./razorpay";

// Fake keys for tests only; real keys live in the host's settings (SC-1).
const config: RazorpayConfig = { mode: "sandbox", keyId: "rzp_test_FAKEKEY000", secret: "fake_secret", webhookSecret: "fake_hook" };

describe("Razorpay settings (RZ-1)", () => {
  const keys = { RAZORPAY_KEY_ID: "rzp_test_abc", RAZORPAY_KEY_SECRET: "s" };

  it("uses Razorpay when its keys are set, unless PAYMENTS_PROVIDER says otherwise", () => {
    expect(paymentProvider({ ...keys } as unknown as NodeJS.ProcessEnv)).toBe("razorpay");
    expect(paymentProvider({ ...keys, PAYMENTS_PROVIDER: "cashfree" } as unknown as NodeJS.ProcessEnv)).toBe("cashfree");
    expect(paymentProvider({} as unknown as NodeJS.ProcessEnv)).toBe("cashfree");
  });

  it("stays closed until PAYMENTS_MODE is set, and the key's test or live prefix must match it", () => {
    expect(razorpayConfig({ ...keys } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(razorpayConfig({ ...keys, PAYMENTS_MODE: "sandbox" } as unknown as NodeJS.ProcessEnv)?.mode).toBe("sandbox");
    expect(razorpayConfig({ ...keys, PAYMENTS_MODE: "production" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(razorpayConfig({ RAZORPAY_KEY_ID: "rzp_live_abc", RAZORPAY_KEY_SECRET: "s", PAYMENTS_MODE: "production" } as unknown as NodeJS.ProcessEnv)?.mode).toBe("production");
  });

  it("never runs both gateways at once", () => {
    const env = { ...keys, PAYMENTS_MODE: "sandbox", CASHFREE_APP_ID: "a", CASHFREE_SECRET_KEY: "b" } as unknown as NodeJS.ProcessEnv;
    expect(paymentsConfig(env)).toBeNull();
    expect(activePayments(env)).toEqual({ provider: "razorpay", mode: "sandbox" });
  });
});

describe("Razorpay signatures (RZ-1)", () => {
  it("accepts the checkout signature only for the exact order, payment and secret", () => {
    const sig = createHmac("sha256", "fake_secret").update("order_ABC123|pay_XYZ789").digest("hex");
    expect(checkoutSignature("order_ABC123", "pay_XYZ789", "fake_secret")).toBe(sig);
    expect(checkoutIsGenuine("order_ABC123", "pay_XYZ789", sig, "fake_secret")).toBe(true);
    expect(checkoutIsGenuine("order_ABC123", "pay_OTHER0", sig, "fake_secret")).toBe(false);
    expect(checkoutIsGenuine("order_ABC123", "pay_XYZ789", sig, "other_secret")).toBe(false);
    expect(checkoutIsGenuine("order_ABC123", "pay_XYZ789", "not-hex", "fake_secret")).toBe(false);
  });

  it("checks webhook bodies against the webhook secret", () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac("sha256", "fake_hook").update(body).digest("hex");
    expect(webhookIsGenuine(body, sig, "fake_hook")).toBe(true);
    expect(webhookIsGenuine(`${body} `, sig, "fake_hook")).toBe(false);
    expect(webhookIsGenuine(body, null, "fake_hook")).toBe(false);
  });
});

/** A fake service client: one payments row, and grant_pass recorded. */
function admin(row: Record<string, unknown> | null) {
  const rpc = vi.fn(async () => ({ data: "granted", error: null }));
  const client = { rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row }) }) }) }) };
  return { client: client as never, rpc };
}

/** Fakes Razorpay: one order, one payment, and capture. */
function razorpay(order: object | null, payment: Record<string, unknown> | null) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/capture")) return Response.json({ ...payment, status: "captured" });
    if (url.includes("/payments/")) return payment ? Response.json(payment) : new Response("", { status: 404 });
    if (url.endsWith("/orders") && init?.method === "POST") return Response.json({ id: "order_NEW123", amount: 24_900, currency: "INR", receipt: "xp_test_0001", status: "created" });
    return order ? Response.json(order) : new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => vi.unstubAllGlobals());

const row = { plan_id: "pass_month", amount_paise: 24_900, status: "created", environment: "sandbox" };
const order = { id: "order_ABC123", amount: 24_900, currency: "INR", receipt: "xp_test_0001", status: "paid" };
const captured = { id: "pay_XYZ789", order_id: "order_ABC123", amount: 24_900, currency: "INR", status: "captured" };

describe("createRazorpayOrder (RZ-1)", () => {
  it("refuses amounts under ₹1 without calling Razorpay, and sends our order id as the receipt", async () => {
    const f = razorpay(null, null);
    expect(await createRazorpayOrder(config, { amountPaise: 99, receipt: "xp_test_0001", notes: {} })).toEqual({ ok: false, status: 400 });
    expect(f).not.toHaveBeenCalled();
    const made = await createRazorpayOrder(config, { amountPaise: 24_900, receipt: "xp_test_0001", notes: { plan: "pass_month" } });
    expect(made.ok).toBe(true);
    const [, init] = f.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ amount: 24_900, currency: "INR", receipt: "xp_test_0001", notes: { plan: "pass_month" } });
    expect(String((init?.headers as Record<string, string>).Authorization)).toMatch(/^Basic /);
  });

  it("reports Razorpay's status on failure, so wrong keys (401) can be told apart", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 401 })));
    expect(await createRazorpayOrder(config, { amountPaise: 24_900, receipt: "xp_test_0001", notes: {} })).toEqual({ ok: false, status: 401 });
  });
});

describe("confirmRazorpay (RZ-1)", () => {
  it("grants a pass for a captured payment on our order at the plan's exact price", async () => {
    razorpay(order, captured);
    const a = admin(row);
    expect(await confirmRazorpay(a.client, config, "order_ABC123", "pay_XYZ789")).toEqual({ result: "granted", orderId: "xp_test_0001" });
    expect(a.rpc).toHaveBeenCalledWith("grant_pass", expect.objectContaining({ p_order: "xp_test_0001", p_cf_payment: "pay_XYZ789" }));
  });

  it("captures an authorised payment before granting", async () => {
    const f = razorpay(order, { ...captured, status: "authorized" });
    expect((await confirmRazorpay(admin(row).client, config, "order_ABC123", "pay_XYZ789")).result).toBe("granted");
    expect(f.mock.calls.some(([url]) => String(url).endsWith("/capture"))).toBe(true);
  });

  it("grants nothing for a wrong amount, a payment from another order, or another environment", async () => {
    for (const [o, p, r] of [
      [{ ...order, amount: 100 }, captured, row],
      [order, { ...captured, order_id: "order_OTHER1" }, row],
      [order, captured, { ...row, environment: "production" }],
    ] as const) {
      razorpay(o, p);
      const a = admin(r);
      expect(["unknown", "pending"]).toContain((await confirmRazorpay(a.client, config, "order_ABC123", "pay_XYZ789")).result);
      expect(a.rpc).not.toHaveBeenCalled();
    }
  });

  it("accepts a promo order only at the plan price after its own discount (PAY-9)", async () => {
    const half = { ...row, amount_paise: 12_450, discount_percent: 50 };
    razorpay({ ...order, amount: 12_450 }, { ...captured, amount: 12_450 });
    expect((await confirmRazorpay(admin(half).client, config, "order_ABC123", "pay_XYZ789")).result).toBe("granted");
    // A row whose discount was tampered with no longer matches its amount.
    razorpay({ ...order, amount: 12_450 }, { ...captured, amount: 12_450 });
    const wrong = admin({ ...half, discount_percent: 90 });
    expect((await confirmRazorpay(wrong.client, config, "order_ABC123", "pay_XYZ789")).result).toBe("unknown");
    expect(wrong.rpc).not.toHaveBeenCalled();
  });

  it("reports failed payments, and does not grant twice", async () => {
    razorpay(order, { ...captured, status: "failed" });
    expect((await confirmRazorpay(admin(row).client, config, "order_ABC123", "pay_XYZ789")).result).toBe("failed");
    razorpay(order, captured);
    const paid = admin({ ...row, status: "paid" });
    expect((await confirmRazorpay(paid.client, config, "order_ABC123", "pay_XYZ789")).result).toBe("already");
    expect(paid.rpc).not.toHaveBeenCalled();
  });
});
