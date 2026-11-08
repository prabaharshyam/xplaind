import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmOrder } from "./confirm";
import type { PaymentsConfig } from "./config";

const config: PaymentsConfig = { mode: "sandbox", appId: "app", secret: "secret", baseUrl: "https://sandbox.cashfree.com/pg" };

/** A fake service client: one payments row, and grant_pass recorded. */
function admin(row: Record<string, unknown> | null) {
  const rpc = vi.fn(async () => ({ data: "granted", error: null }));
  const update = vi.fn(() => ({ eq: () => ({ eq: async () => ({}) }) }));
  const client = {
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row }) }) }), update }),
  };
  return { client: client as never, rpc, update };
}

function cashfree(order: object | null, payments: object[] = [{ cf_payment_id: 123, payment_status: "SUCCESS" }]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.endsWith("/payments") ? payments : order;
      return body ? Response.json(body) : new Response("", { status: 404 });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

const row = { plan_id: "pass_month", amount_paise: 24_900, status: "created", environment: "sandbox" };

describe("confirmOrder (PAY-3)", () => {
  it("grants a pass only when Cashfree says the order is PAID for the plan's exact price", async () => {
    cashfree({ order_status: "PAID", order_amount: 249, order_currency: "INR" });
    const a = admin(row);
    expect(await confirmOrder(a.client, config, "xp_test_0001")).toBe("granted");
    expect(a.rpc).toHaveBeenCalledWith("grant_pass", expect.objectContaining({ p_order: "xp_test_0001", p_cf_payment: "123" }));
  });

  it("grants nothing when the amount or currency is wrong", async () => {
    for (const order of [
      { order_status: "PAID", order_amount: 1, order_currency: "INR" },
      { order_status: "PAID", order_amount: 249, order_currency: "USD" },
    ]) {
      cashfree(order);
      const a = admin(row);
      expect(await confirmOrder(a.client, config, "xp_test_0001")).toBe("unknown");
      expect(a.rpc).not.toHaveBeenCalled();
    }
  });

  it("waits while unpaid, marks expired orders failed, and does not ask Cashfree again for a paid order", async () => {
    cashfree({ order_status: "ACTIVE", order_amount: 249, order_currency: "INR" });
    expect(await confirmOrder(admin(row).client, config, "xp_test_0001")).toBe("pending");
    cashfree({ order_status: "EXPIRED", order_amount: 249, order_currency: "INR" });
    const expired = admin(row);
    expect(await confirmOrder(expired.client, config, "xp_test_0001")).toBe("failed");
    expect(expired.update).toHaveBeenCalledWith({ status: "failed" });
    cashfree(null);
    expect(await confirmOrder(admin({ ...row, status: "paid" }).client, config, "xp_test_0001")).toBe("already");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores an order from the other environment or one we never created", async () => {
    cashfree({ order_status: "PAID", order_amount: 249, order_currency: "INR" });
    expect(await confirmOrder(admin({ ...row, environment: "production" }).client, config, "xp_test_0001")).toBe("unknown");
    expect(await confirmOrder(admin(null).client, config, "xp_test_0001")).toBe("unknown");
  });
});
