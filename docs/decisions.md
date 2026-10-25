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

## Slice S4 (interview questions and practice; books postponed)

- **Eight interview topics, fixed in code** (`src/lib/interview-topics.ts`), from IQ-2: LLM and transformer basics, ML basics, RAG, agents, evals, prompting versus RAG versus fine-tuning, system design, behavioural. The schema rejects any other topic, and validation counts every topic, so a topic with no questions shows up on the launch list.
- **42 questions**, at least five per topic, each with a short answer of 60 words or fewer, a deeper answer, two or three follow-ups and common mistakes, linked to the lesson that teaches it. Behavioural questions link to the design-interview lesson, the closest fit. All drafted by Claude and flagged.
- **Draft label (IQ-6).** IQ-6 says no unreviewed record is built into the site. In development mode drafts are built so the owner can see them, and every interview page and practice card says "Draft: written with AI help and not yet checked by a reviewer". Launch mode still fails on any unreviewed record, so nothing unreviewed can reach a launch build.
- **Practice mode (IQ-4):** question, then the short answer, then the deeper answer, then a rating: got it, partly or missed. Ratings are saved in the browser as `xplaind.practice.v1`, shaped like the `practice_ratings` table (0 missed, 1 partly, 2 got it) for slice S5. The next round puts unrated questions first, then missed, partly and got it, oldest rating first within each. Spaced repetition (IQ-8) is release 2.
- **Standalone MCQ sets (IQ-5)** are built from existing checks: a topic's quiz draws five random questions from the checks of the lessons its interview questions link to. No duplicate question bank to maintain. Quiz scores are not saved.
- **URLs:** `/interview`, `/interview/[id]` (the id is a readable slug), `/practice` and `/practice/[topic]`, all static and all in the new `/sitemap.xml` (IQ-3). The sitemap uses `NEXT_PUBLIC_SITE_URL`, defaulting to `https://xplaind.in`, the domain the owner bought (the PRD says xplaind.ai). `robots.txt` names the sitemap only once indexing is allowed.
- **The quiz UI is now one component** (`src/components/mcq-quiz.tsx`) shared by lesson checks and practice quizzes.
- **Books (BK-1 to BK-3) are not built**, at the owner's choice, until an Amazon Associates India tag exists.

## Slice S5 (accounts and progress)

- **Accounts switch on by configuration.** Without the Supabase settings, sign-in, dashboard and settings say "Accounts are coming soon", the footer shows no sign-in link, and every account API answers 503. Setup steps for the owner: `docs/supabase-setup.md`.
- **Migration** `supabase/migrations/20261025000000_initial.sql` follows the PRD SQL, adding a `rate_limits` table and function (SC-3) and a few checks (score 0 to 100, project links must be web addresses, a done-how only on done stops, card names of 40 characters or fewer).
- **Who writes what.** Learners write their own `stop_progress` and `practice_ratings` under row-level security (release 1 trusts self-reports). Only the server, with the service role, writes `profiles` (with the 18+ timestamp), `quiz_attempts` (after re-scoring), `activity_days`, `badges` and `level_cards`, so a learner cannot award themselves a level, a streak or a card. Learners may update only `goal_id` and `weekly_hours` on their profile, enforced by column grants.
- **RLS tests (SC-2)** run on plain Postgres 16 with a small stand-in for Supabase's auth schema (`supabase/tests/auth-shim.sql`), in a new CI job. `npm run test:db` runs them locally against `TEST_DATABASE_URL`.
- **Sign-in (AC-1).** Email link only. The form needs the 18+ tick; the server refuses without it and stores the time on the auth user, then copies it to `profiles.adult_confirmed_at` on first sign-in. "I am under 18" explains that everything works without an account and nothing is stored on the server (PV-2). The link must be opened in the same browser (Supabase's PKCE flow); the callback also accepts the token-hash form if the email template is changed later.
- **Claim and sync (AC-2).** The device keeps its copy. Signed in, each change is also sent to the server. On every dashboard visit the device posts its result, progress and ratings to `/api/claim`; the server re-scores the test from raw choices (rejecting impossible staircases), merges both sides (a done stop beats an unfinished one, otherwise the later change wins, ties keep the server's) and returns the merged state, which the device stores. Two devices converge through this.
- **Streak (AC-5).** Weeks run Monday to Sunday in India. A week counts when a stop is done, a check is taken or a practice question is rated. The streak survives an empty current week and resets only after a full empty week.
- **Badges (AC-6).** Passing a level in the test (PL-3) gives that level's badge and every level below it. Finishing every stop of a level with a passed check or a project (RM-7) also gives it; self-skipped stops do not count. Badges are never taken away.
- **Level cards (AC-7).** The server fills in level and weeks active. The share link is a random UUID; the page and its 1200 by 630 image show level, goal, weeks active, the site and an optional first name, and nothing else. Deleted cards disappear at once (no caching).
- **Rate limits (SC-3).** Claim 30 per 10 minutes per learner, progress 120, practice 200, cards 10 an hour, sign-in emails 5 per 10 minutes per address hash. The address is never stored; the hash changes daily. The limiter fails open, so a database hiccup cannot lock learners out.
- **Delete and export (AC-11).** Deleting the auth user cascades to every learner table in the same request; email subscriptions are deleted explicitly by user and email. Export returns every learner table as JSON.
- **Not yet tested end to end.** Signed-in flows need a real Supabase project, so they are covered by unit tests of the pure parts, the database tests and builds with placeholder settings. A browser test of the whole sign-in flow comes once the project exists.

## Home page (owner's request: a premium, 3D, scroll-animated landing page, Apple tone)

- **3D without a 3D library.** The scenes use the browser's own 3D (CSS perspective and transforms), driven by one scroll-progress variable per scene (`src/components/motion/scroll-scene.tsx`) and the pointer position on devices with a mouse. No WebGL or animation library is shipped, so the page stays light for mid-range phones on 4G (QA-1). React never re-renders on scroll; only one CSS variable changes per frame.
- **Scenes:** the nine levels as a stack of plates that fans open and turns as you scroll, with an example "You start here" plate; the problem statement lit word by word; a three-sided prism that turns through the test, the roadmap and practice, each face a small working mock-up filled with real content; the level ladder sliding sideways; the numbers, principles, interview preview and plans revealed as they arrive.
- **Every number and example comes from the content files** (levels, topic, lesson and question counts, a real placement question, real lesson titles, a real interview answer), so the page cannot drift from the site.
- **Accessible by default.** With JavaScript off, every scene shows its finished state. With reduced motion, nothing moves and everything is visible. Inactive steps in "How it works" turn a grey that still passes WCAG AA instead of fading. Browser tests scan the page after scrolling through it, and again with reduced motion.
- **"Where this is going"** lists release 1 parts not yet switched on and the release 2 and 3 plans from the PRD, labelled "Plans, not promises".
- **Site navigation.** A sticky, translucent top bar on every page (dark on the home page) with Roadmap, Courses, Interview, Practice and "Find my level"; on phones a menu that works without JavaScript. New `/resources` page lists every course by level with the lessons that use it.

## Nine paths (product plan v2, `docs/product-plan.md`)

- **A path is a content file.** `content/goals/<id>.yaml` lists stages; each stage lists lesson ids in the order a learner takes them, topics still being written (`planned`), and a closing project. The PRD's "goal" and the site's "path" are the same thing; the database keeps the column name `goal_id`.
- **One lesson library.** A lesson (stop) belongs to no path; paths point at it. A lesson keeps a `level` as its difficulty on the shared nine-level ladder, and its file still sits under `stops/<level>/`. The per-level `order` field is gone: on the GenAI path the order now comes from the path file, and the validator checks every GenAI lesson sits in the stage of its own level.
- **Two layouts.** GenAI Engineer is laid out by level (stages are B1 to P3, named from `levels.yaml`) and keeps its metro map at `/roadmap/genai-engineer`. Every other path is laid out in named stages at `/roadmap/<id>`, drawn as one line with a station per stage.
- **The level test applies where the ladder fits.** Paths with `placement: ladder` (GenAI, FDE, Agentic AI, RAG, LLMOps) use the same test and question bank, at `/start` for GenAI and `/start/<id>` for the others; lessons below the learner's level show as optional. Paths with `placement: none` (Beginners, Automation, AI PM, ML Engineer) start everyone at stage 1, because the GenAI ladder does not measure what they teach.
- **Next steps follow the path's order** rather than sorting by level, so a path can teach an I1 lesson before a B3 one. Gap reviews look on the learner's path first, then on the GenAI path, where every placement topic is taught.
- **The current path** is the one chosen on this device ("Make this my path"), else the one the last test was taken for, else GenAI Engineer. Signed in, choosing a path also updates `profiles.goal_id`.
- **Progress carries across paths.** Progress is stored per lesson, so a lesson done on one path is done on every path that uses it.
- **Planned topics are honest placeholders.** They show on the map as "Being written", count as launch gaps in `content:validate -- --launch`, and turn into lessons in later commits.
