# Decisions and assumptions

Choices made while building that the PRD did not settle, or where the build forced a detail. Each one is easy to change. Review them and strike through any you disagree with.

## Slice S0 (scaffold)

- **Fonts are self-hosted** with the `geist` package instead of `next/font/google`, because the Google Fonts fetch fails when the build machine cannot reach Google. It also means visitors' browsers never call Google.
- **`@types/node` is 22**, to match Node 22 and satisfy Vitest's peer dependency.
- **Cache Components and Partial Prefetching stay on**, as `create-next-app` set them for Next 16.4. Content is read at build time, so pages are static.
- **CI** runs lint, typecheck, unit tests, content validation, build and the Playwright flow in Chromium at 360 px, plus a gitleaks secret scan. WebKit and Firefox come in slice S8 (QA-3).

## Slice S1 (content pipeline)

- **Schemas are strict.** A misspelled field in a YAML file (for example `affilate`) fails validation instead of being ignored.
- **Price cap is `PRICE_CAP_INR = 900`** (`src/lib/content/schema.ts`), my reading of "about 10 US dollars". Recheck against the current rate.
- **Stops carry the review fields** (`drafted_with_ai`, `reviewed_by`, `reviewed_on`). The PRD data model leaves them off `Stop`, but ED-9 says AI-drafted lessons need a human review, and a stop's MDX body is a lesson.
- **Check questions** (`questions/checks/`) have no schema in the PRD. I gave them the same shape as placement questions plus `stop_id`.
- **Human sign-off is checked by name.** `reviewed_by` and `verified_by` must name a person. Values such as "Claude", "UNREVIEWED" or "TBD" are rejected at launch (`isHumanName`, `src/lib/content/review.ts`).
- **Two modes.** `npm run content:validate` (development) lists missing coverage and missing human sign-off as a to-do list and passes. `npm run content:validate -- --launch`, or `CONTENT_LAUNCH=1`, turns them into errors. The production deploy should run in launch mode once content is ready. The PRD says the build fails if a level has fewer than 5 questions; launch mode is how that applies while content is still being written.
- **PL-4 (every gap tag maps to a stop)** is checked for each placement tag: some stop at the question's level or lower must list the tag. In development it is a to-do, at launch an error.
- **Unknown stop ids** return HTTP 200 on the first request, then 404. This is how Cache Components streams `notFound()`: the response has already started. The page carries `noindex`, so search engines skip it.

## Sample content is not verified

The six sample resources, three stops and six check questions exist to exercise the pipeline. They were written from memory. I could not open the providers' pages from the build environment, so none of them has been checked for price, access, hours or certificate. Each says so in `verified_by` / `reviewed_by`, and launch mode fails until a person replaces those with their name after opening the page. The hours and "certificate" values are guesses.

## Slice S2 (placement test)

- **"I don't know" counts as an answer.** It is an attempt that is wrong, so it moves the staircase down and counts towards "at least 2 answered" in PL-3.
- **Exactly two thirds passes.** The check uses whole numbers (`correct * 3 >= attempts * 2`), so 2 of 3 and 4 of 6 pass and 2 of 4 does not.
- **The test can end before 12 questions.** PL-2 says 12, but also says no question repeats. A learner who keeps missing questions stays at B1, and a bank with 6 questions at B1 runs out after 8 answers (B3, B2, then six at B1). The engine then ends the test instead of repeating a question or asking from another level. With the launch target of 6 per level this happens only to learners who miss nearly everything, and B1 is the right result for them. If you would rather always ask 12, the bank needs about 10 B1 questions.
- **Weekly hours choices are 3, 5, 10, 15 and 20**, with 5 selected. The PRD names weekly hours but not the options.
- **Result page shows more than PL-5 asks for:** the questions the learner missed, with the right answer and the explanation. It teaches something the moment the test ends. It reads the bank in the browser, which already ships the answers (PRD: the test has no stakes).
- **The next five steps are not on the result page yet.** That is RM-3 and arrives in slice S3 with its tests.
- **A review link needs a stop.** A gap topic links to the easiest stop at or below the start level that lists the tag. Until stops are written, most topics show "A review step for this topic is coming."
- **Browser storage.** A test in progress is saved as `xplaind.test.v1` so a refresh keeps the place. A finished result is `xplaind.attempt.v1`. Both hold question ids and choices only, no personal data. The result page is `noindex`.
- **`isValidStaircase` and `gradeChoices`** are written now for slice S5: the server re-scores a claimed attempt from raw choices and rejects a sequence that could not have come from the staircase.

### The draft question bank

- 54 questions, 6 per level. Each is flagged `drafted_with_ai` and `UNREVIEWED`. They need a person who knows the subject to check every question, its correct answer, its level and its wording. The correct option's position rotates, so a, b, c and d are balanced.
- Topic tags are a shared vocabulary of 33 tags. Each tag needs a review stop (PL-4); `npm run content:validate -- --verbose` lists the tags that have none yet. That list is a ready outline for the stops to write.
- Levels are my judgement of difficulty. The PRD plans to retune them after the 50-tester soft launch (PL-7).
