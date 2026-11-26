import { expect, test } from "@playwright/test";

test("the home page shows what early users said (SO-1)", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "What early learners say" });
  await expect(section.getByText("Rajakumar", { exact: true })).toBeVisible();
  await expect(section.getByText("Program Manager at MNC")).toBeVisible();
  await expect(section.locator("figure")).toHaveCount(5);
});

test("the testimonials are a sideways row with short excerpts and a way to read more (SO-1, BR-4)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const row = page.getByRole("list", { name: "Testimonials, scroll sideways" });
  await row.scrollIntoViewIfNeeded();
  // the short version first, the whole quote on request
  await expect(page.getByText("It gives me the clarity and direction I need")).toHaveCount(0);
  await page.getByRole("button", { name: "Read more from Rajakumar" }).click();
  await expect(page.getByText("It gives me the clarity and direction I need to build my skills and grow my career.")).toBeVisible();
  await page.getByRole("button", { name: "Show less from Rajakumar" }).click();
  await expect(page.getByText("It gives me the clarity and direction I need")).toHaveCount(0);
  // the arrow moves the row sideways
  const before = await row.evaluate((el) => el.scrollLeft);
  await page.getByRole("button", { name: "Next testimonials" }).click();
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
});

test("the Stay on track card shows an example week, so it is not empty (BR-4)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your week · 5 hours")).toBeVisible();
  await expect(page.getByText("7 day streak")).toBeVisible();
});

test("roadmap, topic and project cards carry a line graphic, not just a small icon (BR-4)", async ({ page }) => {
  const scene = 'svg[viewBox="0 0 300 110"]';
  await page.goto("/paths");
  await expect(page.locator(scene)).toHaveCount(10);
  await page.goto("/library?view=topics");
  // The By topic view appears once the page has read its address, so wait for a card before counting.
  await expect(page.getByRole("link", { name: /^Agents/ }).first()).toBeVisible();
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
  await page.goto("/projects");
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
});

test("on a phone the level-check link starts its own line under 'Choose your AI role' (HM-3)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const lead = page.getByText("One roadmap per job. Not sure?");
  await lead.scrollIntoViewIfNeeded();
  const link = lead.getByRole("link", { name: "Take the 2-minute level check" });
  const box = (await link.boundingBox())!;
  const text = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((x) => x.textContent?.startsWith("One roadmap per job"))!;
    const r = document.createRange();
    r.setStart(p.firstChild!, 0);
    r.setEnd(p.firstChild!, p.firstChild!.textContent!.length);
    const rects = r.getClientRects();
    return rects[rects.length - 1].bottom;
  });
  expect(box.y).toBeGreaterThanOrEqual(text - 1); // the link sits below the sentence before it
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("'Choose your AI role' stays on one line on phones, with 'Compare all roles' under it on the left (HM-4)", async ({ page }) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const h = page.locator("#roles-heading");
    await h.scrollIntoViewIfNeeded();
    const lines = await h.evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
    expect(lines, `${width}px`).toBe(1);
    const hb = (await h.boundingBox())!;
    const cb = (await page.locator("#roles").getByRole("link", { name: "Compare all roles →" }).boundingBox())!;
    expect(cb.y).toBeGreaterThan(hb.y + hb.height - 2); // under the heading
    expect(Math.abs(cb.x - hb.x)).toBeLessThan(2); // on the left edge, not pushed right
  }
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/");
  const h = (await page.locator("#roles-heading").boundingBox())!;
  const c = (await page.locator("#roles").getByRole("link", { name: "Compare all roles →" }).boundingBox())!;
  expect(c.x).toBeGreaterThan(h.x + h.width); // from 640 px up it sits beside the heading, on the right
});

test("opening the site on consecutive days builds the header streak, even with no lesson finished (ST-1)", async ({ page }) => {
  const day = (back: number) => new Date(Date.now() + 5.5 * 3600_000 - back * 86_400_000).toISOString().slice(0, 10);
  await page.addInitScript((days) => {
    if (!localStorage.getItem("xplaind.visits.v1")) localStorage.setItem("xplaind.visits.v1", JSON.stringify({ version: 1, days }));
  }, [day(3), day(2), day(1)]);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  // Three earlier days plus today is a four-day streak; the visitor chip appears from two days.
  await expect(page.getByRole("banner").getByRole("link", { name: /4\s*-day streak/ })).toBeVisible({ timeout: 20_000 });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("xplaind.visits.v1")!).days.length);
  expect(stored).toBe(4);
});

test("the visit endpoint needs a signed-in learner (ST-1)", async ({ request }) => {
  const res = await request.post("/api/visit");
  expect([401, 503]).toContain(res.status());
});

test("the Zarina note is three plain lines on a phone, with 'Try it now' on its own (HM-6)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  const link = page.locator(".home-hero").getByRole("link", { name: /AI mock interviews that score you/ });
  await expect(link).toBeVisible();
  const lines = await link.evaluate((a) => [...a.children].map((c) => Math.round(c.getBoundingClientRect().height / parseFloat(getComputedStyle(c).lineHeight))));
  expect(lines).toEqual([1, 1, 1]); // New, the sentence, and the call to action: one line each, nothing wrapped
  const tryIt = await link.getByText("Try it now").boundingBox();
  const sentence = await link.getByText("AI mock interviews that score you.").boundingBox();
  expect(tryIt!.y).toBeGreaterThan(sentence!.y + sentence!.height - 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
