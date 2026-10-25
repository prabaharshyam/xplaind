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

## Slice S3 (roadmap and stops)

- **Progress lives on the device until accounts arrive.** Stop status, the check score, a project link and the "Free only" switch are saved in the browser as `xplaind.progress.v1`. The record has the same fields as the `stop_progress` table, so slice S5 can copy it to the account on sign-in. RM-9 says the switch persists for signed-in learners; that part comes with S5.
- **Clicks are logged to the host's request log for now.** `/go/[resource-id]` writes one line per click (resource, stop, level, cost, affiliate flag; nothing about the visitor). Slice S5 sends the same fields to the `resource_clicks` table. The stop in the log is trusted only if that stop really lists the resource.
- **Affiliate links need a new field, `affiliate_url`.** RM-5 says "add an affiliate tag" but no field held the tag. A resource marked `affiliate: true` must now have `affiliate_url`, the full tagged link, and `/go` sends affiliate clicks there. Validation rejects `affiliate_url` on a non-affiliate resource. No resource is affiliate yet.
- **Ranking is the editor's order.** The stop file's `primary_resource` then `alternates` is the order shown. "Free only" moves paid resources below the free ones; "free to learn, paid certificate" counts as free. The ED-2 test reads the ranking source files and fails if they mention affiliate or commission, and a second test hands the ranking function resources whose affiliate field throws when read.
- **Next five steps (RM-3).** Up to two review stops come first, one per gap in gap order, each the easiest unfinished stop at or below the start level that covers the gap. Then unfinished stops from the start level up, in ladder order. A stop is never listed twice. Self-skipped stops count as done (RM-8). Fewer than five appear while stops are still being written.
- **Percent covered** is weighted by stop hours and counts only stops from the start level up. It is a share of the steps written so far, so it will move as stops are added. Skipped stops are counted separately.
- **Check scoring rounds down**, so 2 of 3 is 66% and fails the 70% bar (RM-7). A failed check keeps the stop in progress and keeps the best score. A failed retake never undoes a stop that is already done.
- **"Last verified" shows "Not yet verified"** when `verified_by` is not a person, instead of a date a draft never earned. **"Link checked" shows "Not checked yet"** until the weekly link check (slice S6) writes `data/link-status.json`.
- **"Price may have changed" is decided in the browser.** Pages are built ahead of time and the build does not know today's date, so the card shows the price and its check date in the HTML, and adds the warning after the page loads if the check is over 60 days old.
- **Level pages use lowercase URLs**, `/roadmap/genai-engineer/b2`. Any other spelling is not found.
- **A draft "How we rank" page (ED-3)** is live because every card links to it, and the footer links to it. Slice S7 finishes it. It has no way to report a wrong link yet; that needs a contact route the owner chooses.
- **Fixed a layout bug from S2.** Two questions with a long code line made the test page wider than a phone, because a form fieldset grows to fit its widest content. Fieldsets now shrink, and a browser test opens every question at 360 px.

## Roadmap map (owner's request: a complete, visual roadmap like roadmap.sh, not a copy)

- **A metro map, not a flowchart.** The site already calls a lesson a "stop", so the roadmap is drawn as three coloured lines: green Beginner, blue Intermediate, violet Pro. Each level is a station, each topic a stop on the line, optional topics sit on a dashed branch, and each level ends at its level project. Phones get one rail on the left; wider screens put the rail in the middle with topics alternating left and right. A row of nine station chips at the top jumps to any level.
- **The full outline is new content: `topics` in `content/levels/levels.yaml`.** Five or six topics per level, 50 in all, one or two of each marked optional. A topic's id is the shared tag: placement questions use it and a stop lists it in `gap_tags`. All 33 placement tags became topics at their own level, and I added 17 more. Claude drafted them; they need the same review as the rest of the content.
- **Topics without a lesson still show**, marked "Coming soon", so the map is complete from day one and the empty parts are honest.
- **New validation rules:** a topic sits on one level only; every stop gap tag must be a topic at the stop's level or below; every placement tag must be a topic at the question's own level. A core topic with no stop yet is on the launch to-do list.

## Lessons for every core topic (before interview questions, at the owner's choice)

- **The owner chose to write lessons before interview questions**, so every question in slice S4 can link to a real lesson (IQ-2). Books are postponed until the owner joins Amazon Associates India; until then a book link with a "we earn a commission" label would be false.
- **35 new lessons, 38 in all**: one for every core topic on the map. Optional topics (for example MCP, SQL, fine-tuning basics) have none yet.
- **Every source was opened before use.** Each link was fetched from the build environment on 2026-10-25 and its title and content checked. `verified_by` says exactly that and stays a non-person value, because ED-4 wants a person to confirm access and price. YouTube blocks automated checks, so no new lesson links to a YouTube video.
- **Sources are free first and mostly primary**: official docs (Python, Requests, packaging, Claude API), university courses (CS50, Python for Everybody, MIT Missing Semester, Helsinki), Kaggle and Hugging Face courses, and widely cited practitioner writing (Anthropic engineering, Hamel Husain, Eugene Yan, Chip Huyen, Simon Willison, OWASP). The Claude docs are used for the API lessons because they could be opened and checked; the lesson text says the ideas carry over to other providers.
- **Checks:** 26 lessons end in three multiple-choice questions, nine hands-on lessons end in a project. All drafted by Claude and flagged for review.
- **Launch gap:** the PRD asks for at least 5 lessons per level. Six levels have four, because they have four core topics. Writing lessons for their optional topics would close it.
- **A browser test now opens every lesson page** at 360 px and runs the accessibility scan, so new lessons are checked automatically.
