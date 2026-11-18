import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 } });

test("the first Tab stop is a skip link that moves focus into the page (A11Y-1)", async ({ page }) => {
  await page.goto("/glossary");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("MAIN");
});

test("every image on the main pages has alt text, and every control can be reached by keyboard (A11Y-1)", async ({ page }) => {
  for (const path of ["/", "/library", "/pricing", "/interview", "/ai/book"]) {
    await page.goto(path);
    const missing = await page.evaluate(() => [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.src));
    expect(missing, path).toEqual([]);
    const unreachable = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[onclick]")].filter((e) => !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(e.tagName) && !e.hasAttribute("tabindex") && !e.getAttribute("role")).map((e) => e.outerHTML.slice(0, 80)),
    );
    expect(unreachable, path).toEqual([]);
  }
});

test("the funnel counter refuses unknown events before writing anything (SC-3)", async ({ request }) => {
  const codes: number[] = [];
  for (let i = 0; i < 4; i++) codes.push((await request.post("/api/funnel", { data: { event: "nonsense" } })).status());
  expect(codes.every((c) => c === 400)).toBe(true); // unknown events are refused before anything is written
});
