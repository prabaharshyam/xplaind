import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("a roadmap downloads as a printable checklist after the learner gives their details (RD-1, RD-2)", async ({ page }) => {
  await page.goto("/roadmap/ai-product-manager");
  await page.getByRole("button", { name: "Download as a printable checklist (PDF)" }).click();
  const form = page.getByRole("region", { name: "Get the AI Product Manager checklist" });
  await expect(form).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  await form.getByRole("button", { name: "Save and download" }).click();
  await expect(form.getByRole("alert")).toHaveText("Please enter your name.");
  await form.getByLabel("Name", { exact: true }).fill("Asha Rao");
  await form.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await form.getByLabel("Phone (optional)").fill("12");
  await form.getByLabel("Professional experience").selectOption("fresher");
  await form.getByRole("checkbox", { name: /Xplaind may keep my details/ }).check();
  await form.getByRole("button", { name: "Save and download" }).click();
  await expect(form.getByRole("alert")).toContainText("10-digit mobile number");
  await form.getByLabel("Phone (optional)").fill("");

  const first = page.waitForEvent("download");
  await form.getByRole("button", { name: "Save and download" }).click();
  expect((await first).suggestedFilename()).toBe("xplaind-ai-product-manager-checklist.pdf");
  await expect(form).toBeHidden();

  // Details are asked once per device.
  const again = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download as a printable checklist (PDF)" }).click();
  expect((await again).suggestedFilename()).toBe("xplaind-ai-product-manager-checklist.pdf");
});

test("an under-18 learner downloads the checklist without giving any details (PV-2)", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => r.method() === "POST" && posts.push(r.url()));
  await page.goto("/roadmap/genai-engineer");
  await page.getByRole("button", { name: "Download as a printable checklist (PDF)" }).click();
  await page.getByRole("checkbox", { name: "I am under 18" }).check();
  await expect(page.getByLabel("Email")).toHaveCount(0);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my checklist" }).click();
  expect((await dl).suggestedFilename()).toBe("xplaind-genai-engineer-checklist.pdf");
  expect(posts.filter((u) => u.includes("/api/roadmap-download"))).toEqual([]);
});

test("the download API checks details and says when saving is not switched on", async ({ request }) => {
  const ok = { pathId: "genai-engineer", name: "Asha", email: "asha@example.com", phone: "", experience: "student", consent: true };
  expect((await request.post("/api/roadmap-download", { data: { ...ok, consent: false } })).status()).toBe(400);
  expect((await request.post("/api/roadmap-download", { data: { ...ok, pathId: "nope" } })).status()).toBe(400);
  expect((await request.post("/api/roadmap-download", { data: ok })).status()).toBe(503);
});

test("the form only blames the connection when the server cannot be reached", async ({ page }) => {
  const fill = async () => {
    const form = page.getByRole("region", { name: "Get the Generative AI & LLM Engineer checklist" });
    await form.getByLabel("Name", { exact: true }).fill("Asha Rao");
    await form.getByLabel("Email", { exact: true }).fill("asha@example.com");
    await form.getByLabel("Professional experience").selectOption("student");
    await form.getByRole("checkbox", { name: /Xplaind may keep my details/ }).check();
    await form.getByRole("button", { name: "Save and download" }).click();
    return form.getByRole("alert");
  };
  await page.goto("/roadmap/genai-engineer");
  await page.getByRole("button", { name: "Download as a printable checklist (PDF)" }).click();

  await page.route("**/api/roadmap-download", (r) => r.fulfill({ status: 500, body: "" }));
  await expect(await fill()).toHaveText("We could not save your details just now. Please try again later.");

  await page.unroute("**/api/roadmap-download");
  await page.route("**/api/roadmap-download", (r) => r.abort());
  await expect(await fill()).toHaveText("Could not reach Xplaind. Check your connection and try again.");
});
