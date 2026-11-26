import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const wcag = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const inDays = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + n * 86_400_000));

test.use({ viewport: { width: 360, height: 740 } });

test("an interview date, role and daily time make a day-by-day question plan with progress (PREP-1)", async ({ page }) => {
  await page.goto("/interview/prep");
  await expect(page.getByRole("heading", { level: 1, name: "Your interview prep plan" })).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);

  await page.getByLabel("Interview date").fill(inDays(10));
  await page.getByLabel("Role").selectOption("ai-engineer");
  await page.getByLabel("Your experience").selectOption("mid");
  await page.getByLabel("Time you can give each day").selectOption("60");
  await expect(page.getByText(/\d+ questions for a AI Engineer interview: \d+ on the role and \d+ behavioural/)).toBeVisible();
  await expect(page.getByText(/In 10 days at 60 minutes a day, you cover/)).toBeVisible();
  await page.getByRole("button", { name: "Make my plan" }).click();

  await expect(page.getByRole("heading", { name: "Your interview is in 10 days" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Questions covered" })).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText("0 to revise, 10 new, 0 done today.")).toBeVisible();
  // The plan: today first, the day before for revision, the interview day last, mock interviews on the way.
  const days = page.getByRole("region", { name: "Day by day" });
  await expect(days.getByRole("listitem").first()).toContainText(/Today.*10 new questions/);
  await days.getByText(/Show the other \d+ days/).click();
  await expect(days.getByRole("listitem").last()).toContainText("Interview day");
  await expect(days.getByText("Full mock interview")).toBeVisible();
  await expect(days.getByText(/Short mock interview/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The day before" })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // Today's deck: answer, rate, and the progress moves.
  await page.getByRole("button", { name: "Start today's questions" }).click();
  await expect(page.getByText("Card 1 of 10")).toBeVisible();
  await page.getByRole("button", { name: "Show the short answer" }).click();
  await expect(page.getByRole("link", { name: "Answer this one out loud in a mock interview" })).toHaveAttribute("href", /^\/interview\/simulator\?question=/);
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByText("Card 2 of 10")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Questions covered" })).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "Show the short answer" }).click();
  await page.getByRole("button", { name: "Missed" }).click();
  await expect(page.getByText(/Readiness: \d+ out of 100/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weakest topics so far" })).toBeVisible();

  // The plan and the ratings are still there after a reload.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your interview is in 10 days" })).toBeVisible();
  await expect(page.getByText("0 to revise, 8 new, 2 done today.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Carry on with today's questions" })).toBeVisible();

  // Changing the plan keeps the progress; removing it brings the form back.
  await page.getByRole("button", { name: "Change my plan" }).click();
  await page.getByLabel("Time you can give each day").selectOption("30");
  await page.getByRole("button", { name: "Save my plan" }).click();
  await expect(page.getByText(/· 30 minutes a day/)).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Questions covered" })).toHaveAttribute("aria-valuenow", "2");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Remove my plan" }).click();
  await expect(page.getByRole("button", { name: "Make my plan" })).toBeVisible();
});

test("a missed question comes back the next day, and a passed date asks for a new plan (PREP-1)", async ({ page }) => {
  // A plan started two days ago with one question missed yesterday.
  await page.addInitScript(
    ([started, yesterday, on]) => {
      localStorage.setItem("xplaind.prep.v1", JSON.stringify({ interviewOn: on, pathId: "ai-engineer", experience: "mid", minutes: 30, startedOn: started }));
      localStorage.setItem("xplaind.practice.v1", JSON.stringify({ version: 1, ratings: { "what-is-rag": { rating: 0, updatedOn: yesterday } } }));
    },
    [inDays(-2), inDays(-1), inDays(2)], // the full mock falls two days before: today
  );
  await page.goto("/interview/prep");
  await expect(page.getByRole("heading", { name: "Your interview is in 2 days" })).toBeVisible();
  await expect(page.getByText("1 to revise, 4 new, 0 done today.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today: a full mock interview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the mock interview" })).toHaveAttribute("href", "/interview/simulator?path=ai-engineer&exp=mid");
  await expect(page.getByText(/questions do not fit before your interview/)).toBeVisible();
  await page.getByRole("button", { name: "Start today's questions" }).click();
  await expect(page.locator("#card-question")).toHaveText(/RAG/); // the missed one first

  // The mock interview link arrives with the experience chosen.
  await page.goto("/interview/simulator?path=ai-engineer&exp=mid");
  await expect(page.locator("select").filter({ hasText: "3 to 5 years" }).first()).toHaveValue("mid");
});

test("a plan whose date has passed offers a new one (PREP-1)", async ({ page }) => {
  await page.addInitScript(
    ([started, on]) => localStorage.setItem("xplaind.prep.v1", JSON.stringify({ interviewOn: on, pathId: "ai-engineer", experience: "mid", minutes: 30, startedOn: started })),
    [inDays(-9), inDays(-1)],
  );
  await page.goto("/interview/prep");
  await expect(page.getByRole("heading", { name: "Your interview date has passed" })).toBeVisible();
  await page.getByRole("button", { name: "Plan the next interview" }).click();
  await expect(page.getByRole("button", { name: "Make my plan" })).toBeVisible();
  await expect(page.getByLabel("Interview date")).toHaveValue("");
});
