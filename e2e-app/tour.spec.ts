import { test } from "./signed-in";

// APP-0: screenshots of the signed-in screens for review (not assertions). Run with SHOTS=1.
const PAGES = ["/dashboard", "/paths", "/roadmap/ai-engineer", "/stop/rag-app", "/library", "/practice", "/interview", "/interview/simulator", "/interview/prep", "/ai", "/ai/book", "/ai/tutor", "/ai/resume", "/plan", "/playground", "/jobs", "/settings", "/"];

test("signed-in screens", async ({ page }) => {
  test.skip(!process.env.SHOTS, "screenshots only on request");
  test.setTimeout(240_000);
  const w = page.viewportSize()!.width;
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `test-results/shots/${w}${path.replace(/\W+/g, "_") || "_home"}.png`, fullPage: true });
  }
});
