import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const wcag = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the pricing page leads with value, shows honest savings, a free-vs-Pro table and folded questions (PAY-5, PAY-7, PAY-8)", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: "Learn AI faster with Pro" })).toBeVisible();
  for (const price of ["₹249", "₹999", "₹1,499"]) await expect(page.getByText(price, { exact: true }).first()).toBeVisible();
  // PAY-8: savings only against the real monthly price, and the price per day.
  await expect(page.getByText("Save 33% compared with 6 monthly passes")).toBeVisible();
  await expect(page.getByText("Save 50% compared with 12 monthly passes")).toBeVisible();
  await expect(page.locator("s", { hasText: "₹1,494" })).toBeVisible();
  await expect(page.getByText("₹5.5 a day")).toBeVisible();
  await expect(page.getByText("Recommended")).toBeVisible();
  // PAY-7: a free account gets a one-time trial of each AI helper; Pro is per day.
  const table = page.getByRole("table", { name: "AI helper uses: free trial in total, Pro per day" });
  await expect(table.getByRole("row", { name: /AI tutor questions 3 tries in total 50 every day/ })).toBeVisible();
  // Questions are folded: the answer shows only after opening the question.
  const q = page.locator("details", { hasText: "Does it renew by itself?" });
  await expect(q.getByText(/A pass is one payment/)).toBeHidden();
  await q.locator("summary").click();
  await expect(q.getByText(/A pass is one payment/)).toBeVisible();
  // BIZ-1: what is sold, by whom and how it is delivered stays on the page, at the end. Pro is closed in
  // this build (no PAYMENTS_MODE): prices stay visible, with a clear notice and no buy buttons.
  await expect(page.getByRole("heading", { name: "What you can buy" })).toBeVisible();
  await expect(page.getByText(/Sold by ZEREH Venture \(GSTIN 33GDZPS4274J1ZK\)/)).toBeVisible();
  await expect(page.getByText(/Online payment for passes opens shortly/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Buy for/ })).toHaveCount(0);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the refund policy and terms describe passes (PAY-6)", async ({ page }) => {
  await page.goto("/refunds");
  await expect(page.getByRole("heading", { level: 1, name: "Refunds and cancellations" })).toBeVisible();
  await expect(page.getByText(/within 7 days of buying/).first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Pro passes" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByText("Cashfree Payments")).toBeVisible();
});

test("lessons, roadmaps and the playground stay open without signing in (PAY-1)", async ({ page }) => {
  for (const [path, heading] of [
    ["/stop/what-is-ai", /What AI, machine learning/],
    ["/roadmap/genai-engineer", /./],
    ["/playground", /./],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Today's AI turns are used")).toBeHidden();
  }
});

test("the contact page, the footer and the policies name the business and how to reach it (BIZ-1)", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1, name: "Talk to us" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "hello@xplaind.in" })).toHaveAttribute("href", "mailto:hello@xplaind.in");
  await expect(main.getByRole("link", { name: "+91 8608761359" })).toHaveAttribute("href", "tel:+918608761359");
  await expect(main.getByText("33GDZPS4274J1ZK")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText(/Xplaind is a brand of ZEREH Venture/)).toBeVisible();
  for (const [name, href] of [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds and cancellations", "/refunds"], ["Pricing", "/pricing"], ["Contact", "/contact"]] as const) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }

  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Who we are" })).toBeVisible();
  await page.goto("/refunds");
  await expect(page.getByRole("heading", { name: "Delivery" })).toBeVisible();
});

test("the Razorpay order and verify APIs stay shut while payments are off, and reject bad input (RZ-1)", async ({ request }) => {
  expect((await request.post("/api/billing/create-order", { data: { planId: "pass_month", agree: true } })).status()).toBe(503);
  expect((await request.post("/api/billing/verify-payment", { data: { razorpay_order_id: "order_ABC123456" } })).status()).toBe(503);
  expect((await request.post("/api/billing/razorpay-webhook", { data: {} })).status()).toBe(503);
});
