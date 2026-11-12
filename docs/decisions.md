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

## Explainer lessons and the glossary

- **Explainer format.** A lesson with `format: explainer` carries our own teaching text with five sections in order: What it is, How it works, A worked example, Common mistakes, Practice. It is 500 to 1,500 words and lists at least two `key_terms` from the glossary. The page shows the text first, then the key terms, then the free course under "Go deeper", then the check. Release 1 lessons stay `format: brief` until rewritten, and each brief is a launch gap.
- **Examples are Indian and original.** Worked examples use Indian settings (UPI payments, Chennai support teams, Hinglish queries) and are written for Xplaind, not adapted from a course.
- **Glossary.** One YAML file per term under `content/glossary/`, with a definition of 45 words or fewer, an optional fuller explanation, other names and related terms. `/glossary` lists terms A to Z; each term links to the lessons that list it as a key term. Terms are drafts until a person reviews them.
- **MDX limits.** Lessons avoid tables and curly braces outside code blocks (no GFM plugin; MDX reads braces as code). Code blocks scroll inside their box at 360 px and can take keyboard focus.

## Home page for nine paths

- The hero's stack of plates now shows the nine paths (it showed the nine GenAI levels). The highlighted plate, labelled "Your path", is an example, like the old "You start here".
- "Choose a path" is the main call to action, with "Find my level" beside it; the header keeps "Find my level" and adds Paths and Glossary to the navigation.
- The sideways-scrolling level ladder became a strip of path cards linking to each roadmap. The numbers section counts paths, lessons, glossary terms and interview questions from the content files.
- "Where this is going" now lists the owner's final-stage features by phase (see `docs/product-plan.md`), still labelled "Plans, not promises".

## Courses, certifications, interviews for every path, the mock interview and the blog (2026-10-25, later)

- **Courses from the owner's 32-platform list.** Every platform in the image the owner shared (and the free part of The Strategy Stack's list) was opened on 2026-10-25. 41 new resources were added and attached to lessons through a new optional `more` list on each stop (up to six "More free courses on this topic", shown under the main picks). The `/resources` page is now a directory filterable by path, level band, type and "certificate or badge"; its ordering lives in `src/lib/roadmap/directory.ts`, which the ED-2 test checks never reads affiliate fields.
- **Certifications are their own content type** (`content/certifications/*.yaml`) because exams are not courses: they have a provider, exam code, format, a fee in US dollars with `fee_checked_on` (RM-6, enforced by the schema) or a note on how the fee is set, and a list of free prep resources. `/certifications` shows them, plus every free course that ends in a certificate or badge. Facts (AI-901 replacing AI-900, AI-103 replacing AI-102, fees) come from the official exam pages on 2026-10-25; each record is marked unverified until a person checks it.
- **Interview questions by path.** A question still links to one lesson; it belongs to every path that lesson is on. Seven topics were added (AI basics, deep learning, deployment and LLMOps, governance, automation, product, client delivery) and 99 questions written so every path has at least 16. Five ML questions moved to ML lessons. `/interview` has a path filter and `/interview/for/<path>` gives each role its own page with FAQ structured data.
- **Rubrics (VS-1) on every question.** Each question has 3 to 6 key points, each with keywords, and an `answer_seconds` limit of 60, 90 or 120. A keyword matches at the start of a word, ignoring case, punctuation and hyphens.
- **The mock interview is release 3's flow without its model.** Release 1 makes no model calls, so the simulator (`/interview/simulator`) does everything in the browser: the browser's own speech-to-text (Space or the button turns it on and off; `en-IN`), a per-question timer with 30 seconds of thinking time, a typed fallback (VS-4) and a report computed by pure functions in `src/lib/interview/analyse.ts`: key points covered, a 0 to 5 score from them, length, pace, filler words and the top three fixes. The report says plainly that it matches words and cannot judge correctness. Nothing is stored on our servers and the report is not saved (print or save as PDF). The consent screen says that Chrome and Edge send audio to Google or Microsoft for speech-to-text. The model-graded report (release 2's grader, release 3's voice agent) can replace the analysis later behind the same screens.
- **Blog.** Posts are MDX files in `content/blog/` with title, description (the search snippet), dates, related paths and lessons, and an optional FAQ that is shown on the page and given to search engines as FAQPage data; each post also carries Article data. GitHub-flavoured Markdown (tables) is on for posts through `remark-gfm`. Posts are drafts until a person reviews them, like every other AI-assisted text.
- **AI search.** `/llms.txt` lists the main pages in the llmstxt.org format, built from the content files. The sitemap now includes the blog, certifications, role interview pages and the simulator.

## Redesign for clarity and engagement (2026-10-25, owner's feedback)

The owner found the site indirect and text-heavy, and asked for roadmap.sh's clarity and DataCamp's engagement without copying either. roadmap.sh's home page puts the role roadmaps right under a one-line promise and a search box, and its roadmap topics open a side panel with the explanation, typed resources and Learning/Done/Skip. DataCamp leans on colourful course cards, XP and streaks.

- **Home page rewritten to be direct.** A one-line promise ("Learn AI for the job you want. Step by step, for free."), site search, three starting buttons (new to AI, can code, interview soon), then the nine role roadmaps as picture cards and the topic roadmaps as chips, all above or near the fold. Then the learner's pains in their own words, each with what Xplaind does about it; four feature tiles with small working mock-ups; how it works; guides; a short FAQ. The 3D card stack (whose lower cards' text overflowed), "Honest by design" and "Where this is going" are gone, along with the scroll-scene code.
- **Visual system without stock images.** Every lesson and path has one of 16 `theme`s (a content field, validated) that sets an original line icon and two colours. `Cover` draws seeded SVG art from them, so each course, lesson, path and post gets a distinct, stable picture with no image files, licences or broken links. Course covers also carry the provider's name.
- **Topic roadmaps.** `/topics` and `/topics/<theme>` list every lesson on a subject, easiest first, with the roadmaps that use them and related interview questions.
- **Roadmap drawer.** On every roadmap, clicking a topic opens a side panel (a modal `dialog`) with the lesson's outcome, why it matters, key terms, Learning/Done buttons, the best free course and more resources with type badges. Topics stay real links, so without JavaScript, or with Ctrl, Cmd or a middle click, they open the lesson page. "Done" in the drawer records "I already know this"; passing the lesson's check is still the way to full XP.
- **Lesson pages.** A coloured banner, each explainer section in its own card ("Part 2 of 5") with an icon, an "On this page" guide that ticks sections as they scroll past, key terms that open in place, course cards with covers, the check framed with the XP it earns, confetti and a toast when a lesson is finished, and previous/next lessons on the learner's path.
- **Gamification, local and derived.** XP is computed from what is already stored (lessons by how they were finished, check scores, practice ratings, mock interviews), never stored itself, so it cannot drift. Ranks from Curious to Master, a daily streak in Asia/Kolkata days, and nine badges. Mock interviews save only date, counts and scores (`xplaind.activity.v1`), never answers. The header shows XP and streak once there are any; `/dashboard` shows rank, streak, counts and badges for everyone, with the account section below.
- **Search.** A prebuilt index (`/search-index.json`, made at build time) of roadmaps, topics, lessons, guides, interview questions, glossary terms and courses, loaded on first use. On the home page, and in a dialog from the header on every page (Ctrl K or Cmd K).
- **Courses page.** A card grid with covers, type and certificate badges, topic chips, the existing filters, and 24 at a time with "Show more".

## AI features with Claude (2026-10-26, owner's request)

The owner asked for the AI features in the screenshot they shared (generate a course on anything, deep-dive guides, AI-powered roadmaps, quiz and interview prep, a personal AI coach, AI in the roadmap editor, an AI learning companion), with their own Claude API key on the backend. This changes the release 1 rule "no language-model calls at run time": AI features now ship early, under the release 2 guards the PRD already set (SC-5, CO-1). The owner chose the cap and the access rule:

- **Spend cap: US$20 a month** (`AI_MONTHLY_CAP_USD`, default 20). Every call's tokens and cost go to `ai_usage`; a new `cost_usd` column holds the cost so the cap is in dollars, priced per model (each fallback attempt at its own model's price; an unknown model at the most expensive rate). The server-only function `ai_reserve` checks the month's spend and the learner's daily count before a call, under an advisory lock; `ai_record` adds tokens and cost after it. At the cap the API answers with a friendly "resets on the 1st" message. Calls already in flight can take the month slightly past the cap, so the owner should also set a US$20 spend limit in the Anthropic Console as a hard stop.
- **Signed-in learners aged 18 or over only.** A call needs a session and a profile row, which exists only after the 18+ confirmation, so under-18s never reach the model (PV-2). Daily caps per learner: 5 roadmap generations or edits, 3 course outlines, 12 course lessons, 20 coach and 30 tutor messages, and 5 grades (the PRD's number). A burst limit of 6 calls a minute sits on top.
- **Kill switch.** `AI_KILL_SWITCH=true` turns every AI route off (503) and hides the AI forms. AI is also off until `ANTHROPIC_API_KEY` and the Supabase settings exist, so nothing changes on a deployment without them.
- **Model.** Claude Opus 5.5 (`claude-opus-5-5`) by default, changeable with `AI_MODEL`. Effort is medium for roadmaps and courses and low for chat and grading. Server-side refusal fallbacks are on, so a declined request is retried once on a model the API picks; its cost is counted.
- **SC-5.** Everything a learner types reaches the model inside `<learner_input>` tags, with any tag that could close them stripped, and the system prompt says to treat it only as data. Output is constrained with structured outputs and checked again with Zod; counts, lengths and numbers are clamped, and lesson ids the model returns are kept only if the lesson exists. The model is never given affiliate or commission fields, and its output never ranks courses (ED-2).
- **Nothing generated is stored on the server.** Generated roadmaps and courses are saved in the browser (`xplaind.ai.v1`); chats are not saved at all. Only counts, tokens and cost are stored.
- **Privacy page.** When the privacy page (PV-3) is written, it must name Anthropic as a processor for AI features: what is sent (the learner's typed text, and for the coach a short progress summary shown on the page), why, and that we keep no copy.
- **Where each feature lives.** `/ai` lists them. `/ai/roadmap` (generator, hand editing and "change it with AI"), `/ai/course` (outline first, each lesson written when opened, with a diagram, a quiz and flashcards), `/ai/coach`, the tutor at the end of every lesson (grounded in that lesson's text), and "Get AI feedback" on each answer in the mock interview report (IQ-7). "Deep-dive guides" are our own lessons, being rewritten to a deeper format; they are editorial content, not generated at run time.

## Topic tracking and one roadmap design (2026-10-26, owner's request)

- **Learning, Done and Skip on every topic, as on roadmap.sh.** The owner chose a one-tap Done, so RM-7 is amended: a stop is also done when the learner marks it done. It is stored as `done_how = 'self_marked'` (migration `20261027000000_self_marked.sql`), counted apart from passed checks, earns 20 XP against 50 for a check, and never earns a level badge (AC-6). Skip is RM-8's "I already know this" (`self_skipped`). Picking Done keeps a passed check or a project. Tapping the active choice again puts the topic back to "to do".
- **The controls appear in three places:** on each topic card on the map (behind a "Mark" button, so the map stays calm), in the topic drawer, and at the top and bottom of each lesson page.
- **Every path now uses one roadmap design.** GenAI Engineer's metro map and the other paths' stage lists are replaced by one view built from a shared model (`roadmapModel`): a spine with each level or stage as a station, topics on either side, coming-soon topics dashed, and the section's project at the end. GenAI keeps its level codes and level pages.
- **Progress counts double as filters.** The summary shows percent finished (done and skipped count, RM-8), a segmented bar, and To do, Learning, Done and Skipped counts that filter the map. "Hide done and skipped" is remembered on this device. The hours-based "percent covered from your level up" still shows once the learner has taken the test.
- **A Projects tab on every roadmap** lists each stage's project with its brief and deliverables, how much of the stage is finished, and "ready to build" at 70% of the stage. Learners can mark a project as building, or done with a link. Project progress is kept on this device only for now; syncing it needs a new user table, so it waits for a PRD data-model change.
- **Lesson widgets keep working when storage is blocked.** Values that cannot be saved stay in memory for the visit, so flashcards and other saved controls still respond in private windows or with site data blocked.

## Mock interview analysis (2026-10-26, owner's request)

- **Every answer is analysed, without a model.** The report now scores understanding from 0 to 100 per answer: key points covered (70%), closeness to the reference answer's key terms (20%) and structure (10%: a clear definition, an example, a trade-off, real use). Covered points quote the learner's own sentence as evidence. Answers are grouped by topic into "concept by concept" understanding, with the lessons to revisit for weak concepts. All of this is pure code in `src/lib/interview/analyse.ts`, with tests.
- **One AI review per interview, not one per answer.** Signed-in learners can ask Claude to review the whole interview in a single call (`/api/ai/interview`, kind `interview`, 3 a day). It judges meaning rather than words: what was right, what was wrong or misleading with the correction, which rubric points were missed, a stronger answer, and strengths, gaps and next steps for the session. It replaces the per-answer grade button, which cost one call per question. It needs the learner's tap, because it sends their answers to Anthropic.
- **The word-matching analysis says what it cannot do:** it cannot tell a wrong statement from a right one. The report says so and points to the AI review when AI is on.

## Guided projects (2026-10-26, owner's choice for the next phase)

- **Every roadmap project is a guided project (GP-1 to GP-4).** 22 guides in `content/projects`: one per GenAI level, one per FDE stage, and each other path's capstone. Each has a summary, difficulty, hours, the lessons it uses, what you will need, 4 to 8 steps (what to do, a hint, "done when"), a 4 to 6 point rubric with strong and weak examples, deliverables and stretch goals. They are drafted with AI and flagged for review like lessons.
- **Stages link guides with `guide: <id>`.** Validation fails if a link points nowhere, a guide is not linked, a lesson is missing, or a stage's project title differs from its guide's. GenAI levels now show their guide's title on the map instead of the bare exit check.
- **One progress record per guide.** Steps ticked, rubric criteria met and the submitted link are stored under `guide/<id>`, so a guide shared by two paths counts once, and the roadmap's Projects tab, the project page and `/projects` all agree. Still device-only, as GP-4 says.
- **No raw web links in steps.** Guides point to lessons, which carry the checked course links (RM-4), so no unchecked link reaches a learner through a project.

## X Bot and motion (2026-10-26, owner's request)

- **X Bot is ours, not a copy.** A round teal-to-violet bot with a screen face, blinking eyes that follow the pointer, pink cheeks and an amber X spark on its antenna. It bobs, leans while the page scrolls, waves when opened and "talks" while it thinks.
- **Two ways to answer (XB-2, XB-3).** Everyone gets instant answers matched against the site's own content: no model call, so it keeps release 1's cost rule and works for under-18s. Signed-in adults get AI answers when AI is on, under the existing guards, with a new daily cap of 30 (`bot`). If the AI call fails, X Bot falls back to the instant answer.
- **The panel is not a modal.** A `<dialog>` opened with `showModal` makes the rest of the page inert, and an earlier bug showed what happens when one outlives its page. X Bot's panel is a plain non-modal dialog region in the root layout, so the learner can keep reading and clicking while it is open.
- **No X Bot in the mock interview.** The interview should feel real, and step 3 of the voice simulator flow in the PRD says the agent does not coach during it.
- **Motion without contrast risk (MO-1 to MO-4).** React's `<ViewTransition>` was tried for page changes, but in the layout it also fired on in-page updates such as filters, and overlapping transitions were skipped. Instead, a small client component replays a rise-in on `#page` when the URL changes. Scroll effects use CSS scroll timelines, animate only transform, never opacity, and are scaled so a tipped card stays inside a 360 px screen. Everything is off under reduced motion.

## Practice in the top bar, and "Ask me from my book" (2026-10-26, owner's request)

- **"Interview" is now "Practice" in the top bar.** The owner found two interview entries confusing ("Interview" and "Mock interview"). The bar now reads Practice and Mock interview. The Practice page links to the full question bank, the mock interview and "Ask me from my book", so nothing is lost; the footer still links the question bank.
- **"Ask me from my book" (MB-1 to MB-4) reads the book in the browser.** Uploading books to our server would mean storing copyrighted files and personal notes, a storage bill, and a new user table with row-level security. Instead PDF.js reads the file on the learner's device and only short excerpts from the chosen chapters go to the model. This keeps the "nothing stored on the server" rule the other AI tools follow.
- **Retrieval is coverage, not a search.** A test should cover what the learner chose, so excerpts are spread across the chosen chapters by length rather than retrieved by a query. Each question must cite an excerpt and quote it; the server drops any question whose quote is not in that excerpt. This is what makes the report's "from your book, page N" trustworthy.
- **Cost.** A 25-question test sends at most 30 excerpts of about 300 tokens, about 10,000 tokens in and 5,000 out: roughly US$0.15 at the default model's price. The cap is 5 tests a day per learner, inside the US$20 monthly limit.
- **The PDF is made in the browser with jsPDF.** Its built-in fonts cover Latin script only, so the PDF spells out ₹ and smart quotes and replaces other scripts (for example Hindi) with "?". The on-screen report shows everything; for a book in another script, the browser's "Save as PDF" keeps it intact. A font that covers Indian scripts can be embedded later if learners need it.
- **New dependencies:** `pdfjs-dist` (reads PDFs; its worker loads only on this page) and `jspdf` (loads only when the learner downloads a report).

## Roadmap checklist, Top 25 interview sets and the content review (2026-10-26, owner's request)

- **Checklist download (RD-1, RD-2).** The owner chose an optional phone field and required, stored details. This amends PV-1 and AC-10. Details live in `roadmap_downloads`, which only the server can write and nobody else can read. They are deleted with the account and included in the export. Under-18s download with no details, as PV-2 requires. Until Supabase is configured, the API answers 503 and the download still goes ahead, so the feature works on previews. Before launch, the privacy page (PV-3) must name this table, its purpose and its retention.
- **Top 25 per role (IQ-8).** Each role lists 25 questions in study order. Concepts come first, then scenario and use-case questions, then real-life stories, with at least 12 practical ones. 29 new questions were written, and every question in a Top 25 gained a first-person "example you can use in the interview". The page prints or saves as a PDF with the browser's print dialog.
- **Content review.** 14 review agents checked every lesson, check question, glossary term, course link, certification, placement question, project, blog post and interview question against official sources. They fixed clear errors in place and listed what needs a person in `docs/review/*.md`. Nothing was marked reviewed: `reviewed_by` still names no person, so a human sign-off is still required before launch (ED-9, IQ-6).

## Nine roles and no "free" positioning (2026-10-26, owner's request)

- **The nine roles.**
  - **AI Engineer (new).** A broad path: Python and data, ML essentials, deep learning, LLM apps, testing, production and system design. It reuses existing lessons.
  - **Generative AI & LLM Engineer.** The existing nine-level ladder (id `genai-engineer`), with RAG Expert's retrieval lessons added at their own levels: I2, I3 and P1.
  - **AI Governance & Compliance Specialist (new).** No coding. Five stages, a new guided project ("An AI risk assessment for a real AI feature") and five new interview questions: the EU AI Act tiers, risk assessment, vendor due diligence, audit trails, and a real-life story.
  - **MLOps Engineer.** Replaces LLMOps (id `mlops-engineer`) and adds an ML lifecycle stage: experiment tracking, data versioning, serving and drift.
  - **Renamed:** Agentic AI Engineer (id `agentic-ai-expert` kept, so links and saved progress keep working), Forward Deployed Engineer (FDE), and Machine Learning Engineer.
  - **Retired:** AI for Beginners and RAG Expert. Their lessons now sit on other roles, and no lesson was deleted.
  - **Redirects:** `/roadmap`, `/interview/for` and `/interview/top` for llmops-engineer → mlops-engineer, rag-expert → genai-engineer, ai-for-beginners → ai-engineer.
- **Ids kept where possible.** Changing `genai-engineer` or `agentic-ai-expert` would break saved progress (the chosen path is stored by id), the level pages and level cards. Only the names changed.
- **"Free".** The site no longer calls Xplaind free: not in the hero, the header button ("Get started"), page titles, the FAQ, the AI tools pages or the AI prompts. Facts about third-party courses stay, such as a course's cost label, the "Free only" filter and "free certificate" details, because they are true and RM-6 needs prices shown. The project's `CLAUDE.md` still opens with "Free-first AI learning path"; that line describes how courses are chosen, and the owner may want to reword it.

## Video lessons, labels and launch sign-off (2026-10-27, owner's request)

- **Watch & learn panel.** Every lesson lists its video lessons and courses at the top of the right-hand column. On phones the panel sits just under "Track this topic", so learners see at once that there is something to watch. The full course cards stay further down the lesson.
- **YouTube plays on the page.** For a YouTube video or playlist, a "Watch here" button opens a player window on Xplaind. It uses YouTube's privacy-enhanced embed (`youtube-nocookie.com`) and loads nothing from YouTube until the learner presses play. That keeps to the "no tracking scripts" rule for everyone who never watches. Closing the window removes the player, which stops the video. A channel link, such as StatQuest, cannot be embedded, so it opens on YouTube.
- **Labels.** These are computed in `media.ts`, not stored:
  - anything on YouTube is a "Video lesson";
  - Google Skills paths are "Google's video lessons", no longer marked as certificates, because skill badges are not certifications;
  - other videos without a certificate are a "Short video lesson";
  - everything else keeps its type, such as "Course" or "Article".
- **Notices.** A resource can carry a `notice`, shown right under its link everywhere it appears. The Northwestern deepfake study uses one, because its site asks participants to be 18 or older.
- **Sign-off.** The owner confirmed that the content is reviewed. The `reviewed_by` and `verified_by` fields now name the owner, dated 2026-10-27, so the draft labels disappear and launch-mode validation passes. Future edits on the live site should update those fields when a person changes a record.

## 2026-10-31: Videos everywhere, Library, tracks, community and the pastel 3D look

- **Video lessons (RM-11).** 161 of 163 lessons now list up to three YouTube video lessons, picked by hand from search results limited to vetted teaching channels, then checked by script to exist and allow embedding. They are marked `UNVERIFIED` until the owner opens them (ED-4), so launch validation lists them. The bottom-of-lesson list is gone; the full RM-4 card stays for the best course, and every panel item has a Details toggle with the RM-4 facts.
- **Featured channels.** content/channels/ holds 14 channels (Krish Naik, Jeff Su, Tina Huang, CampusX, codebasics, 3Blue1Brown, StatQuest, Andrej Karpathy, IBM Technology, freeCodeCamp, Aishwarya Srinivasan, ByteByteGo, Dave Ebbelaar, Apna College) with five or six videos each, shown at /videos. No channel called "The data science girl" was found; the owner was asked which channel was meant.
- **roadmap.sh.** The one roadmap.sh resource was removed; its two lessons now start with a video lesson.
- **Library and tags (RM-10).** /library lists lessons, video lessons and skills, filtered by kind, topic, level, channel and search, with the filters in the address.
- **Tracks (RM-12).** Data structures and algorithms and System design are topic tracks (six deep lessons each), not roles, linked from the six coding roles. Lessons are drafts awaiting the owner's review.
- **Continue where you left off (AC-6).** Migration 20261031000000_last_lesson.sql adds profiles.last_stop_id; the claim reads it apart from the main state, so a database without the column still works.
- **Community (CM-1).** The owner chose an external Discord or WhatsApp group. Links live in content/community/community.yaml; with none set, the page says it is launching soon.
- **Pastel brand and 3D (MO-5).** The owner chose WebGL across the site. three.js 0.186.1 renders one network scene per header, loaded on view, paused off screen, still under reduced motion, skipped on data saver, with the drawn cover as fallback. Buttons and links moved from emerald to violet. Design guidance came from the taste-skill and Anthropic frontend-design skills, reviewed and vendored in .claude/skills.

## 2026-11-01: Search and AI answer visibility (SE-1 to SE-7)

- **The live site was hidden from every search engine** (`Disallow: /` and noindex) because ALLOW_INDEXING was never set. The owner asked for the site to be visible in search and AI answers, so indexing now follows VERCEL_ENV=production; previews stay hidden and DISALLOW_INDEXING=1 is the off switch.
- **Research basis.** AI answer engines mostly cite pages that already rank, favour a complete answer near the top of the page, fresh dates, clear structure and named reviewers; ChatGPT search uses Bing's index, so the owner should also submit the sitemap to Bing Webmaster Tools. Vendor GEO figures were not relied on.
- **Answer-first.** Each lesson gained a hand-written `answer` (175 in all) shown as Quick answer and used as the description, llms.txt and structured data.
- **Writing audit.** Lessons scored a median Flesch reading ease of 65.5 (plain English, about grade 7) with only nine AI-sounding words, so they were edited, not rewritten: four filler words replaced and 43 of the longest sentences split in the hardest lessons. Interview answers scored 55 to 60, appropriate for spoken answers.

## 2026-11-01: books with affiliate links (BK-1 to BK-4)

The owner asked for highly rated books on AI, ML, DSA, system design and RAG, placed wherever they fit, to earn affiliate commission. We added 34 books, each checked to exist on Open Library, with an editor score from 0 to 5. They appear on /books, on topic pages (up to four) and on lesson pages (up to two). The order comes only from the editor score and level (ED-2); the ordering file is in the ED-2 test. Every buy link is labelled as an affiliate link and points to /disclosure. Buy links are Amazon India searches by title and author, so they always land on the Indian editions; /go/book adds the owner's Associates tag from AMAZON\_IN\_TAG. Amazon ratings could not be read automatically, so the scores are editorial and should be reviewed by the owner.

## 2026-11-01: sign-up gates the PDF, the mock interview and saved progress (AC-1, SU-1, SU-2)

The owner asked that the site's real value need a sign-up, with quick options including Google and email and password. Decisions, confirmed by the owner:

- **Sign-up options:** Google, GitHub, email and password, and the email link as a fallback. This amends AC-1, which was email link only.
- **What needs an account:** the roadmap PDF, the mock interview, and saving progress and practice. Lessons, roadmaps, videos, glossary, blog, books, interview questions and the placement test stay open, so search engines and AI answers keep reading them (SE-1).
- **Under-18s:** accounts stay 18+ only (PV-2). The owner chose not to keep a no-account path for gated features, so under-18s can no longer download the PDF or use the mock interview.
- **Sites without accounts:** with accounts off (no Supabase settings, as in CI and local development), nothing is gated.

## 2026-11-02: more behind sign-up, a papers library, Rust and AI-tool guides, a new 3D hero (SU-3, IQ-9, LB-1, LB-2, MO-5)

The owner asked for these seven things:

- **AI tools page order:** "Ask me from my book" now comes first.
- **AI tools behind sign-up:** every AI tool needs a free account (SU-3).
- **Interview answers by role (IQ-9):** one page with all questions and answers for a role. It sits behind sign-up; single question pages stay public for search.
- **Papers library (LB-1, LB-2):** research papers and free AI books, with downloads behind sign-up. We link only to copies the authors or publishers host, never our own copies (BK-3). Paper details were checked against arXiv.
- **Rust:** a Rust topic of seven deep lessons, and a blog post whose quotes link to their sources: Musk's X posts, Google's Android security blog, The Register on Microsoft, and the kernel mailing list.
- **AI-tool guides:** six deep guides on Claude Code, n8n, Vapi, Claude animation, Veo and Flow, and Gemini and Midjourney images. Videos were chosen by YouTube view count and checked to embed.
- **3D hero (MO-5):** the particle "mind" is replaced by an iridescent liquid orb with an orbiting ring of light.

All new lessons, terms and video picks are marked for owner review.


## 2026-11-02: the home page becomes a road flight (MO-6)

The owner disliked both the particle mind and the orb on the home page and asked for a full revamp with 3D scroll effects. Of three concepts they chose the roadmap flight: the road is the product's own metaphor (a roadmap per role), so the motion tells the story instead of decorating it. Home page only for now; other pages keep the orb headers until the owner decides. GSAP and Lenis were added (exact versions) because scroll-linked reveals need ScrollTrigger and the brief asked for smooth scrolling; Lenis is the only smooth-scroll engine and is skipped entirely under reduced motion. Copy sits on solid, slightly translucent cards and a reading-side veil so contrast does not depend on the frame of the scene.

## 2026-11-02: the road and the motion go site-wide (MO-7)

The owner liked the home page road and asked for it on the other pages, with smooth animation, interactive touches and scroll effects throughout. One motion system (SiteMotion in the root layout) replaces the home-only one and the old Reveal component: it re-runs on every route change, animates only what is below the fold, moves transforms and clipping rather than opacity, and does nothing under reduced motion. The orb scene (scene-3d) is removed because nothing uses it.

## 2026-11-02: page headers get particle sculptures, not the road (MO-8)

The owner did not want the same road on every page and asked for particles instead, a different shape per page that stands for it, and more interesting than the first particle scene. The home page keeps the road. Every other header gets a particle sculpture: 30 hand-built 3D shapes (compass, microphone, bookshelf, trophy, globe and so on) plus a few of the site's line icons given depth, chosen per page or, for lessons, topic pages and role roadmaps, per topic. The shapes are pure functions with unit tests. The scene stays in its card beside the title, never behind text. In dark mode the particles glow additively but each stays faint so the theme colours survive.

## 2026-11-02: sign-ups on hold until sign-in is set up (SU-4)

Google sign-in and the other providers are not configured yet, so sign-up does not work and the owner could not reach the gated features. Rather than remove the gates, one switch puts the whole site into the accounts-off mode CI already tests: everything open, progress on the device, no prompts. It is on by default and lifted with NEXT_PUBLIC_SIGNUPS_OPEN=true in Vercel. The AI helpers stay off during the hold: they need a signed-in, confirmed 18+ learner for PV-2 and for the per-learner daily limits and monthly spend cap (CO-1). Opening them to anonymous visitors would change PV-2 and the cost guard, so that is left to the owner.

## 2026-11-02: AI tools work without an account (SU-5)

The owner asked for the AI tools to work without sign-up or sign-in. This relaxes the earlier rule that AI is for signed-in learners aged 18 or over (PV-2 as applied to AI in SU-3): the owner's decision. Spend stays bounded: visitors without an account are counted by a short hash of their address that rotates daily (the address is never stored, and nothing about the request itself is kept), with the same per-kind daily limits and burst limit as learners, and their spend counts toward the one monthly cap. The AI guard now uses the service key directly, so it keeps working while sign-ups are on hold (SU-4). Needs the 20261102000000_ai_guests migration applied to the production database; until it is, guest AI calls fail closed with "AI is not available right now" and no money is spent.

## 2026-11-02: particle sculptures without the card (MO-8)

The owner asked to drop the rectangle around the sculptures, make them fill the space and make the particles clearer. The card is gone, the scene is larger (up to 26 by 18 rem), the camera sits closer, and each particle is a smaller, crisp dot with only a faint halo in dark mode. Lesson headers, which are already in the topic's colours, use white particles.

## 2026-11-02: the home road stays sharp after in-site navigation (MO-6 fix)

Coming back to the home page through a link drew the road zoomed in until a refresh. The page-enter animation (MO-1) transforms the page container for a moment, and a transform on an ancestor makes a fixed layer size itself to that ancestor, so the road measured itself as the whole page (about 7,800 px tall) and kept that size. The road now re-measures whenever its box changes (ResizeObserver), and the page-enter animation skips the home page, which has its own intro. An e2e test navigates to the home page in-site and checks the road's drawing buffer keeps the screen's shape; it fails without the fix.

## 2026-11-02: sharper particles on phones, a clearer Practice shape, a lighter home page (MO-8, MO-6)

On phones the sculptures looked blurry: the scene drew at most 1.75x while phone screens are 3x, so it was upscaled, and in dark mode additive glow merged dense shapes into white blobs. The scene now draws at the screen's real resolution (up to 3x on small screens, 2x on large), every particle is a hard-edged dot with normal blending in both themes, phones get fewer and smaller particles, and the AI tools network has fewer nodes and thinner links. The Practice page's fanned cards were not recognisable, so it is now a stack of flash cards with a large question mark. The home page's search and topic-chip block is gone: search is in the header on every page and the Library has every filter.

## 2026-11-02: new learner tools, and fewer AI tools (PG, JB, WP, RV, AI-1, CM-2, PR-9)

The owner chose what to build next from an analysis of gaps: a code playground, jobs and salaries, a weekly study plan and a resume review; not certificates, shareable profiles or AI project review for now.

- Code playground: Pyodide in a Web Worker, loaded from jsDelivr at a pinned version, so code runs on the learner's device with no server cost; only an explicit "Explain this error" sends code and error to the AI tutor.
- Jobs and salaries: salary sources disagree widely, so each role shows middle-of-the-road bands by experience with the checked date and the sources, the same honesty as RM-6 for prices. Live openings are search links to Naukri and LinkedIn (as the owner asked), so they never go stale.
- Weekly plan: built on the device from the roadmap and the hours chosen. Email or WhatsApp nudges need sign-ups and a paid sending service, so the reminder is a calendar event (Google Calendar link or .ics) that works today without an account.
- Resume review: the file is read in the browser with the same PDF reader as Ask me from my book; only the text goes to the model for one review. Word files are saved as PDF first rather than adding a parser.
- The owner removed "Generate a course on anything" and "Change your roadmap with AI", merged the personal coach into the AI tutor (one assistant: in every lesson and on its own page; its daily limit rose from 30 to 40 to cover the coach's use), removed the Community page in favour of direct WhatsApp links, and asked for the glossary to be visible from Practice.

## 2026-11-03: "Sound familiar?" comes right after the home hero (MO-6)

The owner moved the problems learners recognise to directly under the hero, so a visitor sees their own situation first and then the solutions (roles, features, practice). The section keeps each problem's fix and link, with one line introducing it.

## 2026-11-03: the home page rewritten around how visitors decide (MO-6, JB-4)

The owner chose the hero "Everything you need to learn AI, in one place, in the right order." and asked for the whole page to connect, convince and feel safe. The page now follows the visitor's decision: the promise; the market as proof (three sourced, dated figures: 23 lakh AI openings by 2027, +32% AI hiring in 2026, 16% of IT professionals with AI skills); their problems in their own words, including "not from a tech background" and "only a few hours a week"; how it works in three steps; the four milestones (roles, learning, getting hired with the resume review, jobs and weekly plan); a trust section of promises a visitor can check (no paid rankings, dated prices, plain English, no sign-up to start, honest market figures) with what is inside counted; a low-commitment final step; and an FAQ that answers "is it free", "how is this different from YouTube" and, honestly, "will this get me a job". No testimonials or superlatives are used, because none can be backed yet. The word "free" stays out of the hero (an earlier decision); the FAQ answers it.

## 2026-11-03: a brand system and the high-priority design fixes (BR-1 to BR-4)

After a design review, the owner asked for every high-priority fix, aiming for a world-class platform. What changed and why:

- One brand: the logo's blue "AI" and the teal-and-orange mascot did not match the violet site, so both are now violet (with teal details on X Bot). docs/brand.md writes the system down so new pages stop inventing their own.
- Fewer colours: the code used 14 colour families. Pink, fuchsia, orange, indigo, cyan, blue and red were folded into violet, teal, amber, rose and sky; links that were green are violet, and green now means only "done". A unit test keeps it that way. Topic art keeps its wider illustration palette.
- Calmer surfaces: the fixed pastel washes behind every page and the see-through white cards made everything look the same weight. Pages are solid, cards are solid white, and colour lives in headers and the home sky. The headline gradient ends in teal-700 so both ends pass contrast.
- Buttons: 11 hand-made buttons in three heights became the shared pill in three sizes; 22 controls at 36 to 40 px are now 44 px. The red "Watch here" buttons that outshone the main action are secondary. The header's "Get started", vague while sign-ups are paused, now says what happens: Start learning, Continue learning, Sign up free or My progress.
- Content first: inner page headers are compact and drop the sculpture on phones (hub pages keep the full one). A roadmap leads with "Start the first lesson" (or "Continue learning"), and the PDF button is secondary inside its banner, which keeps RD-1's visible banner. Lessons on phones put the answer first, videos after the first part, tags at the end and Learning, Done and Skip in a bottom bar. The Library folds filters on phones and names levels in words. Labels are sentence case and the menu is 14 px.
- X Bot greeted on every visit until opened; it now greets once, ever, hides the bubble after a few seconds and is 48 px on phones, lifted above the lesson bar.
- The home road ran behind the hero text on wide screens; the camera's view is now offset so the road runs on the right, with a stronger veil behind the text.
- Trust: /about, /privacy and /terms are new and linked from the footer. The privacy page lists only what the code actually stores and who processes it; there are no analytics scripts today, so it says so. It needs a lawyer's review before sign-ups reopen (PRD, Privacy section), and the owner should set NEXT_PUBLIC_CONTACT_EMAIL so privacy requests have an address. The About page has no founder story yet because none was given.

## 2026-11-03: the founder's story on the About page (TR-2)

The owner wrote his story with Claude over several drafts and approved the final text. It sits on the About page rather than a page of its own, with a "Meet the founder" link in the footer, because the About page is where visitors look for who is behind a site. His current employer is described as "one of the world's top automotive companies" at his request; Amazon is named with his permission. The claim that every course and video is free to learn was checked against the content (574 free, 6 free with a paid certificate); books cost money, so the story speaks only of courses and videos. The photo is his own, cropped to a 4:5 portrait.

## 2026-11-03: medium-priority design fixes (BR-1, NV-1 to NV-3, A11Y-1 to A11Y-3)

- Type: Geist alone read as the default look of many sites. Headings now use Bricolage Grotesque, chosen over a serif display face because a friendly grotesque fits a patient, plain-English voice and stays readable at small heading sizes. It is self-hosted from an npm package (pinned) because the build has no network. Card descriptions moved from 14 to 15 px and the last 10 to 11 px reading text to 12 px.
- Menu: seven flat links with overlapping names became three groups and AI tools, each link with a one-line note, plus a "you are here" marker. The phone menu, a small floating box, now fills the screen. The header's own backdrop blur would have trapped the full-screen panel inside the bar, so the bar turns solid while the menu is open.
- Accessibility: lesson headers faded to near-white on several topics (as low as 1.3:1 for white text); blending the light colour in only a third of the way plus a 22% dark layer gives at least 4.5:1 on every topic. A sweep of 28 page types in light and dark, at 360 and 1280 px, found one more failure (small grey text in dark mode on the home showcase), now fixed; a dark-mode check joins the e2e suite. Loading text became shaped placeholders.

## 2026-11-03: AI tools shown as apps, not folders (AI-1)

The owner found the AI tools cards, a big coloured banner with one icon each, read like folders. Product launchers (app stores, Raycast, Notion and Linear integration directories, the Google Workspace app grid) show a tool as an app icon, its name, a status, one line on what it does and an Open button, so the page now does the same. Each card also says what you give the tool and what you get back, tools are grouped by the job (Study, Practice, Get hired, Go deeper), and AI-powered tools say "Uses AI" and show "Paused" while AI is off, while the others say "No AI needed". The "Most popular" and "New" badges were dropped because no usage data backs them. "Ask me from my book" stays first (SU-1). The page uses the compact header so the tools start on the first phone screen.

## 2026-11-03: a Sign in link that is always there (AC-6)

After sign-ups reopened, the owner could not find a way to sign in. The header's one button said "Continue learning" for anyone who had opened a lesson, which hid sign-in for exactly the returning visitors most likely to want an account. Signed-out visitors now always see a "Sign in" link next to the main button on larger screens, and a "Sign in or create an account" button under the main action in the phone menu. Signed-in learners and sites with accounts off see neither.

## 2026-11-03: the dashboard crashed on Vercel once accounts were on (fix)

After the owner reopened sign-ups, /dashboard showed "This page couldn't load" for everyone, signed in or not. With accounts on, the dashboard is partly dynamic, so on each request Vercel re-renders it, and that render reads the lesson files in content/ (for the "Continue" card and the signed-in panel). Those files were only shipped with API routes, so on Vercel the read failed; locally the folder is always there, and CI runs with accounts off, so no test reached this path. content/ and data/ (about 9 MB) now ship with every route. The traced files for /dashboard went from 195 to all 1,844.

## 2026-11-03: the dashboard's second crash, the share-image logo (fix)

With the content files shipped, the signed-in dashboard still crashed on Vercel, now with "ENOENT: public/brand/xplaind-wordmark.png". The root share image belongs to every page's metadata, and its helper read the logo when the module loaded, so every dynamic page needed a file only the share-image routes shipped. The logo is now read only when a share image is drawn, a missing logo draws the card without it instead of failing, and the logo ships with every route. A new CI step, `npm run check:traces`, fails when any route's bundle lacks content/, data/ or the logo; on the old configuration it reports 83 of 86 routes.

## 2026-11-03: two intermittent e2e failures, root-caused

CI on the dashboard fix failed two tests that had failed now and then before.

- Mock interview report: the simulator seeds its question pick from Math.random, and the test types one fixed answer. When that answer matched no key point of the questions drawn, no "You said" quote appeared. The test now fixes Math.random, so the same questions come up every run (8 of 8 under parallel load, was failing at random).
- Roadmap section links at desktop width: two real races, fixed in the site. The CSS smooth scroll (html scroll-behavior) could still be running when Lenis started and froze it half-way, and the roadmap's sections move by hundreds of pixels while it hydrates, so a glide aimed at the old position stopped short. CSS smooth scrolling is gone; Lenis now glides in-page links and lands exactly on the target when the glide ends (and checks again 500 ms later), and a link clicked before Lenis loads is landed again once it does. What remained was headless Chromium drawing the header's particle scene in software, which starved the smooth scroll for seconds under four parallel workers; that layout test now runs with reduced motion, so it checks the layout and the link, not the animation (252 of 252 under load).

## 2026-11-03: voice answers on iPhone stopped after the first question (VS-1 fix)

The owner's mock interview on an iPhone heard the first answer but not the second, although the timer ran and "Listening…" showed. Every iPhone browser uses Safari's speech engine, which runs one recognition at a time and gives a new recogniser no audio while the previous one is still shutting down; the simulator made a new recogniser for each question. It also restarted recognition by itself after a pause, which iOS may refuse when no tap started it, while the screen still said "Listening…". Now one recogniser serves the whole interview and is aborted between questions, and a sound check turns the microphone off with a plain message ("isn't picking up any sound… tap to try again, or type") if no audio arrives within 5 seconds of a start or an automatic restart. Two e2e tests use a stand-in that behaves like Safari's engine; both fail on the old code and pass now. It still needs a check on a real iPhone.


## 2026-11-04: roadmap topic panel, shorter home page, guide covers (RM-13, BR-5, BL-1)

Testers and the owner found the home page too long to read and roadmaps slow to scan. Tapping a roadmap topic now opens a side panel with the plain answer, key terms, the status buttons and the best course, so a learner can judge a topic without leaving the roadmap. Home page cards were cut to one short sentence each, keeping every section and promise. Every guide got its own cover picture with no text in it, used on cards and as the share image.

## 2026-11-04: Google sign-in on our own domain, playground starters, menu moves (AC-1a, PG-5, NV-1)

Google's sign-in window showed the Supabase address, which looked like spam to the owner, so the form now uses Google's own button and verifies the token on xplaind.in. The playground gained grouped starter programs (warm-ups, AI ideas) so learners have something to run straight away. Papers and free books, and the weekly plan, moved into the menu groups where people looked for them. A learner who already has an account is now told so, instead of being asked to check their email.

## 2026-11-06 to 07: the owner's lists of 6 November (RM-14, RM-15, AC-12, MB-5, MB-6)

A batch of owner requests. The black text diagrams in lessons became clean drawn flow diagrams, because they looked broken on phones. Lessons got an "On this page" column on the left on wide screens. XP, ranks and badges were removed: points did not motivate learners and confused them; streaks and progress stay. "Ask me from my book" became "Study from my notes & books" and can make flashcards as well as tests. Month-based duration estimates were removed from the site at the owner's request.

## 2026-11-07: testimonials, cheatsheets and the Interview section (SO-1, CS-1, IP-1 to IP-3)

Testimonials are shown only in users' own words, with permission, and the section hides when there are none; samples appear on previews only. Research on interview-prep demand led to an Interview section modelled on how coding-interview sites teach patterns: named AI interview patterns, worked LLM system design answers in a 35-minute shape, and an Interview menu group.

## 2026-11-07: software engineering track and Commit to 90 days (SWE-1, CM-90)

At the owner's request, a software engineering and Git track was added for learners who need Git and basic engineering practice. For accountability, signed-in learners can opt in to a weekly email for 13 weeks with one-click unsubscribe; it is off by default and sent through Resend on a Vercel Cron schedule.

## 2026-11-07: the minimal look (BR-3)

The owner asked for a calmer, DataCamp-like site: plain white or dark pages, simple cards, less text and fewer badges, keeping only the home road and the particle headers. The pastel palette and card tilt animations were retired site-wide.

## 2026-11-07 to 08: videos by topic and video courses (VD-1, VD-2)

Videos were grouped by YouTube channel, which is not how learners search. /videos became one list filtered by topic, level and length, with view counts. Every DeepLearning.AI course and Andrew Ng's courses were added as video courses, shown in lesson panels and a Video courses tab, with embeddable ones playable on the page.

## 2026-11-08: cheatsheets paused, and the product focus (CS-3, FOCUS-1)

The owner paused cheatsheets ("we'll do this later"); the files stay in content and the pages redirect to Practice until a redesign is agreed. The owner also fixed the focus: Xplaind is a one-stop platform for AI education, and system design stays at its current basics, with no more system design content or features.

## 2026-11-08: book-informed lessons (LQ-1 to LQ-6)

To raise the depth of lessons, the owner chose a reference book (Chip Huyen, *AI Engineering*, O'Reilly 2025). Rule: lessons are written in our own words with Indian examples, the book is cited as further reading and never copied, and the PDF stays out of the repo. Eighteen new lessons in six reviewed batches of three, each with checks, glossary terms, resources and two interview questions, covered the book's main topics that had no lesson.

## 2026-11-08: Pro passes with Cashfree, in test mode (PAY-1 to PAY-6)

The owner asked for a way to earn without locking learning. Decision: every lesson, roadmap, video, practice set, interview answer and project stays free; Pro only raises daily AI limits. Passes are one-time (30 days, 6 months, 12 months) with no auto-renewal, which is simpler for Indian learners and avoids mandate rules. The owner chose Cashfree over Razorpay. Payments are confirmed by re-fetching the order from Cashfree (paid, in rupees, exact amount) before a pass is granted; the webhook is verified with Cashfree's signature. Under-18s cannot buy. Everything stays in sandbox until the owner sets live keys. On reusing the Cashfree account of the owner's other business: fine for sandbox; for live, Cashfree must approve xplaind.in on that account, or a separate account is opened.

## 2026-11-08 to 09: deepening every lesson (LQ-7)

After the book series, older lessons looked thin beside the new ones. The owner first approved batches of three (9 lessons), then asked for "the entire thing in a single shot": 74 more lessons in the AI-engineering themes in one PR, then the 11 classic ML lessons in another. Each gained runnable code, a "when not to" section, "From demo to production" and two flashcards. For the ML pass every code example was run for real on scikit-learn and PyTorch. Beginner, DSA, Rust, system design, software engineering, career, client-delivery and product lessons were left as they are by design. The owner reviewed and approved all of it, and on 9 November also approved the remaining 24 lessons, 37 glossary terms and 1 guide that were still drafts.

## 2026-11-09: PRD status review and unique IDs

A pass compared the PRD with the build. Superseded rows and features not built yet (PL-7, part of PL-8, spaced repetition, the weekly link check, /admin, landing email capture) are marked at the top of the PRD and on each row. Five requirement IDs had been used twice; the later meanings were renamed (SWE-1, BR-8, BR-9, AC-12, IQ-10). The sitemap's page date was bumped and /llms.txt now lists the Interview section's pages, projects, AI tools, books, papers, jobs and pricing.

## 2026-11-09: one free AI try, then sign in (AG-1), and three smaller changes

The owner wanted to stop AI spend from anonymous visitors that brings no sign-ups, and asked for one free sample before sign-in. The gate counts every AI tool together (one try a day), uses the existing daily-rotating visitor hash, and switches on only when sign-ups are open: while sign-ups are on hold no one could sign in, so turning it on earlier would simply break the AI tools. Under-18s, who cannot hold accounts, keep the one free try. Sign-in uses the existing site-wide prompt with Google and an email link; progress and practice already move to the account on first sign-in (AC-2), while notes and books stay on the device by design (MB-4).

The About page now makes the promise exact: every roadmap, lesson and course pick is free, forever. A Pro paragraph appears only once Pro is open and names only what Pro really does (more AI help each day). The owner chose not to advertise features that do not exist yet, such as code review or capstone grading.

Lessons already ran Python in place (PG-4), but the button also appeared on code that cannot run in a browser (model SDKs, servers, PyTorch). It now appears only where Pyodide can run the code, and 34 technical lessons that had none gained a short "Try it in your browser" example, each run before it was added. On phones, X Bot now tucks half off the edge while the reader scrolls down, so it never covers lesson text or buttons.

The owner asked to leave old URL redirects for now: no blog slug has ever changed in this repo and no /path/ route ever existed.

## 2026-11-10: no AI and no full roadmaps without an account (AG-1, RG-1)

After testing the one-free-try gate, the owner decided that nobody should use any AI tool without signing up, and that roadmaps should need an account too. AI calls from visitors without an account are now refused before anything is spent, and the AI tool pages show a sign-up card. For roadmaps the owner chose a preview: signed-out visitors and search engines see the first stage (or the first three steps of a Generative AI level), then a sign-up card, so the pages stay in search results while the full path needs an account. Lessons, topics, practice, projects and the blog stay open. Under-18s cannot have accounts, so they lose AI and full roadmaps; the card points them to the open lessons by topic. The roadmap gate runs in the browser, so it is a sign-up prompt rather than a lock on data that is public through the lessons anyway. Both gates switch on only while sign-ups are open.

## 2026-11-10: search-led titles, brand structured data and two keyword guides (SE-8)

The owner saw Google answer "Xplaind" with xplaind.com, an unrelated accounting site, while xplaind.in had almost no pages in the index. The fix has three parts. First, the brand: the home page now gives Google WebSite and Organization structured data (name, alternate names, logo, founder, audience), and a visible FAQ says what Xplaind is and that it is not xplaind.com, so AI answers stop mixing the two up. Second, titles and descriptions: every public template now leads with what people in India actually search for, taken from Google India autocomplete because no keyword-volume tool was connected (the map and its limits are in docs/seo-keywords.md). On inner pages the search words win over the brand: " | Xplaind" is added only when the full title still fits in 60 characters. Titles are in Title Case only where a template builds them from names; prose stays in sentence case. Third, content: two new guides for the largest clusters, "how to become an AI engineer in India" and "free AI courses with certificate", built only from the site's own checked data (the course list, salary bands, roadmap) and two sources checked on 10 Nov 2026 (the government's YUVA AI for All announcement and nptel.ac.in). They are marked as drafted with AI and not yet reviewed by the owner.

Amended the same day, owner decision: "Let's not brand and position ourselves as free; focus on the outcomes and values the site provides." The word "free" is gone from everything that describes Xplaind: page titles and descriptions, the home hero label and FAQ ("Is Xplaind free?" became "What will I be able to do at the end?"), sign-up buttons ("Sign up", "Create your account"), the AI limits ("4 of 10 AI turns left today"), the pricing page (the tier is now "Standard", ₹0) and the structured data. As in the 26 Oct decision, "free" stays only as a true fact about an outside course or book: cost labels, the "Free only" filter, "free certificate" notes, books shared free by their authors, and the free-courses guide, whose subject is outside courses. Indexing still depends on the owner: verifying the site in Search Console and Bing, submitting the sitemap, and earning links from other sites. Those steps are listed in docs/seo-keywords.md.

## 2026-11-11: menu icons, feature deck, error and loading states, more video courses (UX-1 to UX-4)

The owner pointed to StudyFetch's menu and feature cards as the feel they want. The menu now gives every item an icon on a soft coloured tile. The home page's three long feature sections (Learn, Notes, Get hired) became one deck of six cards behind tabs, built as Xplaind's own design rather than a copy: our colours, our mock-ups, our copy. The page is about a quarter shorter on phones. MB-6 still holds, because "Study from my notes & books" keeps its own card and button.

The site had no error or loading pages, so any hiccup showed the framework's bare "Application error". The most common cause for a site that deploys often is a page left open across a release, which asks for code files that no longer exist. The new error page reloads once in that case, and offers "Try again" otherwise. The owner's screenshot of the error was not attached, so this fixes the likely cause, not a confirmed one. A top progress bar and a loading mark show that a tap was heard.

Smaller requests: the header button says "Get started"; the footer had both "Your progress" and "Your dashboard" pointing to the same page, so it keeps one; the Video courses tab adds courses from Anthropic, Google, Microsoft, Harvard, fast.ai and NVIDIA, with a "From" filter, and its button says "Start the course".

The Google sign-in window showed the Supabase address because NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in production. Google's own button (AC-1a) is already built and switches on with that setting; the steps are for the owner. Ideas for "Study from my notes & books" from studying StudyFetch are in docs/notes-tool-ideas.md, for the owner to choose from.

## 2026-11-11: only "Sign up" and "Sign in" (AC-12)

The owner, already holding an account but signed out on a phone, was told "Create your account" on a roadmap, and the phone menu offered "Get started" next to "Sign in or create an account", which mean the same thing. Every account prompt now offers the same two buttons, "Sign up" and "Sign in", and the sign-in dialog opens on whichever tab was chosen. The header's main button says "Sign up" (it said "Get started" since earlier the same day), and "Start learning" shows only while accounts are switched off.

## 2026-11-12: sign-in timeout; reading line on phones (AC-13, MO-2)

Sessions renewed themselves forever. The owner chose: signed out after 7 days without a visit, and always after 30 days. Supabase's own session limits are a paid-plan setting, so the app enforces them: a first-party cookie records the last visit, the browser checks on every page and the proxy on account pages and APIs. The lesson's reading-progress line was inside the page's entrance animation, whose transform made the "fixed" line scroll with the content on phones; it now lives on the page body.


## 2026-11-12: how the site earns money, now with Pro passes (PAY-1, ED-3, BK-2)

The owner asked for the trust pages to reflect the paid plans. "How we rank", the affiliate disclosure and About now name two sources of income: Pro passes and book commissions. The passes are one-time payments for 30 days, 6 months or 12 months, with no auto-renewal, so the pages call them passes, not subscriptions. While passes are not on sale (PAYMENTS_MODE unset), the pages say "coming soon" or "not on sale yet" and link to /pricing only once it sells. A new ED-2 test checks that the ranking files never read billing, passes or plans, so the line "Pro never changes a ranking" stays true.

## 2026-11-12: the study loop for "Study from my notes & books" (MB-8 to MB-10)

The owner asked for the "study loop" proposed in docs/notes-tool-ideas.md (ideas 1 to 3): ask your notes, test, retest what you missed, with spaced repetition in between.

- **Ask your notes runs on the fast model with its own allowance (`notes`).** One question costs a fraction of a test, and sharing the `book` allowance (2 a day on a free account) would make a chat useless. The browser picks the matching passages, so the file still never leaves the device whole; with no matching passage there is no AI call at all.
- **Grounding is checked, not trusted.** An answer is shown as "from your notes" only when one of its quotes is found word for word in the passage it cites; otherwise the learner sees "not in your notes". This keeps the tool's promise that every answer shows its page.
- **The file is still not stored.** A retest needs passages from the weak sections, so if the file is not open the learner opens it again; it is matched by title. Keeping the book's text on the device (IndexedDB) would remove that step, but it changes the "we keep no copy of your file" promise; left for the owner to decide.
- **Spaced repetition is a simple Leitner schedule** (1, 2, 4, 8, 16, 32 days) kept with each deck on the device, and missed test questions can become a review deck without AI. Interview practice keeps its own order (IQ-10 is unchanged).

## 2026-11-12: a narrower product (FOCUS-2)

The owner asked for a focus review and chose four of its recommendations.

- **AI roadmap generator removed.** It competed with the nine hand-built roadmaps, which are the product, and every use cost a call on the strongest model. Old links go to /paths. Roadmaps saved by it on a learner's device are no longer shown.
- **X Bot merged into the AI tutor.** Two chat helpers made people unsure which to ask. The floating bot, its instant answers and its API are gone. Its "how do I use the site" notes now feed the tutor on /ai/tutor, so the tutor can point to the right page. The tutor inside lessons stays grounded in the lesson only.
- **Weekly plan and 90-day emails merged as "Stay on track"** at /plan. The plan and calendar reminder work without an account; the Monday email opt-in shows to signed-in learners and asks others to sign in. It is hidden when accounts are off.
- **Rust track dropped** as off-topic for AI careers. Lessons, the blog post, the Rust-only glossary terms and the Rust-only resources were deleted; old URLs redirect permanently so search engines move on. DSA, system design basics and software engineering stay because AI job interviews use them.
- Not chosen: removing jobs and salaries, and demoting "Study from my notes & books".
