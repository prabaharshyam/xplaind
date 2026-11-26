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

const JOB_POST =
  "GenAI Engineer, 3 to 5 years. You will build retrieval-augmented generation (RAG) pipelines with a vector database, write evaluation sets, fine-tune small models with LoRA, and deploy on Kubernetes with Docker. Experience with LangGraph agents and prompt injection defences is a plus.";

test("a pasted job post puts its questions first, and Pro can have questions written for it (PREP-5, PREP-6)", async ({ page }) => {
  const asked: { jd: string; role: string; experience: string; have: string[] }[] = [];
  let allow = false;
  await page.route("**/api/ai/prep-questions", (route) => {
    asked.push(route.request().postDataJSON());
    if (!allow) return route.fulfill({ status: 403, json: { error: "Questions written for your job post are part of Pro.", upgrade: "/pricing" } });
    const answer = "Name the trade-off, give one example from real work, and say how you measured the result of the change you made.";
    return route.fulfill({ json: { questions: [1, 2].map((n) => ({ id: `jd-${n}`, question: `How would you evaluate retrieval for lending documents, part ${n}?`, short_answer: answer, deeper_answer: `${answer} ${answer}` })) } });
  });

  await page.goto("/interview/prep");
  await page.getByLabel("Interview date").fill(inDays(10));
  await page.getByLabel("Role").selectOption("genai-engineer");
  await page.getByLabel("Your experience").selectOption("mid");
  await page.getByLabel("Kind of company (optional)").selectOption("service");
  await page.getByLabel("Job post (optional)").fill(JOB_POST);
  await expect(page.getByText(/\d+ match your job post, and come first/)).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Make my plan" }).click();

  const job = page.getByRole("region", { name: "Your job post" });
  await expect(job.getByText(/\d+ questions in your plan match the skills your job post names/)).toBeVisible();
  // Without Pro: the reason, and the way to Pro.
  await job.getByRole("button", { name: "Write 10 questions for this job post" }).click();
  await expect(job.getByRole("alert")).toContainText("part of Pro");
  await expect(job.getByRole("link", { name: "See Pro" })).toHaveAttribute("href", "/pricing");
  expect(asked[0]).toMatchObject({ jd: JOB_POST, role: "Generative AI & LLM Engineer", experience: "mid" });
  expect(asked[0].have.length).toBeGreaterThan(10);
  // With Pro: the questions join the plan, marked wherever they show.
  allow = true;
  await job.getByRole("button", { name: "Write 10 questions for this job post" }).click();
  await expect(job.getByText(/2 questions written by AI for this job post are in your plan, marked "Generated for your JD"/)).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  await page.getByRole("button", { name: "Start today's questions" }).click();
  for (let i = 0; i < 3; i++) {
    await expect(page.getByText("Generated for your JD", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Show the short answer" }).click();
    await page.getByRole("button", { name: "Got it" }).click();
  }
  await expect(page.getByText("Card 4 of 10")).toBeVisible();
  await expect(page.locator("#card-question")).toHaveText(/lending documents, part 1/);
  await expect(page.getByText("Generated for your JD", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show the short answer" }).click();
  await expect(page.getByText(/No person has reviewed them, so check anything that matters/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Full answer, follow-ups and common mistakes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Partly" }).click();
  await expect(page.getByRole("progressbar", { name: "Questions covered" })).toHaveAttribute("aria-valuenow", "4");
  // Its topic shows among the weakest, but has no practice page to link to.
  const weak = page.getByRole("heading", { name: "Weakest topics so far" }).locator("..");
  await expect(weak.getByText("Your job post: 0 of 1 got it")).toBeVisible();
  await expect(weak.getByRole("link", { name: "Your job post" })).toHaveCount(0);

  // Kept on this device: still there after a reload, and gone with the plan.
  await page.reload();
  await expect(page.getByRole("progressbar", { name: "Questions covered" })).toHaveAttribute("aria-valuenow", "4");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Remove my plan" }).click();
  await expect(page.getByLabel("Job post (optional)")).toHaveValue("");
  expect(await page.evaluate(() => localStorage.getItem("xplaind.prep-job.v1"))).toBeNull();
});

test("stories, the rounds guide and a calendar file help with the rest of the interview (PREP-8)", async ({ page }) => {
  await page.addInitScript(
    ([started, on]) => {
      if (!localStorage.getItem("xplaind.prep.v1")) localStorage.setItem("xplaind.prep.v1", JSON.stringify({ interviewOn: on, pathId: "ai-engineer", experience: "mid", minutes: 30, startedOn: started }));
    },
    [inDays(0), inDays(6)],
  );
  await page.goto("/interview/prep");
  await expect(page.getByRole("heading", { name: "Your interview is in 6 days" })).toBeVisible();

  // The rounds guide names the rounds and how to prepare for each.
  const rounds = page.getByRole("region", { name: "What each round tests" });
  for (const name of ["Screening call", "Technical round", "System design round", "Behavioural or manager round", "HR round"]) await expect(rounds.getByText(name, { exact: true })).toBeVisible();

  // A story is written once and kept on this device.
  const stories = page.getByRole("region", { name: "Your stories" });
  await expect(stories.getByText("Not written yet")).toHaveCount(5);
  await stories.getByText("Something that went wrong, and what you changed").click();
  await stories.getByLabel(/^Action/).first().fill("I rebuilt the model with a time-based split and ran a small trial first.");
  await stories.getByLabel(/^Result/).first().focus();
  await expect(stories.getByText("Written", { exact: true })).toHaveCount(1);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await page.reload();
  await page.getByRole("region", { name: "Your stories" }).getByText("Something that went wrong, and what you changed").click();
  await expect(page.getByRole("region", { name: "Your stories" }).getByLabel(/^Action/).first()).toHaveValue(/time-based split/);

  // The calendar file downloads.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to my calendar (.ics)" }).click();
  expect((await download).suggestedFilename()).toBe("xplaind-interview-prep.ics");

  // A behavioural card points at the learner's story for it (the fifth card of five at 30 minutes a day).
  await page.getByRole("button", { name: "Start today's questions" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Show the short answer" }).click();
    await page.getByRole("button", { name: "Got it" }).click();
  }
  await page.getByRole("button", { name: "Show the short answer" }).click();
  await expect(page.getByText(/Your story for this/)).toBeVisible();
});

test("the daily email's unsubscribe link lands on a plain page (PREP-7)", async ({ page }) => {
  await page.goto("/commit/stopped?emails=prep");
  await expect(page.getByRole("heading", { level: 1, name: "Daily emails stopped" })).toBeVisible();
  await page.goto("/commit/stopped");
  await expect(page.getByRole("heading", { level: 1, name: "Weekly emails stopped" })).toBeVisible();
});
