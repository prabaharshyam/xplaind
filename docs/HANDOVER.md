# Xplaind handover

Written 2026-11-08, after PR 43. Its job: let a new Claude account, attached to this repository with no memory of earlier chats, understand the product, the owner, the code, the rules and the unfinished work, and carry on building.

If you are that Claude: read this file first, then `CLAUDE.md`, `AGENTS.md`, and the requirement rows in `docs/PRD.md` for whatever you are about to change. The rest of `docs/` is background; section 14 says what each file is.

This document holds no secrets and must never hold any. Keys live in Vercel and Supabase settings, not in the repo.

---

## 1. First hour checklist

1. Read `CLAUDE.md` (the project rules, short) and `AGENTS.md` (Next.js 16 is not the Next.js you know; read `node_modules/next/dist/docs/` before writing framework code).
2. Run `npm install`, then `npm run check` (lint, typecheck, unit tests, content validation). Everything should pass.
3. Run `npm run dev` and open the home page, a roadmap (`/roadmap/ai-engineer`), a lesson (`/stop/rag-app`), `/videos`, `/interview`. Look at it in light and dark, at 360 px wide and at desktop width. Most owner feedback is about how pages look and read.
4. Skim `docs/PRD.md` headings and the newest rows (PAY-1 to PAY-6, LQ-1 to LQ-7, VD-1, VD-2, BR-4, CS-3, FOCUS-1, CM-90, IP-1 to IP-3, SE-1). Requirement IDs such as `RM-2` are the spec and go at the start of every commit message.
5. Read section 3 (the owner) and section 12 (what is pending) before proposing anything.

Starter prompt you can paste into a new Claude session:

> You are taking over the Xplaind repository from a previous Claude account. Read `docs/HANDOVER.md` fully, then `CLAUDE.md`, `AGENTS.md` and the newest rows of `docs/PRD.md`. Run `npm run check` to confirm the baseline. Then tell me in a few plain sentences what the product is, what is pending, and what you would do next. Do not change anything until I confirm. Merge only when I say "merge it".

---

## 2. The product

**Xplaind** (https://xplaind.in) is a free-first, plain-English AI learning platform for India. Positioning decided on 2026-11-08 (FOCUS-1): **a one-stop platform for AI education**. It is not a general interview-prep or system-design site.

What a learner gets:

- **Nine role roadmaps** (AI Engineer, Generative AI and LLM Engineer, Forward Deployed Engineer, AI Product Manager, Agentic AI Engineer, AI Automation Specialist, AI Governance and Compliance Specialist, Machine Learning Engineer, MLOps Engineer). Each is an ordered route through one shared library of lessons.
- **About 198 lessons**, each in one format: a one-sentence answer, what it is, how it works, a worked example, common mistakes, practice, key terms, a best course, videos, a quick check, and an AI tutor. Most are "deep lessons" with a diagram, a table, flashcards and an exercise.
- **Learning tools**: a topic library, a glossary of 315 terms, 23 guided projects, 361 videos filterable by topic, papers and free books, a Python playground that runs in the browser, a weekly study plan, and a placement test.
- **Interview practice**: a question bank (175 questions with rubrics), flashcards, a timed mock interview with browser speech-to-text and a report, 28 interview patterns, and 10 worked system design answers.
- **AI tools** (need Claude API keys on the server): an AI tutor, an AI roadmap generator, "study from my notes and books" (turn a PDF into a test and flashcards), a resume review, answer grading, and the X Bot mascot.
- **Career**: jobs and salaries by role, live openings.
- **Accounts** (Supabase, currently held back by a switch, see 6): progress saved to the account, roadmap PDF downloads, weekly email plan.
- Trust rules: no ads, no sponsored placement, no paid ranking, affiliate links (books only) are labelled and never change order, prices always show the date they were checked.

Who it is for: learners in India, from freshers and career-switchers with no coding background to working engineers. Tone: plain English, short sentences, Indian examples (Chennai, Pune, Bengaluru, rupees, UPI).

Scope decisions to respect:

- **System design stays at the basics** (FOCUS-1). The 6 system design lessons, 28 interview patterns and 10 worked answers stay. Build no more system design content or features, for example no system design mock interview.
- **Pro plan pop-ups were deliberately skipped.** Do not add upsell pop-ups unless asked.
- **No XP, ranks or badges.** A streak and progress counts only.
- **Cheatsheets are paused** (CS-3). The 12 sheets are still in `content/cheatsheets` and validate, but there are no pages.

---

## 3. The owner and how they work

**Owner:** Shyam Prabahar (prabaharshyam@gmail.com), solo founder. The About page has his story.

How he works with Claude:

- He gives numbered lists of changes, often with screenshots of the live site. Do the list, show the result, then wait. He says **"merge it"** when he wants a pull request merged. **Do not merge without those words.**
- He answers questions briefly. Prefer one clear recommendation over a menu. Ask only when the answer changes what you do.
- He often reads or listens on a phone or while driving: plain sentences, short paragraphs, no heavy formatting in chat replies.
- He wants minimal, clean UI, in the spirit of DataCamp (the reference he named), with fewer badges and less text. Keep the home page road and the particle headers; the rest is plain white or dark pages with flat cards.
- He cares about **honesty**. Real testimonials only (he supplied five), never invented reviews or stats. The AI-drafted content is flagged until he reviews it.
- He buys domains and tools he does not end up using, so keep scope tight and avoid waste.
- Never ask learners their background (IT, marketing). The placement test finds the level. Ask only goal and weekly hours.
- Prefer free and very low-cost courses (the price cap in the content rules is 900 rupees, `PRICE_CAP_INR`), and make the value feel high.

Standing rules (also in `CLAUDE.md`):

- Editorial content lives in `content/` as files, validated by Zod. Never in the database.
- No ads, sponsored placement, or tracking beyond the analytics chosen in the PRD.
- Under-18 learners get no account and nothing stored on the server (PV-2).
- Code that ranks or orders resources must never read affiliate or commission fields (ED-2). The test for it must stay.
- Never show a price without its check date (RM-6).
- Weeks and dates use Asia/Kolkata.
- Mobile first at 360 px. WCAG 2.1 AA on the test, result, roadmap and stop pages (and in practice every page; the browser tests scan many).
- Commit messages start with the requirement ID.
- If the PRD is ambiguous or two requirements conflict, **stop and ask**. Do not guess.
- No model identifiers or session metadata in code comments, docs or PR text beyond the commit trailers the tooling adds.

Review sign-off: AI-drafted content carries `drafted_with_ai: true` and `reviewed_by: "UNREVIEWED"` until the owner says he reviewed it. Then set `reviewed_by: "Shyam Prabahar"` and `reviewed_on` to today (India time). Only mark what he actually said he reviewed. On 2026-11-08 he approved the 3 book-informed lessons and the 7 software engineering and Git lessons (with their quiz questions and glossary terms).

---

## 4. Accounts, services and where things live

| Thing | Where | Notes |
| --- | --- | --- |
| Code | GitHub `prabaharshyam/xplaind`, default branch `main` | Squash-merge pull requests. CI in `.github/workflows/ci.yml` |
| Hosting | Vercel, team `zaiphr`, project `xplaind` | Production at https://xplaind.in. Every push to a branch gets a preview at `xplaind-git-<branch>-zaiphr.vercel.app`. The Vercel bot comments on each PR when the preview is ready |
| Database and sign-in | Supabase project (reference `blgqdjtbzhrtiohepmvn` in `docs/supabase-setup.md`), Mumbai region | Postgres with row-level security, auth with Google, GitHub, email and password, email link. Set-up steps in `docs/supabase-setup.md` |
| Email | Resend | Used for the weekly "Commit to 90 days" emails (`/api/cron/weekly`). Needs a verified sending domain |
| AI | Anthropic API | Server-side only. Monthly spend cap and kill switch in settings. Default model is set in `src/lib/ai` and the `AI_MODEL` variable |
| Domain | `xplaind.in` | Older docs say `xplaind.ai`; the live domain is `.in` |
| Community | WhatsApp group, link in `content/community` | The Community page was removed; the site links straight to WhatsApp |
| Affiliate | Amazon Associates India | `AMAZON_IN_TAG` (set, 12 Nov). Books only |
| OAuth | Google Cloud OAuth client, GitHub OAuth app | Callbacks point at the Supabase auth URL |

**Environment variables.** Names only. Values live in Vercel (Settings, Environment Variables) and in `.env.local` for local runs. `.env.example` lists most of them.

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL for sitemap, canonical links, email links |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase settings |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-only database access |
| `NEXT_PUBLIC_SIGNUPS_OPEN` | `true` opens sign-ups. Unset keeps the whole site running without accounts (SU-4). Check its current state in Vercel |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Lets "Continue with Google" show xplaind.in |
| `ANTHROPIC_API_KEY` | **Secret.** AI features |
| `AI_MONTHLY_CAP_USD`, `AI_KILL_SWITCH`, `AI_MODEL`, `AI_FAST_MODEL` | Spend cap, instant off switch, optional model overrides (main model and the fast model for the tutor and X Bot) |
| `PAYMENTS_MODE` | `sandbox` or `production` turns Pro passes on (PAY-1). Empty keeps Pro closed |
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | **Secret.** Cashfree Payment Gateway keys; sandbox and live keys differ |
| `RESEND_API_KEY` | **Secret.** Weekly emails |
| `CRON_SECRET` | **Secret.** Protects `/api/cron/weekly`; Vercel sends it as a bearer token |
| `COMMIT_EMAIL_FROM` | Optional sender, default `Xplaind <hello@xplaind.in>` |
| `AMAZON_IN_TAG` | Affiliate tag for book links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address shown on the site |
| `ALLOW_INDEXING`, `DISALLOW_INDEXING` | Search engine control. Production is open to search engines unless `DISALLOW_INDEXING=1`; previews are never indexed |
| `CONTENT_LAUNCH=1` | Makes content validation strict (see 7) |
| `PW_CHROMIUM_PATH`, `CI` | Test tooling only |

The repository alone cannot tell you which of these are set in production or which Supabase migrations have been run. **Ask the owner or check Vercel and Supabase before assuming.**

Vercel cron: `vercel.json` runs `/api/cron/weekly` every Monday 03:00 UTC (08:30 India time).

---

## 5. Stack and architecture

- **Next.js 16** (App Router, Turbopack, **Cache Components on**), React, TypeScript strict, Tailwind 4, Zod, Vitest, Playwright with axe, GitHub Actions. Fonts are self-hosted (`geist`, Bricolage Grotesque) because Google Fonts fetch fails at build.
- **Cache Components rules you will hit:** reading runtime data (`searchParams`, cookies) in a page must happen inside a `Suspense` boundary, or the build fails ("uncached or runtime data during prerendering"). Run `npx next typegen` after adding or removing a route, or `PageProps` types and `.next/types` fail.
- **Content is read from files at build time** by `src/lib/content` (loader, Zod schemas, cross-file validator). Pages are static where possible.
- **Pure logic, no UI or database imports, with unit tests:** placement scoring and next-five-steps (`src/lib/placement`, `src/lib/roadmap`), video filtering (`src/lib/videos`), interview scoring, commitment emails (`src/lib/commit/plan.ts`). Keep it that way.
- **Language models:** `CLAUDE.md` says "Release 1 makes no language-model calls at run time". The owner later asked for the AI tools (2026-10-26, `docs/decisions.md`, "AI features with Claude"), so they exist as opt-in features behind a monthly spend cap, a kill switch, daily limits and input guards (`src/lib/ai`, migration `20261026000000_ai_guard.sql`). The core learning flow (roadmaps, lessons, tests, mock interview report) does not call a model. Nothing generated is stored on the server.
- **Supabase:** every table has row-level security and a test for it (`supabase/tests/rls.test.ts`). The learner role can read only its own rows. Server routes use the service role through `src/lib/supabase/server.ts` (`adminClient()`), always with explicit column lists.
- **Visuals:** the home page is a 3D road flight (three.js, `src/components/three`); page headers show particle sculptures. Lenis is the only smooth-scroll engine; GSAP drives motion. Card covers are drawn as line art in code (`src/components/art/line-art.tsx`). Respect `prefers-reduced-motion`.
- **Video lessons** play in a privacy-friendly embed (`youtube-nocookie`) that loads only after the learner presses play; thumbnails come through the Next image server.
- **Search and AI answer visibility:** sitemap, `llms.txt`, `llms-full.txt`, structured data, canonical links (SE-1 to SE-7 in the PRD).

---

## 6. Repo map

| Path | What it holds |
| --- | --- |
| `src/app` | Pages and API routes (App Router). One folder per route |
| `src/components` | Shared UI: `art` (covers, icons, line art), `home`, `roadmap`, `three`, `motion`, `ai`, `account`, `bot`, `playground` |
| `src/lib` | Logic: `content` (schemas, loader, validator, library), `placement`, `roadmap`, `interview`, `ai`, `account`, `supabase`, `commit`, `videos`, `plan`, `practice`, `nav.ts`, `themes.ts`, `levels.ts`, `dates.ts` |
| `content` | All editorial content, see 7 |
| `supabase/migrations`, `supabase/tests` | SQL migrations and row-level security tests |
| `e2e` | Playwright tests (Chromium at 360 px; some tests resize) |
| `scripts` | `content-validate.ts`, `check-traces.ts`, `fetch-video-views.ts` |
| `docs` | PRD and notes, see 14 |
| `public` | Brand assets, founder photo, blog images |
| `.claude/skills` | Design, 3D and motion skills for Claude Code (see `CLAUDE.md`) |
| `preview` | Early screenshots (historic) |

Scripts (`package.json`): `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `test:db`, `check` (lint, typecheck, unit tests, content validate), `content:validate`, `check:traces`, `videos:views`.

Navigation lives in `src/lib/nav.ts` (groups: Learn, Practice, Interview, Career, AI tools). A test (`nav.test.ts`) and the sitemap test (`src/app/sitemap.test.ts`) fail if a public route is added without being listed or if a private one leaks into the sitemap.

---

## 7. The content system

Editorial content is files, never database rows. Run `npm run content:validate` after every content change; add `-- --launch` (or `CONTENT_LAUNCH=1`) for the strict launch mode, where every missing human sign-off becomes an error. In development mode the same gaps are a to-do list (about 430 items at the time of writing).

Snapshot (2026-11-08): 198 lessons, 603 resources, 54 placement questions, 459 check questions, 175 interview questions, 34 books, 315 glossary terms, 9 paths, 23 guided projects, 28 interview patterns, 10 system design answers, 6 blog posts, 15 featured channels, 5 testimonials, 12 cheatsheets (paused), 361 videos in the library.

| Folder | What | Notes |
| --- | --- | --- |
| `content/stops/<level>/<id>.mdx` | Lessons. Level folders B1 to P3 | Front matter plus an MDX body. See the rules below |
| `content/resources/<id>.yaml` | Courses, videos, articles, docs, books, tools | YouTube ones are `yt-*`. A URL may appear only once |
| `content/goals/<path>.yaml` | The nine role roadmaps | Stages (or levels for the GenAI path) listing lesson ids, plus guide projects |
| `content/levels/levels.yaml` | The B1 to P3 ladder and its topics | `gap_tags` on lessons must be topic ids from here |
| `content/glossary/<id>.yaml` | Glossary terms | A lesson's `key_terms` must exist here |
| `content/questions/{placement,checks,interview}` | Placement test, lesson quizzes, interview questions | Interview questions carry rubrics |
| `content/projects/*.yaml` | Guided projects | |
| `content/interview/{patterns,designs}` | Interview patterns and worked designs | Diagrams written in the flow DSL |
| `content/channels/*.yaml` | Featured YouTube channels and videos | |
| `content/blog/*.mdx` | Blog posts | |
| `content/books`, `certifications`, `jobs`, `library`, `community` | Books (affiliate), exams, salary data, papers and free books list, community link | |
| `content/testimonials/testimonials.yaml` | Real user words | See below |
| `content/video-views.yaml` | Public YouTube view counts by video id | Written by `npm run videos:views`. Do not edit by hand |
| `content/cheatsheets/*.yaml` | Paused feature's data | Kept so it can come back |

**Deep lesson rules** (the validator enforces them): 1000 to 3000 words; `answer` at most 200 characters; at least one diagram written in a `flow` code block and at least one table; 6 to 10 flashcards; an exercise with answers; at least 2 `key_terms` that exist in the glossary; the required `##` headings in order (What it is, How it works, A worked example, Common mistakes, Practice); extra `##` sections may sit between them (for example "When not to use it", "From demo to production"); every referenced resource must exist; headings start at `##`. A lesson's `check` is either three multiple-choice question ids (files in `content/questions/checks/`, `stop_id` must match) or a project brief.

**Flow diagram DSL** (parsed by `src/lib/diagram/flow.ts`): `A -> B`, `A -[label]-> B`, `Name | note` for a second line, names ending in `?` are decisions, `title:` and `dir: LR` lines. Avoid `|` and `->` inside text.

**Testimonials** are the owner's real users' words. Never invent or reword. A card shows an `excerpt` made only of the person's own words with `…` where text is skipped, and `content:validate` fails if any excerpt piece is not word for word in `quote`.

**Videos page** reads `content/video-views.yaml`. 300 of 381 video ids have counts; about 81 are missing because YouTube rate-limited the build environment. A video with no count shows no figure and sorts last. Fill them by running `npm run videos:views -- --missing` on a normal connection and committing the one changed file. Do not try to evade a YouTube rate limit.

**Unreviewed content** (still flagged): about 25 lessons (Rust, data structures, caching and other older ones), 37 glossary terms, 1 blog post, and any resource whose `verified_by` says UNVERIFIED (links were checked by script only).

**The reference book.** The owner has Chip Huyen's *AI Engineering* (O'Reilly, 2025). It was used as a reference for what to cover and how deep, and every lesson written from it is in our own words with the book cited as further reading. Never copy its text, code or diagrams, and never add the PDF to the repository. About 12 gaps were identified: how a model picks its next word, training stages (SFT, RLHF, DPO), reasoning models, fine-tuning data, synthetic data and distillation, choosing a model, evaluation basics, benchmarks and their limits, inference speed and cost, and building an AI system in layers. Three are written (sampling, how fine-tuning works, LoRA and memory maths).

---

## 8. What is built, by area

PRD IDs in brackets.

**Learning**
- Roadmaps `/paths`, `/roadmap/<path>`, one shared map design with a topic drawer, Learning / Done / Skip status, filters, a Projects tab, PDF checklist download (RM, RD).
- Lesson pages `/stop/<id>`: "On this page" list on the left (RM-15), a Watch and learn panel, flashcards, exercise, quick check, AI tutor.
- Placement test `/start`, `/result` (PL).
- Library, topics, videos by topic with view counts (VD-1), glossary, papers and free books, guided projects, code playground (Pyodide in a web worker), weekly plan (`/plan`).
- Topic tracks added late: DSA, system design (basics), software engineering and Git (SE-1), Rust, AI tools guides (vibe coding, n8n, Vapi voice agents, animation video, Google Veo and Flow video).

**Interview and practice**
- Question bank `/interview`, Q&A by role, Top 25 sets, flashcards at `/practice` (IQ, PR).
- Mock interview `/interview/simulator`, browser speech-to-text, typed fallback, a report on key points with no model call; a signed-in learner can add one AI review (VS, IQ-7a).
- Interview patterns `/interview/patterns` and worked designs `/interview/design` (IP-1 to IP-3).

**AI tools (need server keys, behind caps)** `/ai`: tutor, roadmap generator, "study from my notes and books" (PDF to test and flashcards, read in the browser), resume review, answer grading, X Bot mascot (XB), plus guides to AI at work. Open to guests with a lower daily limit; see AC and SU rows.

**Career** `/jobs` salaries and openings (JB), resume review, weekly plan, and "Commit to 90 days" (CM-90): an opt-in weekly email for 13 weeks with one-click unsubscribe, stored in `public.commitments`.

**Social proof and trust** testimonials carousel on the home page (SO-1), About and founder story (TR-2), How we rank, disclosure, privacy and terms pages.

**Accounts** Google, GitHub, email and password, email link; account wall for the PDF, mock interview and saved progress; data export and delete (AC, SU, PV). Held behind `NEXT_PUBLIC_SIGNUPS_OPEN` (see 4).

**Design system** (`docs/brand.md`, BR-1 to BR-4): violet is the one action colour; buttons are pills in three sizes from `src/components/ui.ts`; only three corner sizes (use `rounded-2xl` and `rounded-full`; the brand test fails on `rounded-md`, `-lg`, `-xl`); flat cards with a thin grey border and no shadow; one-line facts instead of badges; line-art covers; light and dark mode with a toggle at the top right.

---

## 9. Data model

Migrations in `supabase/migrations`, applied in order. Run them in the Supabase SQL editor (or with the CLI). **Which ones are applied in production is not recorded in the repo; check.**

| Migration | Adds |
| --- | --- |
| `20261025000000_initial.sql` | Core tables, row-level security, grants (profiles, quiz attempts, stop progress, activity days, badges, practice ratings, level cards, email subscriptions, resource clicks, rate limits) |
| `20261026000000_ai_guard.sql` | AI usage tracking with cost and the reserve and record functions for the spend cap |
| `20261027000000_self_marked.sql` | Allows one-tap "Done" (`self_marked`) |
| `20261028000000_roadmap_downloads.sql` | Roadmap PDF download records |
| `20261031000000_last_lesson.sql` | Last lesson for "continue where you left off" |
| `20261102000000_ai_guests.sql` | Guest AI usage limits |
| `20261107000000_commitments.sql` | Weekly email commitments (opt-in, token for one-click unsubscribe) |

Tests: `npm run test:db` runs the row-level security tests against a real Postgres 16 with a small Supabase shim (`TEST_DATABASE_URL`, for example `postgresql://postgres@localhost:5432/postgres`). CI does the same in a service container. Every new table needs a policy and a test for it.

---

## 10. How to work in the repo

**Checks before you finish a slice:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run content:validate`, then a production build and the browser tests.

**Browser tests (Playwright):**
1. `npm run build` first. With `CI=1` the test server runs `npm run start`, so it serves whatever `.next` holds. A stale build gives stale results.
2. Free port 3000 if an old server is running (`fuser -k 3000/tcp`), or the run stops with "port already used".
3. Run `CI=1 npx playwright test --retries=0`. If a browser is pre-installed, set `PW_CHROMIUM_PATH` to its executable. The full suite takes about 10 minutes (128 tests at the time of writing); run it in the background and read the log.
4. After editing content files while `next dev` is running, restart the dev server: it reads content once per process.

**Git and pull requests:**
- Work on a feature branch, open a pull request to `main`, **squash merge** only when the owner says "merge it". Use the full 40-character head commit id as `expectedHeadSha` when merging through the API.
- Every commit message starts with the requirement ID (`BR-4: ...`). Add the footer lines your tooling requires.
- After a squash merge, if you keep using the same branch name, reset it: `git fetch origin main && git checkout -B <branch> origin/main`, then record the old history without force pushing: `git fetch origin <branch> && git merge -s ours --no-edit origin/<branch>`, then push. Force push is blocked in the cloud environment, which is why this is needed.
- This repo has no pull request template. Write the description with: what changed, why (quote the owner's request), the checks run, and anything left undone. Be honest about gaps.
- Open PRs one at a time and wait for "merge it". Watch the PR for CI and review comments until it is merged.

**Content work:**
- Add or change a lesson: edit the `.mdx`, add missing glossary terms, quiz questions and resources, list the lesson in the right paths in `content/goals/*.yaml` at its level, run `content:validate`, run the lesson's page in the browser at 360 px.
- New resource: check that the link opens, that a YouTube video is embeddable (`https://www.youtube.com/oembed?url=...` returns 200), and that the URL is not already used.
- Mark `reviewed_by` only on the owner's word.

**Writing style for learner-facing text:** plain English, short sentences, Indian examples, no filler, no invented statistics. Anything that looks like a fact needs a source or an honest "for illustration" label.

---

## 11. Gotchas and lessons learned

- **Bulk edits on class names are dangerous.** A search and replace that removed an animation class also emptied a selector string in the motion script (`querySelector(".")`) and broke some pages. Grep for the string in code, not only markup, before a bulk edit. The browser tests caught it.
- **Absolutely positioned text inside a scrolling row is not clipped by it** unless the row itself is `position: relative`. A carousel's hidden screen-reader text stretched the home page to 1267 px on phones. Test every new horizontally scrolling element at 360 px.
- **Dark mode contrast:** `text-zinc-500` fails AA on the dark background. Use `text-zinc-600` in light and `dark:text-zinc-400`. The accessibility test in dark mode scans the home page, `/paths`, a roadmap, a lesson, `/library`, `/jobs`, `/practice` and `/about`.
- **The sitemap test lists every public route.** Add a new public page to `src/app/sitemap.ts`, or mark it private in the test, or the test fails.
- **YouTube rate limits.** Fetching watch pages in bulk gets redirected to an "unusual traffic" page after a few hundred requests. Do not circumvent it. Fetch slowly, resume with `--missing`, or run from a normal connection.
- **Adding a new kind of content touches several files:** `schema.ts`, `types.ts` (the Bundle), `load.ts`, `index.ts`, `testing.ts` (the valid test bundle) and `validate.ts`. Follow how `testimonials` and `videoViews` were added.
- **Requirement IDs are unique again (9 Nov).** Five IDs had been used twice; the later meanings were renamed: the software engineering track is SWE-1, "Content first" is BR-8, trust pages BR-9, the XP removal AC-12, spaced repetition IQ-10. Older commits and code comments may still use the old names.
- **Commit trailers and PR footers** are added by the Claude tooling. Do not copy model names into repo files.
- **A dashboard crash on Vercel (2026-11-03)** came from content files missing from the serverless bundle. `next.config.ts` ships `content/**` with every route (`outputFileTracingIncludes`). Keep it.
- **The first placement test can end before 12 questions** if the question bank runs out at the learner's level. That is intended (see `docs/decisions.md`, slice S2).
- **Auto-mode safety classifier.** In the cloud environment some commands (for example scraping around a rate limit) are refused. Do not look for workarounds; report it to the owner.

---

## 12. What is pending

**Owner actions (Claude cannot do these):**
1. Turn on the weekly "Commit to 90 days" emails if not done: run `supabase/migrations/20261107000000_commitments.sql`, set `RESEND_API_KEY` and `CRON_SECRET` in Vercel, verify the sending domain in Resend, optionally set `COMMIT_EMAIL_FROM`.
2. Confirm sign-in is fully set up (Google, GitHub, email) and decide when to open sign-ups (`NEXT_PUBLIC_SIGNUPS_OPEN=true`). Sign-ups are open (10 Nov), which switches on AG-1 (no AI without an account) and RG-1 (roadmaps show a preview, then ask for an account). Setting the variable back to false lifts both.
3. Set `ANTHROPIC_API_KEY`, `AI_MONTHLY_CAP_USD` and a matching spend limit in the Anthropic Console if AI tools should run in production.
4. Pro passes (PAY-1 to PAY-6): run `supabase/migrations/20261108000000_payments.sql`; create the Cashfree account and finish KYC; in the Cashfree dashboard set the payment webhook to `https://xplaind.in/api/billing/webhook`; set `PAYMENTS_MODE=sandbox` plus the sandbox keys on a Preview deployment to test, then the live keys and `PAYMENTS_MODE=production` to launch. Decide GST with a CA (receipts say "not a tax invoice" until then). Approve the refund policy wording at /refunds. Set `NEXT_PUBLIC_CONTACT_EMAIL` (Cashfree checks for a contact address). Raise `AI_MONTHLY_CAP_USD` as passes sell: Pro calls skip the cap but still count towards it.
5. Done 12 Nov: the Amazon Associates India tag (`AMAZON_IN_TAG`, xplaind-21) is set and book links carry it.
6. Fill in the missing video view counts: `npm run videos:views -- --missing`, commit `content/video-views.yaml`.
7. All AI-drafted lessons, glossary terms and guides were reviewed by him by 9 Nov; review new drafts and any resources marked UNVERIFIED as they appear. The owner reviewed the privacy policy with a lawyer on 12 Nov.
8. SEO (SE-8, 10 Nov): verify xplaind.in in Google Search Console and Bing Webmaster Tools, submit the sitemap and request indexing for the key pages; steps and the keyword map are in `docs/seo-keywords.md`. The two new guides (how to become an AI engineer in India; free AI courses with certificate) were reviewed by the owner on 12 Nov.

**Work Claude can pick up, in the order the owner has signalled interest:**
- Deepen older lessons to the depth of the book-informed ones (runnable code, "when not to", "from demo to production", book reference where the book covers it). Done (LQ-7): the first nine in three batches (PR 52 to 54), then, at the owner's request, every remaining lesson in the agents, automation, voice, evals, governance, LLM, retrieval, data, ops and security themes in one pass (74 lessons, PR 55). He reviewed and approved the whole pass on 8 Nov. Not deepened, by design: beginner B-level lessons, DSA, Rust, system design, software engineering, career, client-delivery and product lessons; the 11 classic ML lessons (I1 and I2 `ml` theme) followed in a second single pass (PR 56), with every code example run for real on scikit-learn and PyTorch (CPU) using synthetic data. How the pass was done: per-lesson spec files applied by a small script (sections inserted before the worked example, Common mistakes extended, the two new sections before Practice, two flashcards added); every Python block was parse-checked and the riskier ones run against mocks.
- The book-informed series is complete (LQ-1 to LQ-6, 18 lessons, 36 interview questions): sampling, how fine-tuning works, LoRA and memory maths; how chat models are made, choosing a model, synthetic data and distillation; reasoning models, inside LLM inference, building a training dataset; scoring open-ended answers, AI app in layers, catching hallucinations; AI in Indian languages, model size and scaling, perplexity and cross-entropy; fine-tuning in practice, model merging, running models on many GPUs. The book (Chip Huyen, *AI Engineering*, O'Reilly 2025) is cited as further reading, never copied, and the PDF is not in the repo.
- Bring cheatsheets back, redesigned (the infographic layout from PR 42 is in git history; ask the owner what was unclear about the old one).
- Collect more real testimonials as beta testers use the site (SO-1).
- PRD reviewed against the build on 9 Nov: see "Status review, 2026-11-09" at the top of docs/PRD.md for what is superseded and what is not built yet (PL-7, part of PL-8, IQ-10, ED-5, ED-7, AC-9).

- The notes tool's study loop (MB-8 to MB-10) is built. Next candidates from docs/notes-tool-ideas.md: Indian exam formats (idea 4), chapter summaries (5), read-aloud recaps (6) and a match game (7). Open question for the owner: keep the book's text on the device so a retest needs no re-upload (see decisions, 12 Nov).

**Do not start without being asked:** more upsell pop-ups beyond the one at a daily AI limit (PAY-4), locking any lesson, roadmap, practice or project content behind Pro, XP or badges, more system design content, a system design mock interview, ads or trackers.

**Open owner decision (older, still unanswered in the repo):** whether the placement test must always ask 12 questions (needs about 10 questions at B1) or may end early when the bank runs out.

**Ideas from `docs/product-plan.md` that were never built or approved:** bookmarks, curated AI news, Tamil, adaptive tutoring, portfolios, premium interview prep, college and company programmes, community contributions. Treat them as ideas, and check them against FOCUS-1 before proposing.

---

## 13. Timeline

Dates are 2026. `git log` and the PR list hold the detail; `docs/decisions.md` records reasons up to 3 November.

- **25 Oct:** scaffold, content pipeline, placement test, roadmaps, stops, interview questions, nine paths, 163 explainer lessons, courses and certifications, mock interview, blog, redesign.
- **26 Oct:** AI features with guards and caps; topic tracking and one roadmap design; guided projects; X Bot; Top 25 interview sets; content review pass.
- **27 to 31 Oct:** video lessons, labels and launch sign-off; videos everywhere, library, tracks, pastel 3D look.
- **1 to 3 Nov:** search and AI visibility; books with affiliate links; sign-up gates; papers library; Rust and AI-tool guides; the home road flight (MO-6 to MO-8); sign-ups put on hold (SU-4); AI tools open to guests (SU-5); brand system (BR-1 to BR-4 original set); About and founder story; accessibility fixes; two Vercel crashes fixed.
- **2 Nov (also):** fewer AI tools. The AI roadmap editor and AI course generator were removed and the AI coach was merged into the tutor; the roadmap generator, tutor, notes-to-test tool and resume review stay.
- **4 to 6 Nov:** many owner-list rounds (roadmap drawer, lesson layout, topic tracks, "Commit to 90 days", a DataCamp-style minimal direction). XP and badges were removed, and month-based durations were removed from the site.
- **6 to 7 Nov:** research on AI interview prep demand and on AlgoMaster (a Claude doc, "Xplaind: the AlgoMaster for AI roles", may no longer be reachable after an account change). PR 36: lesson layout fix, data engineering channel videos, testimonials, cheatsheets. PR 37: the Interview section (patterns and worked designs). PR 38: software engineering and Git track, "Commit to 90 days". PR 39: the minimal look, site-wide (BR-3).
- **8 Nov (later):** PR 44: this handover. PR 45 and 48 to 51: book-informed lessons batches 2 to 6 (LQ-2 to LQ-6). PR 46: every DeepLearning.AI course and Andrew Ng's courses as video courses (VD-2). PR 47: Pro passes with Cashfree in test mode, tiered AI limits, pricing, billing and refund pages (PAY-1 to PAY-6). PR 52 to 54: deepening older lessons, three batches of three (LQ-7). PR 55: the remaining 74 AI-engineering lessons deepened in one pass (LQ-7). PR 56: the 11 classic ML lessons (LQ-7).
- **7 to 8 Nov:** PR 40: three book-informed lessons (LQ-1). PR 41: videos page by topic with filters and view counts (VD-1). PR 42: sideways testimonials with excerpts, example-week card, line-art covers, infographic cheatsheets (BR-4). PR 43: cheatsheets paused, reviewed marks, product focus recorded (CS-3, FOCUS-1).

`docs/decisions.md` is up to date to 9 November. Add new decisions there as you make them.

---

## 14. The other docs

| File | What it is |
| --- | --- |
| `CLAUDE.md` | Project rules for Claude Code. Short. Read every session |
| `AGENTS.md` | Warning that Next.js 16 differs from older versions |
| `docs/PRD.md` | The spec. Requirement rows by ID. The live source of truth |
| `docs/decisions.md` | Why choices were made, slice by slice, to 3 Nov |
| `docs/brand.md` | Logo, colour, type, buttons, corners |
| `docs/product-plan.md` | Nine paths and the feature phases |
| `docs/supabase-setup.md` | Step-by-step account set-up for the owner |
| `docs/handoff.md` | The older (25 to 26 Oct) handoff. Superseded by this file; kept for history |
| `docs/roadmap-sh-comparison.md` | How the roadmaps compare to roadmap.sh |
| `docs/review/` | Notes from the October content review pass |

---

## 15. Appendix: PRD requirement families

`AC` accounts · `AI` AI tools · `A11Y` accessibility · `BK` books and affiliate · `BL` blog · `BR` brand and look · `CM` commitments and reminders · `CO` spend caps · `CS` cheatsheets (paused) · `ED` editorial rules · `FOCUS` product focus · `GP` guided projects · `IP` interview patterns · `IQ` interview questions and mock review · `JB` jobs and salaries · `LB` papers and free books · `LQ` book-informed lessons · `MB` study from notes and books · `MO` motion and 3D · `NV` navigation · `PG` code playground · `PL` placement test · `PR` practice · `PV` privacy · `QA` quality and performance · `RD` roadmap PDF · `RM` roadmaps and lessons · `RV` resume review · `SC` security · `SE` search and AI answer visibility · `SO` social proof · `SU` sign-up gates · `TR` trust and founder story · `VD` videos page · `VS` voice and mock interview · `WP` weekly plan · `XB` X Bot.
