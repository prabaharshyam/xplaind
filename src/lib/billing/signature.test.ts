import { describe, expect, it } from "vitest";
import { signWebhook, webhookIsGenuine } from "./signature";

const secret = "test_secret";
const body = '{"data":{"order":{"order_id":"xp_abc_123","order_amount":249.00}},"type":"PAYMENT_SUCCESS_WEBHOOK"}';
const now = 1_762_600_000_000;
const ts = String(now);

describe("Cashfree webhook signature (PAY-3)", () => {
  it("accepts the body exactly as signed", () => {
    expect(webhookIsGenuine(body, ts, signWebhook(body, ts, secret), secret, now)).toBe(true);
  });

  it("refuses a changed body, a wrong secret, a missing header or an old timestamp", () => {
    const sig = signWebhook(body, ts, secret);
    expect(webhookIsGenuine(body.replace("249.00", "1.00"), ts, sig, secret, now)).toBe(false);
    expect(webhookIsGenuine(body, ts, signWebhook(body, ts, "other"), secret, now)).toBe(false);
    expect(webhookIsGenuine(body, null, sig, secret, now)).toBe(false);
    expect(webhookIsGenuine(body, ts, null, secret, now)).toBe(false);
    expect(webhookIsGenuine(body, ts, sig, secret, now + 10 * 60_000)).toBe(false);
  });

  it("accepts a timestamp in seconds as well as milliseconds", () => {
    const secs = String(now / 1000);
    expect(webhookIsGenuine(body, secs, signWebhook(body, secs, secret), secret, now)).toBe(true);
  });
});
