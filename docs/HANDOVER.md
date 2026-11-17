# Xplaind handover

Written 2026-11-08, after PR 43. **Last updated 2026-11-16, after visitor analytics (AN-2)** (the build moved to a second Claude account on 16 Nov, started from this file and the PR list). Its job: let a new Claude account, attached to this repository with no memory of earlier chats, understand the product, the owner, the code, the rules and the unfinished work, and carry on building.

**Keep this file current.** At the end of every slice, update the "Last updated" line above, section 8 (what is built), section 12 (what is pending), section 13 (timeline) and, when you learn something the hard way, section 11. The owner asked for this on 16 Nov, and `CLAUDE.md` says so too.

If you are that Claude: read this file first, then `CLAUDE.md`, `AGENTS.md`, and the requirement rows in `docs/PRD.md` for whatever you are about to change. The rest of `docs/` is background; section 14 says what each file is.

This document holds no secrets and must never hold any. Keys live in Vercel and Supabase settings, not in the repo.

---

## 1. First hour checklist

1. Read `CLAUDE.md` (the project rules, short) and `AGENTS.md` (Next.js 16 is not the Next.js you know; read `node_modules/next/dist/docs/` before writing framework code).
2. Run `npm install`, then `npm run check` (lint, typecheck, unit tests, content validation). Everything should pass.
3. Run `npm run dev` and open the home page, a roadmap (`/roadmap/ai-engineer`), a lesson (`/stop/rag-app`), `/videos`, `/interview`. Look at it in light and dark, at 360 px wide and at desktop width. Most owner feedback is about how pages look and read.
4. Skim `docs/PRD.md` headings and the newest rows (NV-8, IP-4, LY-1, LY-2, UX-7, LT-1, LT-2, BR-10, PAY-7 to PAY-11, CG-1, RZ-1, BIZ-1, IR-1, PR-1, CT-1, IL-1, PP-1, then FOCUS-2, MB-8 to MB-10, LQ-1 to LQ-7). Requirement IDs such as `RM-2` are the spec and go at the start of every commit message. IDs must be unique: search the PRD before inventing one (on 16 Nov `LB-1` and `LB-2` turned out to be taken by the papers library).
5. Read section 3 (the owner) and section 12 (what is pending) before proposing anything. Read the migrations note at the top of section 9: every migration in the repo was applied to production on 16 Nov, and a new one must be applied (and recorded there) when you add it.

Starter prompt you can paste into a new Claude session:

> You are taking over the Xplaind repository from a previous Claude account. Read `docs/HANDOVER.md` fully, then `CLAUDE.md`, `AGENTS.md` and the newest rows of `docs/PRD.md`. Run `npm run check` to confirm the baseline. Then tell me in a few plain sentences what the product is, what is pending, and what you would do next. Do not change anything until I confirm. Merge only when I say "merge it" (or "open PR and merge it").

---

## 2. The product

**Xplaind** (https://xplaind.in) is a free-first, plain-English AI learning platform for India. Positioning decided on 2026-11-08 (FOCUS-1): **a one-stop platform for AI education**. It is not a general interview-prep or system-design site.

What a learner gets:

- **Nine role roadmaps** (AI Engineer, Generative AI and LLM Engineer, Forward Deployed Engineer, AI Product Manager, Agentic AI Engineer, AI Automation Specialist, AI Governance and Compliance Specialist, Machine Learning Engineer, MLOps Engineer). Each is an ordered route through one shared library of lessons.
- **206 lessons**, each in one format: a one-sentence answer, what it is, how it works, a worked example, common mistakes, practice, key terms, a best course, videos, a quick check, and an AI tutor. Most are "deep lessons" with a diagram, a table, flashcards and an exercise.
- **Every lesson in four more languages (LT-1, 15 to 16 Nov)**: everyday spoken Tamil (தமிழ்) and Hindi (हिन्दी) in their own scripts, and Tanglish and Hinglish (the same Tamil and Hindi written in English letters). Each has its own page at `/stop/<id>/<lang>` with `hreflang` links and a "Read in" switch. Videos, courses and the quick check stay in English. The drafts are AI-written and wait for a native-speaker review (see 12).
- **Learning tools**: one Library page (lessons, 373 video lessons and 348 skills, searchable, plus a "By topic" view), a glossary of 352 terms, 23 guided projects, videos filterable by topic, papers and free books, a Python playground that runs in the browser, a weekly study plan, and a placement test (with a 2-minute quick version).
- **Interview practice**: a question bank (205 questions with rubrics), flashcards, a timed mock interview with browser speech-to-text and a report, 28 interview patterns, and 10 worked system design answers.
- **AI tools** (need Claude API keys on the server, and are part of the paid Pro passes, PAY-10): an AI tutor that can explain in ten Indian languages (IL-1), "study from my notes and books" (turn a PDF into a test and flashcards), a resume review with job match (JM-1), answer grading, and AI review of guided projects (PR-1).
- **Outcomes** (14 Nov, behind Pro or an account): an interview readiness score (IR-1), a verified certificate per role (CT-1), a public learner profile (PF-1, opt-in), progress nudges (NG-1), a plan that fills the weeks before an interview date (PP-1), learner outcome stories (OS-1) and a colleges and batches page (CB-1).
- **Money**: Pro passes (7 days ₹99, 30 days ₹249, 6 months ₹999, 12 months ₹1,499) through Cashfree or Razorpay (one live at a time), promo codes, referrals, and a pricing page that sells on outcomes. The business is ZEREH Ventures (BIZ-1). Learning content is free with a free account; AI tools are Pro (CG-1, PAY-10).
- **Career**: jobs and salaries by role, live openings.
- **Accounts** (Supabase): sign-ups are open (since 10 Nov). Progress saved to the account, roadmap PDF downloads, weekly email plan. A signed-in learner is signed out after 7 days idle or 30 days in all (AC-13).
- Trust rules: no ads, no sponsored placement, no paid ranking, affiliate links (books only) are labelled and never change order, prices always show the date they were checked. Xplaind itself is never called "free" in titles, headings or buttons (SE-8); "free" stays only as a fact about an outside course or book.
- **Look**: deep teal with a brass accent (BR-10, 14 Nov), calm-authority voice. A loading screen with the animated Xplaind X shows on every page load, page change and language switch (UX-7).

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

- He gives numbered lists of changes, often with screenshots of the live site. Do the list, show the result, then wait. He says **"merge it"** or **"open PR and merge it"** when he wants a pull request merged. **Do not open or merge a PR without those words.** Push the branch, say what is on it, and ask.
- He moved the build to a second Claude account on 16 Nov because the first one hit its weekly limit; he is on a Max plan, so he is happy for big jobs to run as large parallel batches ("increase the batch size and finish it quickly"). He asked to use a separate chat per task and a smaller model (Sonnet) for high-volume work such as translations, and the stronger model for building features.
- He has external accounts that Claude cannot reach (Vercel, Supabase dashboard, Cashfree, Razorpay, Resend, GoDaddy, Google Search Console). When a fix needs one, say exactly what to click or run.
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
| Hosting | Vercel, team `zaiphr`, project `xplaind` | Production at https://xplaind.in (and `www`, which redirects with a 308). Every push to a branch gets a preview at `xplaind-git-<branch>-zaiphr.vercel.app`. The Vercel bot comments on each PR when the preview is ready. The same team hosts two other projects (`zaiphr`, `zohrae`); do not touch them |
| DNS and certificates | Domain DNS at GoDaddy (nameservers `ns13`/`ns14.domaincontrol.com`) | Checked 16 Nov: `xplaind.in` has one A record, `216.198.79.1`, no AAAA, no CAA; `www` is a CNAME to Vercel. Vercel certificates for both names auto-renew and run to Jan 2027. If a visitor sees `ERR_CERT_AUTHORITY_INVALID`, the site side was fine; ask which network they were on (see 11) |
| Database and sign-in | Supabase project named `Xplaind` (reference `blgqdjtbzhrtiohepmvn`), the older one called `Zaiphr Website` is a different site | Postgres with row-level security, auth with Google, GitHub, email and password, email link. Set-up steps in `docs/supabase-setup.md` |
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
| `AI_MONTHLY_CAP_USD`, `AI_KILL_SWITCH`, `AI_MODEL`, `AI_FAST_MODEL` | Spend cap, instant off switch, optional model overrides (main model and the fast model for the tutor and Ask your notes) |
| `PAYMENTS_MODE` | `sandbox` or `production` turns Pro passes on (PAY-1). Empty keeps Pro closed |
| `PAYMENTS_PROVIDER` | `razorpay` or `cashfree`. Unset: Razorpay when its keys exist (RZ-1). Only one gateway is live |
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | **Secret.** Cashfree Payment Gateway keys; sandbox and live keys differ |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **Secret.** Razorpay keys (`rzp_test_` or `rzp_live_` must match `PAYMENTS_MODE`) and the webhook secret |
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
- **Video lessons** play in a privacy-friendly embed (`youtube-nocookie`) that loads only after the learner presses play; thumbnails come through the Next image server. The iframe is sandboxed (`PLAYER_SANDBOX` in `src/lib/content/media.ts`, VD-3): scripts, storage and fullscreen are allowed, pop-ups and top navigation are not, so the YouTube logo, title and "Watch on YouTube" links do nothing instead of opening youtube.com. Do not cover YouTube's branding with an overlay (its embed rules forbid it) and do not add `allow-popups` back.
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

Navigation lives in `src/lib/nav.ts` (groups: Learn, Practice, Interview, Career, AI Studio, and the standalone "Pricing" link, `PRO_LINK`). Library and Topics are one menu item (LY-2); practice cards are only under Practice; interview patterns and system design answers are last in Interview (IP-4). A test (`nav.test.ts`) and the sitemap test (`src/app/sitemap.test.ts`) fail if a public route is added without being listed or if a private one leaks into the sitemap; a page that only redirects (such as `/topics`) goes in that test's `REDIRECTS` list.

Other places worth knowing: `src/lib/nav-feedback.ts` (which clicks start a page change, shared by the top bar and the loading screen), `src/components/page-loader*.tsx` (the loading screen, UX-7), `src/lib/library-order.ts` (the Library's order, LY-1), `src/lib/business.ts` (legal name, GSTIN, contact), `src/lib/billing` (passes, promo codes, referrals, gateways), `src/lib/seo.ts` (titles and descriptions).

---

## 7. The content system

Editorial content is files, never database rows. Run `npm run content:validate` after every content change; add `-- --launch` (or `CONTENT_LAUNCH=1`) for the strict launch mode, where every missing human sign-off becomes an error. In development mode the same gaps are a to-do list (about 430 items at the time of writing).

Snapshot (2026-11-16): 206 lessons, 774 resources, 54 placement questions, 504 check questions, 205 interview questions, 34 books, 352 glossary terms, 9 paths, 23 guided projects, 28 interview patterns, 10 system design answers, 15 featured channels, 12 cheatsheets (paused), 373 video lessons and 348 skills in the Library (927 items in all). Each of the 206 lessons also has four translations (824 files). Counts come from `npm run content:validate`, which prints them; refresh this line when they change.

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
| `content/translations/<lang>/<id>.mdx` | A lesson in another language. `<lang>` is `ta`, `hi`, `tanglish` or `hinglish` | One file per lesson per language, 206 each. See "Translations" below |

**Deep lesson rules** (the validator enforces them): 1000 to 3000 words; `answer` at most 200 characters; at least one diagram written in a `flow` code block and at least one table; 6 to 10 flashcards; an exercise with answers; at least 2 `key_terms` that exist in the glossary; the required `##` headings in order (What it is, How it works, A worked example, Common mistakes, Practice); extra `##` sections may sit between them (for example "When not to use it", "From demo to production"); every referenced resource must exist; headings start at `##`. A lesson's `check` is either three multiple-choice question ids (files in `content/questions/checks/`, `stop_id` must match) or a project brief.

**Flow diagram DSL** (parsed by `src/lib/diagram/flow.ts`): `A -> B`, `A -[label]-> B`, `Name | note` for a second line, names ending in `?` are decisions, `title:` and `dir: LR` lines. Avoid `|` and `->` inside text.

**Translations (LT-1).** A translation's front matter holds `id`, `lang`, `title`, `outcome`, `answer`, `why_it_matters`, `flashcards`, `exercise`, `ask`, `translated_on` and (once a native speaker checks it) `reviewed_by`; the body has the same `##` sections as the English lesson, in the same order. Style: everyday spoken language the way people talk at work, English kept for technical terms, product names, code and numbers; Tanglish and Hinglish are the same wording in English letters. `content:validate` fails a translation whose number of parts, flashcards or exercise questions differs from the English, or whose lesson does not exist. Quote YAML strings and avoid unescaped inner double quotes (the usual cause of a failed file). A language's "Read in" link shows only if that language has the lesson. To add translations for a new lesson: write the four files, run `content:validate`, and use `/stop/<id>/<lang>` to check. The last 45 Tamil and Hindi lessons and the last 165 Tanglish and Hinglish lessons (16 Nov) were drafted by parallel sub-agents; many of the Tanglish and Hinglish ones were written from the English lesson alone, without reading the Tamil or Hindi version, so the same idea can be worded differently across the four versions of a lesson. That is a known thing for the reviewer to even out. How the earlier batches were drafted is not recorded.

**Testimonials** are the owner's real users' words. Never invent or reword. A card shows an `excerpt` made only of the person's own words with `…` where text is skipped, and `content:validate` fails if any excerpt piece is not word for word in `quote`.

**Videos page** reads `content/video-views.yaml`. 300 of 381 video ids have counts; about 81 are missing because YouTube rate-limited the build environment. A video with no count shows no figure and sorts last. Fill them by running `npm run videos:views -- --missing` on a normal connection and committing the one changed file. Do not try to evade a YouTube rate limit.

**Unreviewed content** (still flagged): about 18 lessons (data structures, caching and other older ones), 37 glossary terms, 1 blog post, and any resource whose `verified_by` says UNVERIFIED (links were checked by script only).

**The reference book.** The owner has Chip Huyen's *AI Engineering* (O'Reilly, 2025). It was used as a reference for what to cover and how deep, and every lesson written from it is in our own words with the book cited as further reading. Never copy its text, code or diagrams, and never add the PDF to the repository. About 12 gaps were identified: how a model picks its next word, training stages (SFT, RLHF, DPO), reasoning models, fine-tuning data, synthetic data and distillation, choosing a model, evaluation basics, benchmarks and their limits, inference speed and cost, and building an AI system in layers. Three are written (sampling, how fine-tuning works, LoRA and memory maths).

---

## 8. What is built, by area

PRD IDs in brackets.

**Learning**
- Roadmaps `/paths`, `/roadmap/<path>`, one shared map design with a topic drawer, Learning / Done / Skip status, filters, a Projects tab, PDF checklist download (RM, RD).
- Lesson pages `/stop/<id>`: "On this page" list on the left (RM-15), a Watch and learn panel, flashcards, exercise, quick check, AI tutor.
- Placement test `/start`, `/result` (PL).
- **Library** `/library` (LY-1, LY-2): one page with two views, "All lessons, videos and skills" (search, filters) and "By topic" (cards). It opens on "What automation is" and the technical lessons; the Beginner 1 awareness lessons (AI rules in India and abroad, bias and fairness, your company's AI policy and the like) are last. `/topics` redirects to `/library?view=topics`; each topic keeps `/topics/<topic>`.
- Videos by topic with view counts (VD-1), glossary, papers and free books, guided projects, code playground (Pyodide in a web worker), weekly plan (`/plan`).
- **Languages** (LT-1, LT-2): `/stop/<id>/<lang>` for Tamil, Hindi, Tanglish and Hinglish, a "Read in" switch on every lesson, and a home page section that promotes it with real samples.
- Topic tracks added late: DSA, system design (basics), software engineering and Git (SE-1), AI tools guides (the Rust track was dropped on 12 Nov, FOCUS-2) (vibe coding, n8n, Vapi voice agents, animation video, Google Veo and Flow video).

**Interview and practice**
- Question bank `/interview`, Q&A by role, Top 25 sets, flashcards at `/practice` (IQ, PR).
- Mock interview `/interview/simulator`, browser speech-to-text, typed fallback, a report on key points with no model call; a signed-in learner can add one AI review (VS, IQ-7a).
- Interview patterns `/interview/patterns` and worked designs `/interview/design` (IP-1 to IP-3). On the Interview page and in its menu they come last (IP-4), and the question bank is the main column with the preparation links in a side panel (a swipe row on phones, IP-5). Practice cards (`/practice`) live under the Practice menu only, and the Practice page has no glossary block.

**AI tools (need server keys, behind caps)** `/ai`: tutor, "study from my notes and books" (PDF, Word or PowerPoint, with Pro-only reading of picture pages (MB-12), to test and flashcards, read in the browser; uses the PDF.js legacy build so it works on iPhones, MB-11), resume review, answer grading, plus guides to AI at work. Open to guests with a lower daily limit; see AC and SU rows.

**Career** `/jobs` salaries and openings (JB), resume review, weekly plan, and "Commit to 90 days" (CM-90): an opt-in weekly email for 13 weeks with one-click unsubscribe, stored in `public.commitments`.

**Pro and payments** (PAY-1 to PAY-11, RZ-1, BIZ-1, CG-1, RF-1, AN-1): `/pricing` (menu link "Pricing", NV-8), passes of 7 days, 30 days, 6 months and 12 months, Razorpay or Cashfree checkout, promo codes (rows in `promo_codes`, never in the repo), referrals (`/r/<code>`), billing and receipts in Settings, a refund policy and terms, a one-time AI trial for free accounts, funnel counts without user ids. The learning content is free with a free account (an open preview for visitors and search engines); the AI tools are Pro.

**Outcomes and community of learners (14 Nov)** interview readiness score (IR-1), AI project review (PR-1), resume-to-job match (JM-1), public profile `/u/<handle>` (PF-1), verified certificate `/certificate/<id>` (CT-1), tutor in Indian languages (IL-1), interview-date plan (PP-1), 2-minute level check (QS-1), progress nudges (NG-1), colleges page `/colleges` (CB-1), outcome stories `/stories` (OS-1). Their tables were created in production on 16 Nov (see 9).

**Loading and look** a full-screen loading screen with the animated X on every load, page change and language switch (UX-7), a thin top bar (UX-2), Deep Teal and Brass brand (BR-10), typographic blog covers (BL-2), a menu with icons (UX-3) and a numbered phone menu (NV-5, NV-6).

**Social proof and trust** testimonials carousel on the home page (SO-1), About and founder story (TR-2), How we rank, disclosure, privacy and terms pages.

**Accounts** Google, GitHub, email and password, email link; account wall for the PDF, mock interview and saved progress; data export and delete (AC, SU, PV). Held behind `NEXT_PUBLIC_SIGNUPS_OPEN` (see 4).

**Design system** (`docs/brand.md`, BR-1 to BR-4, then BR-10 on 14 Nov moved the brand from violet to deep teal `#0E4A50` with sea glass `#7FD1C7` on dark and brass `#D9B26A` only for what a learner earns; older text below still says violet, read it as the brand colour): the brand colour is the one action colour; buttons are pills in three sizes from `src/components/ui.ts`; only three corner sizes (use `rounded-2xl` and `rounded-full`; the brand test fails on `rounded-md`, `-lg`, `-xl`); flat cards with a thin grey border and no shadow; one-line facts instead of badges; line-art covers; light and dark mode with a toggle at the top right.

---

## 9. Data model

Migrations in `supabase/migrations`, applied in order. Run them in the Supabase SQL editor (or with the CLI). **Which ones are applied in production is not recorded in the repo; check.**

> **Migrations: all applied to production on 16 Nov 2026.** On 16 Nov a check of the `Xplaind` Supabase project found nine tables missing, because the 7 Nov and 14 Nov migrations had never been run while the code that uses them was live. With the owner's go-ahead they were applied in order through the Supabase tools: `commitments` (`20261107000000`), the week pass, referrals and funnel counts (`20261114000000`, which also changed the plan constraints and `grant_pass`), `interview_readiness`, `project_reviews`, `public_profiles` and `certificates`, and `batch_enquiries`. Before applying, each file was read and the live database checked for the things the files assume (the existing functions and constraints, and that the 4 payments and 2 entitlements fit the new plan list). Afterwards: all nine tables exist with row-level security on, the existing payments, entitlements and promo codes were untouched, and the security advisor showed nothing new beyond the "RLS enabled, no policy" notes for server-only tables, which is intended. `20261109000000_ai_guest_sample.sql` was already in place (its function existed), so it was skipped. The migration history table is empty because earlier tables were created in the SQL editor, so **check by table and function, not by the history**: `select table_name from information_schema.tables where table_schema = 'public'`. **That first check looked at tables only and missed columns**: a later full check found the 31 Oct migration `20261031000000_last_lesson.sql` (the `profiles.last_stop_id` and `last_stop_at` columns for "continue where you left off") had never been applied either (19 failures in 24 hours in the Supabase logs); it was applied the same day. When you check a database against the repo, check tables, columns, functions, constraints and indexes, not only tables. When you add a migration, apply it, then record it here. Left alone on purpose: an old five-argument `ai_reserve(uuid,text,date,integer,numeric)` sits next to the live six-argument one; the code always calls the six-argument version, so it is harmless, and it can be dropped in a tidy-up.

| Migration | Adds |
| --- | --- |
| `20261025000000_initial.sql` | Core tables, row-level security, grants (profiles, quiz attempts, stop progress, activity days, badges, practice ratings, level cards, email subscriptions, resource clicks, rate limits) |
| `20261026000000_ai_guard.sql` | AI usage tracking with cost and the reserve and record functions for the spend cap |
| `20261027000000_self_marked.sql` | Allows one-tap "Done" (`self_marked`) |
| `20261028000000_roadmap_downloads.sql` | Roadmap PDF download records |
| `20261031000000_last_lesson.sql` | Last lesson for "continue where you left off" |
| `20261102000000_ai_guests.sql` | Guest AI usage limits |
| `20261107000000_commitments.sql` | Weekly email commitments (opt-in, token for one-click unsubscribe). **Run in production on 16 Nov** |
| `20261108000000_payments.sql` | `payments` and `entitlements` for Pro passes (run) |
| `20261109000000_ai_guest_sample.sql` | Guest AI sample limits (no new table) |
| `20261113000000_promo_codes.sql` | `promo_codes`, `promo_redemptions` (run; four codes exist, `xp100` expires 30 Nov 2026) |
| `20261114000000_week_pass_referrals_funnel.sql` | 7-day pass, `referral_codes`, `referrals`, `funnel_daily`. **Run in production on 16 Nov** |
| `20261114010000_interview_readiness.sql` | `interview_readiness`. **Run in production on 16 Nov** |
| `20261114020000_project_reviews.sql` | `project_reviews`. **Run in production on 16 Nov** |
| `20261114030000_profiles_certificates.sql` | `public_profiles`, `certificates`. **Run in production on 16 Nov** |
| `20261114040000_batch_enquiries.sql` | `batch_enquiries`. **Run in production on 16 Nov** |

Tests: `npm run test:db` runs the row-level security tests against a real Postgres 16 with a small Supabase shim (`TEST_DATABASE_URL`, for example `postgresql://postgres@localhost:5432/postgres`). CI does the same in a service container. Every new table needs a policy and a test for it.

---

## 10. How to work in the repo

**Checks before you finish a slice:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run content:validate`, then a production build and the browser tests.

**Browser tests (Playwright):**
1. `npm run build` first. With `CI=1` the test server runs `npm run start`, so it serves whatever `.next` holds. A stale build gives stale results.
2. Free port 3000 if an old server is running (`fuser -k 3000/tcp`), or the run stops with "port already used".
3. Run `CI=1 npx playwright test --retries=0`. If a browser is pre-installed, set `PW_CHROMIUM_PATH` to its executable. The full suite takes about 10 minutes (128 tests at the time of writing); run it in the background and read the log.
4. After editing content files while `next dev` is running, restart the dev server: it reads content once per process.
5. **Quick local runs (16 Nov):** without `CI=1` Playwright starts `npm run dev`, so no build is needed. Run only the specs your change touches (`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test e2e/<file> --trace off -g "<name>"`); a big batch of specs can exceed a 10-minute command limit. The first visit to each page compiles it, which can take longer than the default 5 s wait: a test that fails on its first assertion after a click is probably a cold compile, so rerun it alone before suspecting the code. Give a click-then-new-page assertion a 30 s timeout. If the dev server serves old CSS or markup after a branch switch, stop it and delete `.next/dev` (see 11).

**Git and pull requests:**
- Work on a feature branch, open a pull request to `main`, **squash merge** only when the owner says "merge it". Use the full 40-character head commit id as `expectedHeadSha` when merging through the API.
- Every commit message starts with the requirement ID (`BR-4: ...`). Add the footer lines your tooling requires.
- After a squash merge, if you keep using the same branch name, reset it: `git fetch origin main && git checkout -B <branch> origin/main`, then record the old history without force pushing: `git fetch origin <branch> && git merge -s ours --no-edit origin/<branch>`, then push. Force push is blocked in the cloud environment, which is why this is needed.
- This repo has no pull request template. Write the description with: what changed, why (quote the owner's request), the checks run, and anything left undone. Be honest about gaps.
- Wait for "merge it" or "open PR and merge it" before opening or merging a PR (16 Nov: the owner now often says the second form after reading the summary). Then open the PR, squash merge it with the GitHub tools, and re-run lint, typecheck and the unit tests on the merged `main` when two PRs land close together. Vercel deploys `main` on its own; check the live site, because a merged PR is not proof the deploy worked.
- Start every task from fresh `main` on a new branch (`git checkout main && git pull origin main && git checkout -b claude/<topic>`). A session may be given its own branch name by the tooling; use it.
- **Big content jobs** (translations, deepening lessons) run well as parallel sub-agents on a smaller model, each given a small group of lessons, a style reference file, the exact output paths and "do not touch git". Check the validator afterwards yourself: sub-agents see each other's half-written files and report errors that are not theirs. Commit once, at the end.

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
- **The cloud session's network is "Limited" (16 Nov).** Only package registries and a short allow-list are reachable; other hosts get a 403 from the proxy, which says nothing about whether a site works. On 16 Nov the owner approved, in the Default environment: `dns.google` (to read DNS records), `xplaind.in` and `www.xplaind.in`, and the YouTube embed and image hosts (`www.youtube-nocookie.com`, `www.youtube.com`, `i.ytimg.com`, `s.ytimg.com`, `www.gstatic.com`). Add more with the environment tool (exact names only, no wildcards; the owner approves a card). YouTube's video streams live under changing `googlevideo.com` names that cannot be listed, so a video cannot be played all the way through from the cloud: test the player's links and chrome, not the stream.
- **Auto-mode safety classifier.** In the cloud environment some commands (for example scraping around a rate limit) are refused. Do not look for workarounds; report it to the owner. It can also fail for a while with "no verdict": short read-only commands still work and git commands return after a few minutes. Retry; do not route around it (for example by pushing files through the GitHub API instead of git).
- **A stale Turbopack cache (16 Nov).** After switching branches the dev server kept serving an old stylesheet and a new component rendered unstyled. Stop the server and delete `.next/dev`, then restart; no code was wrong.
- **After a client-side navigation both pages' `<main>` exist** for a moment in the browser tests (Cache Components keeps the old page). Use `page.getByRole("main")` (the visible one) instead of `page.locator("main")`. For the same reason scope a `role="status"` lookup to `main`, since the loading screen has a hidden status line too.
- **A swipe row inside a grid stretches the whole page on a phone (16 Nov, IP-5).** A grid item will not shrink below its content, so a non-wrapping `overflow-x-auto` row made `/interview` scroll sideways at 360 px. Give the grid a `grid-cols-[minmax(0,1fr)]` base and the item `min-w-0`. Always assert "no horizontal scroll" in the test for a new row; it caught this.
- **Signed-in server pages must call `await connection()` first (16 Nov, QA-4).** Supabase's server client reads the clock as soon as it sees a saved session, and Next.js 16 with Cache Components refuses a clock read while it prepares a page ahead of time for a signed-in visitor ("unstable value `Date.now()` while prerendering"). Any new page that creates the signed-in client (`userClient()`) must start with `await connection()`. It was logged 122 times for 30 learners before it was found. To reproduce locally: build with the Supabase variables set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SIGNUPS_OPEN=true`), start the build, and request the page with a structurally valid fake session cookie (`sb-<project ref>-auth-token=base64-<base64url of the session JSON>`); the error appears in the server log.
- **Analytics must stay cookie-free (16 Nov, AN-2).** PV-2 forbids cookies and visitor IDs for signed-out visitors, which rules out default Google Analytics. PostHog runs with `cookieless_mode: "always"`; that mode silently drops every event unless "Cookieless server hash mode" is on in the PostHog project settings. Never add `posthog.identify`.
- **Google's pop-up sign-in is unreliable on phones (16 Nov, AC-1b).** On iOS Safari and in-app browsers it opens a second tab that stays open and blank after sign-in, so the learner thinks it failed. Phones use redirect mode; its post to `/auth/google` is cross-site, so any cookie it needs must be `SameSite=None; Secure`, and the `login_uri` must be in the OAuth client's Authorized redirect URIs. When a learner reports a sign-in problem, read the Supabase auth log first (`query_logs`, `source = 'auth_logs'`): it shows whether the sign-in actually succeeded.
- **Use the PDF.js legacy build, and test on iPhone Safari (16 Nov, MB-11).** The modern `pdfjs-dist` build assumes the newest JavaScript (`for await` over streams, `Map.getOrInsertComputed`, `Uint8Array.fromBase64`) and fails on iPhones with "undefined is not a function (near '...t of e...')". Import `pdfjs-dist/legacy/build/pdf.mjs` and its worker, and keep `ensureStreamAsyncIterator()` before it. Playwright here has only Chromium, so the e2e test strips those features to stand in for Safari.
- **Never pass a list of objects to a PostgREST `contains` filter (16 Nov, QA-5).** The database library writes `[object Object]` into the address, the server answers 400, and code that treats "no rows" as "not saved yet" quietly saves again. Send `JSON.stringify(...)` for a jsonb column. The claim route had saved 73 duplicate test attempts this way.
- **Read the production logs when you do a health check (16 Nov).** The Vercel runtime errors (`get_runtime_errors`, 7 days) and the Supabase logs (`query_logs` on the Postgres, PostgREST and edge sources, `event_message` for the database's own error text) found three real bugs that no test showed. A 400 on `/rest/v1/<table>` in the edge logs plus the Postgres error text points straight at the cause.
- **A page that loads fine can still be wider than a phone.** Check with the "no sideways scrolling" browser test (38 key pages, `e2e/no-sideways-scroll.spec.ts`); add any new page to its list.
- **How to test signed-in features on the live site from the cloud (16 Nov).** Needs the Xplaind Supabase host on the cloud allow-list. Create a clearly named temporary account with SQL (`insert into auth.users` with `crypt(password, gen_salt('bf'))` and an `auth.identities` row, plus a `public.profiles` row with `adult_confirmed_at = now()`, because a real sign-up creates one and many routes refuse a user without it). Sign in with `createServerClient` from `@supabase/ssr` and an in-memory cookie jar, which gives exactly the cookie the site expects (`sb-<project ref>-auth-token`), then send it as the `Cookie` header to the site's pages and `/api/...` routes (`/api/public-profile` uses `PUT`, `/api/profile` and `/api/claim` use `POST`). Node needs `NODE_USE_ENV_PROXY=1` and `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` to go through the sandbox proxy. Delete every row the test made (commitments before anything else, so the weekly cron never emails a test address), then delete the auth user. Never run the AI endpoints (they cost money) or redeem a free promo code.
- **Do not add a root `loading.tsx`** (UX-2): it delayed hydration and lost early taps. Loading feedback is a client overlay (`PageLoader`) driven by click and navigation events, and server-rendered so it shows on the first paint.
- **Moving a page needs five edits**, not one: the route, the menu (`nav.ts`), the footer, the sitemap (and its test if it now redirects), the redirects in `next.config.ts`, and every internal link (grep for the old path in `src` and `e2e`). The Topics to Library merge (16 Nov) is the worked example.
- **Visitors can see `ERR_CERT_AUTHORITY_INVALID` while the site is healthy (16 Nov).** DNS, Vercel certificates and the redirects were all correct; the cause was on the visitors' side (a network that rewrites HTTPS, a captive portal, or a wrong phone date). Ask for the network and carrier before changing anything. The same advice covers "HSTS" messages: Vercel adds the header itself, the repo does not.
- **Sub-agent drafts of translations can break YAML** with unescaped inner double quotes, and one run mangled code-fence handling. The validator catches both; run it on the whole tree before committing.
- **The business name is "ZEREH Ventures"** (with an s; corrected on the website on 16 Nov). It lives only in `src/lib/business.ts`; the footer, policies and receipts read it from there. The owner confirmed on 16 Nov that every outside document and account already had the right spelling; only the website was wrong.

---

## 12. What is pending

**Owner actions (Claude cannot do these):**
0. **Done 16 Nov: the missing Supabase migrations** (see the note in 9), plus the `last_lesson` migration found missing in the full check. **Weekly emails are set up (16 Nov):** `CRON_SECRET` and `RESEND_API_KEY` are both in Vercel (production, sensitive, never printed). The sending domain `xplaind.in` was already verified in Resend (Tokyo region, `ap-northeast-1`). The key is a sending-only key named `xplaind-website-weekly-emails`, limited to that domain (Resend accepts it and refuses anything but sending). Vercel variables only reach a deployment built after they were set, so **they take effect with the next production deploy** (merge anything to `main`); the cron then runs `/api/cron/weekly` every Monday 03:00 UTC (08:30 India time) and emails only learners who opted in under Stay on track. Confirm after the deploy that a call to `/api/cron/weekly` with the cron secret answers 200, not 503. Then try each new feature once with a real account (referral link, readiness score, project review, certificate, profile, the colleges form) and report what does not work. Supabase's advisor also flags **leaked-password protection is off** (Auth settings in the Supabase dashboard; some plans only): worth turning on.
0. **Owner switches from the 17 Nov safety audit (A11Y-1):** in Vercel set Spend Management with a hard budget that pauses the project, and add a firewall rate-limit rule for `/api/` (the connected Vercel account cannot edit firewall settings: 403); in Supabase Auth turn on leaked-password protection.
0. **MB-12 checks after the PR 108 deploy (16 Nov):** have the owner's lawyer recheck the new privacy wording; try a scanned PDF and a .pptx with a real Pro account (the pptx picture path, createImageBitmap, is only unit-tested for parsing, not e2e); watch AI cost for `scan` in `ai_usage`.
0. **Switch on PostHog (AN-2):** create a free PostHog project (US cloud), then in its Project settings turn on **Cookieless server hash mode** (events without it are dropped) and **Discard client IP data**. Put the project API key (`phc_...`) in Vercel as `NEXT_PUBLIC_POSTHOG_KEY` (production) and redeploy. For an EU project also set `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`.
0. **Done 16 Nov:** `https://xplaind.in/auth/google` added to the Google OAuth client's Authorized redirect URIs (AC-1b, PR 107).
0. **Retest a PDF on an iPhone after the MB-11 deploy** (16 Nov): open AI Studio, Study from my notes & books, and choose a PDF on the same friend's phone. It should show the book's title and chapters. If it still fails, send the exact error text.
0b. **Done (owner, 16 Nov): the native-speaker review of all four translation languages**; the owner said it is fine. Nothing was changed in the files. Optionally record it by adding `reviewed_by` (and the date) to each translation's front matter, which the schema supports; it needs the reviewer's name from the owner.
0c. **Promo codes (16 Nov):** the four codes are live in the database (`xp100` 100% off, `xp50off`, `xp25pro`, `xp10new`, all for the 30-day pass). `xp100` was given an expiry of 30 Nov 2026, 23:59:59 India time. Set `expires_at` on the others if wanted.
0e. **Visitors with a certificate warning (16 Nov):** the site and DNS are fine; find out which networks they were on. If a network is the cause there is nothing to fix on the site.
0f. **Optional database tidy-ups (Supabase advisor, 16 Nov), none urgent:** 20 row-level security policies call `auth.uid()` directly instead of `(select auth.uid())`, which matters at large scale; eight foreign keys have no index; the old five-argument `ai_reserve` can be dropped. Each is a small migration; apply and record it in 9.
1. Turn on the weekly "Commit to 90 days" emails if not done: run `supabase/migrations/20261107000000_commitments.sql` (see 0), set `RESEND_API_KEY` and `CRON_SECRET` in Vercel, verify the sending domain in Resend, optionally set `COMMIT_EMAIL_FROM`.
2. Confirm sign-in is fully set up (Google, GitHub, email) and decide when to open sign-ups (`NEXT_PUBLIC_SIGNUPS_OPEN=true`). Sign-ups are open (10 Nov), which switches on AG-1 (no AI without an account) and RG-1 (roadmaps show a preview, then ask for an account). Setting the variable back to false lifts both.
3. Set `ANTHROPIC_API_KEY`, `AI_MONTHLY_CAP_USD` and a matching spend limit in the Anthropic Console if AI tools should run in production.
4. Pro passes (PAY-1 to PAY-6): run `supabase/migrations/20261108000000_payments.sql`; create the Cashfree account and finish KYC; in the Cashfree dashboard set the payment webhook to `https://xplaind.in/api/billing/webhook`; set `PAYMENTS_MODE=sandbox` plus the sandbox keys on a Preview deployment to test, then the live keys and `PAYMENTS_MODE=production` to launch. Decide GST with a CA (receipts say "not a tax invoice" until then). Approve the refund policy wording at /refunds. Contact details are in `src/lib/business.ts` (BIZ-1: hello@xplaind.in, +91 8608761359, ZEREH Ventures, GSTIN); make sure the hello@xplaind.in mailbox receives mail. `NEXT_PUBLIC_CONTACT_EMAIL` can still override the email. Raise `AI_MONTHLY_CAP_USD` as passes sell: Pro calls skip the cap but still count towards it. Promo codes (PAY-9): run `supabase/migrations/20261113000000_promo_codes.sql`, then add codes in the SQL editor, never in the repository (it is public): `insert into public.promo_codes (code, percent_off, plan_ids) values ('code', 50, array['pass_month']);` (lower case). Switch one off with `update public.promo_codes set active = false where code = 'code';`, or set `expires_at`.
4b. Razorpay (RZ-1, 13 Nov): to test, set in Vercel (Preview first) PAYMENTS_PROVIDER=razorpay, PAYMENTS_MODE=sandbox, RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test keys), plus the payments migration and accounts. In the Razorpay dashboard add the webhook https://xplaind.in/api/billing/razorpay-webhook (payment.captured, order.paid) and set its secret as RAZORPAY_WEBHOOK_SECRET. Regenerate the test key secret, which was shared in chat. For real money: live keys and PAYMENTS_MODE=production.
5. Done 12 Nov: the Amazon Associates India tag (`AMAZON_IN_TAG`, xplaind-21) is set and book links carry it.
6. Fill in the missing video view counts: `npm run videos:views -- --missing`, commit `content/video-views.yaml`.
7. All AI-drafted lessons, glossary terms and guides were reviewed by him by 9 Nov; review new drafts and any resources marked UNVERIFIED as they appear. The owner reviewed the privacy policy with a lawyer on 12 Nov.
8. SEO (SE-8, 10 Nov): verify xplaind.in in Google Search Console and Bing Webmaster Tools, submit the sitemap and request indexing for the key pages; steps and the keyword map are in `docs/seo-keywords.md`. The two new guides (how to become an AI engineer in India; free AI courses with certificate) were reviewed by the owner on 12 Nov.

**Work Claude can pick up, in the order the owner has signalled interest:**
- Deepen older lessons to the depth of the book-informed ones (runnable code, "when not to", "from demo to production", book reference where the book covers it). Done (LQ-7): the first nine in three batches (PR 52 to 54), then, at the owner's request, every remaining lesson in the agents, automation, voice, evals, governance, LLM, retrieval, data, ops and security themes in one pass (74 lessons, PR 55). He reviewed and approved the whole pass on 8 Nov. Not deepened, by design: beginner B-level lessons, DSA, Rust, system design, software engineering, career, client-delivery and product lessons; the 11 classic ML lessons (I1 and I2 `ml` theme) followed in a second single pass (PR 56), with every code example run for real on scikit-learn and PyTorch (CPU) using synthetic data. How the pass was done: per-lesson spec files applied by a small script (sections inserted before the worked example, Common mistakes extended, the two new sections before Practice, two flashcards added); every Python block was parse-checked and the riskier ones run against mocks.
- The book-informed series is complete (LQ-1 to LQ-6, 18 lessons, 36 interview questions): sampling, how fine-tuning works, LoRA and memory maths; how chat models are made, choosing a model, synthetic data and distillation; reasoning models, inside LLM inference, building a training dataset; scoring open-ended answers, AI app in layers, catching hallucinations; AI in Indian languages, model size and scaling, perplexity and cross-entropy; fine-tuning in practice, model merging, running models on many GPUs. The book (Chip Huyen, *AI Engineering*, O'Reilly 2025) is cited as further reading, never copied, and the PDF is not in the repo.
- Bring cheatsheets back, redesigned (the infographic layout from PR 42 is in git history; ask the owner what was unclear about the old one).
- Collect more real testimonials as beta testers use the site (SO-1).
- After the native-speaker review: add `reviewed_by` to the reviewed translations, and consider showing a small "reviewed" mark on a translated lesson (not built).
- Translations of new lessons: every new lesson needs four translation files, or its "Read in" switch just shows fewer languages. Tanglish and Hinglish for new lessons can be derived from the finished Tamil and Hindi versions, which keeps the four consistent.
- **Gap found on 16 Nov: translated lesson pages (`/stop/<id>/<lang>`, 824 of them) are not in the sitemap.** Their `hreflang` alternates are in the page metadata, but `src/app/sitemap.ts` only lists `/stop/<id>`. Adding them (and an entry in `llms.txt` if wanted) would help search engines find the Tamil and Hindi pages; the sitemap test will need no change. Not done yet; ask the owner or just do it as part of SEO work.
- A native-language search and a language preference that remembers the learner's choice are not built; ask first.
- PRD reviewed against the build on 9 Nov: see "Status review, 2026-11-09" at the top of docs/PRD.md for what is superseded and what is not built yet (PL-7, part of PL-8, IQ-10, ED-5, ED-7, AC-9).

- The notes tool's study loop (MB-8 to MB-10) is built. Next candidates from docs/notes-tool-ideas.md: Indian exam formats (idea 4), chapter summaries (5), read-aloud recaps (6) and a match game (7). Open question for the owner: keep the book's text on the device so a retest needs no re-upload (see decisions, 12 Nov).

**Do not start without being asked:** more upsell pop-ups beyond the one at a daily AI limit (PAY-4), locking any lesson, roadmap, practice or project content behind Pro, XP or badges, more system design content, a system design mock interview, ads or trackers.

**Open owner decision (older, still unanswered in the repo):** whether the placement test must always ask 12 questions (needs about 10 questions at B1) or may end early when the bank runs out.

**Ideas from `docs/product-plan.md` that were never built or approved:** bookmarks, curated AI news, adaptive tutoring (Tamil and Hindi lessons were built on 15 to 16 Nov, LT-1), portfolios, premium interview prep, college and company programmes, community contributions. Treat them as ideas, and check them against FOCUS-1 before proposing.

---

## 13. Timeline

Dates are 2026. `git log` and the PR list hold the detail; `docs/decisions.md` records reasons up to 3 November.

- **25 Oct:** scaffold, content pipeline, placement test, roadmaps, stops, interview questions, nine paths, 163 explainer lessons, courses and certifications, mock interview, blog, redesign.
- **26 Oct:** AI features with guards and caps; topic tracking and one roadmap design; guided projects; X Bot; Top 25 interview sets; content review pass.
- **27 to 31 Oct:** video lessons, labels and launch sign-off; videos everywhere, library, tracks, pastel 3D look.
- **1 to 3 Nov:** search and AI visibility; books with affiliate links; sign-up gates; papers library; Rust and AI-tool guides; the home road flight (MO-6 to MO-8); sign-ups put on hold (SU-4); AI tools open to guests (SU-5); brand system (BR-1 to BR-4 original set); About and founder story; accessibility fixes; two Vercel crashes fixed.
- **9 to 11 Nov:** one free AI try, then sign in (AG-1), roadmaps and AI tools need an account (AG-1, RG-1, PR 58 to 60); search-led titles, brand structured data and keyword guides (SE-8, PR 61); menu icons, the feature deck, friendly errors and loading feedback (UX-1 to UX-4, PR 62 and 63); only "Sign up" and "Sign in" wording (AC-12); doc review and PRD status review (DOC-2, PR 57).
- **12 to 13 Nov (PR 65 to 76):** sign-in timeout (AC-13); the study loop for notes and books (MB-8 to MB-10, PR 68); a narrower product (FOCUS-2, PR 69); business details for the payment gateway (BIZ-1, PR 70); Razorpay beside Cashfree (RZ-1, PR 71); a one-time AI trial and a pricing page that sells on value (PAY-7, PAY-8, PR 72); promo codes (PAY-9, PR 73 and 74); the unslop passes (UX-5, UX-6, PR 75); learning free with an account, AI for Pro (CG-1, PAY-10, PR 76).
- **14 Nov (PR 77 to 85):** a folded and then numbered phone menu (NV-5, NV-6); Pro on its own in the menu and "AI Studio" (NV-7); the 7-day pass, referrals and funnel counts (PAY-11, RF-1, AN-1); readiness score, project review, job match, profile and certificates (IR-1, PR-1, JM-1, PF-1, CT-1); tutor in Indian languages, interview-date plan, 2-minute check and nudges (IL-1, PP-1, QS-1, NG-1); colleges page, outcome stories and pricing around outcomes (CB-1, OS-1, OP-1); the Deep Teal and Brass rebrand (BR-10); typographic blog covers (BL-2).
- **15 to 16 Nov (PR 86 to 95):** every lesson translated into Tamil, Hindi, Tanglish and Hinglish (LT-1): the pilot (PR 86), eight batches of Tamil and Hindi (PR 87 to 93, 161 lessons), the last 45 Tamil and Hindi lessons (PR 94) and the remaining 165 Tanglish and Hinglish lessons (PR 95). The build moved to a second Claude account partway through (16 Nov), and the last two passes ran as parallel Sonnet sub-agents.
- **16 Nov (analytics):** cookie-free PostHog visitor analytics, off until its key is set (AN-2).
- **17 Nov (safety audit, A11Y-1):** skip link, funnel rate limit, and an audit of row-level security, alt text, AI spend caps and consent. See decisions.md.
- **16 Nov (MB-12, picture reading, PR 108, merged):** the notes tool reads scanned PDF pages and pictures in slides, Pro only, and opens .pptx. Consent shown before sending; `/api/ai/book-pictures`; kind `scan`. Code: `src/lib/ai/scan.ts`, `src/lib/book/pictures.ts`, `pptx.ts`, `src/app/ai/book/picture-panel.tsx`. Limits: 30 pictures per upload, 4 per request, Pro 60 requests a day (`TIER_LIMITS`), free and guests 0; `runAi` has a `burst` option (12 a minute here). JSZip is a direct dependency. The privacy page was reworded and needs the owner's lawyer to recheck it.
- **16 Nov (phone Google sign-in, PR 107):** Google sign-in on phones stays in one tab (AC-1b); needs the redirect URI added in Google Cloud first.
- **16 Nov (iPhone PDF fix, PR 105):** PDFs failed to open in the notes tool on iPhones; switched to the PDF.js legacy build with a stream polyfill (MB-11).
- **16 Nov (full check, PR 104):** one full analysis of every feature: the production Vercel and Supabase logs, a live crawl (662 pages), probes of all API routes, a production build with the whole browser suite, and a 69-page sweep. Fixed: a rendering error on every signed-in visit to the dashboard, settings and billing (QA-4); duplicate saved test attempts (QA-5); the missing `last_lesson` columns (applied to production); the mock interview page wider than a phone (QA-6). `CRON_SECRET` and `RESEND_API_KEY` set in Vercel (the Resend domain was already verified). After the merge (PR 104, live on xplaind.in): the weekly email route accepted the cron secret and answered `{sent: 0, failed: 0}` (nobody has opted in yet); the 74 duplicate test attempts were deleted (4 attempts for 4 learners remain); 18 signed-in requests to the dashboard, settings and billing logged no error on the new deployment (the old one had logged the clock error 122 times); no failed Supabase requests since the deploy.
- **16 Nov (PR 103):** the Interview page opens on the question bank, with the preparation links in a side panel (IP-5).
- **16 Nov (database, outside the repo):** the nine missing tables were created by applying the 7 Nov and 14 Nov migrations to production, and the `xp100` promo code got its 30 Nov expiry.
- **16 Nov (PR 100 and 101):** this handover brought up to date and made a standing rule (DOC-3, PR 100); video lessons stop sending learners to youtube.com: the player is sandboxed so its YouTube links do nothing (VD-3, PR 101).
- **16 Nov (PR 96 to 99):** the home page promotes lessons in your own language (LT-2, PR 96); the loading screen with the animated Xplaind X, and a steadier home search test (UX-7, PR 97); the business name corrected to ZEREH Ventures (BIZ-1, PR 98); the Library opens on technical lessons, Library and Topics merged, patterns and system design last in Interview, practice cards in one place, no glossary on Practice, and "Pricing" instead of "Pro" in the menu (LY-1, LY-2, IP-4, NV-8, PR 99). Also that day, outside the repo: `xp100` given an expiry of 30 Nov, and a read-only check of DNS, certificates and the Supabase tables (the migrations warning in 9).
- **12 Nov:** the notes tool's study loop (MB-8 to MB-10, PR 68); a narrower product (FOCUS-2): the AI roadmap generator, X Bot and the Rust track removed, and the weekly plan and Monday emails merged as "Stay on track".
- **2 Nov (also):** fewer AI tools. The AI roadmap editor and AI course generator were removed and the AI coach was merged into the tutor; the roadmap generator, tutor, notes-to-test tool and resume review stay.
- **4 to 6 Nov:** many owner-list rounds (roadmap drawer, lesson layout, topic tracks, "Commit to 90 days", a DataCamp-style minimal direction). XP and badges were removed, and month-based durations were removed from the site.
- **6 to 7 Nov:** research on AI interview prep demand and on AlgoMaster (a Claude doc, "Xplaind: the AlgoMaster for AI roles", may no longer be reachable after an account change). PR 36: lesson layout fix, data engineering channel videos, testimonials, cheatsheets. PR 37: the Interview section (patterns and worked designs). PR 38: software engineering and Git track, "Commit to 90 days". PR 39: the minimal look, site-wide (BR-3).
- **8 Nov (later):** PR 44: this handover. PR 45 and 48 to 51: book-informed lessons batches 2 to 6 (LQ-2 to LQ-6). PR 46: every DeepLearning.AI course and Andrew Ng's courses as video courses (VD-2). PR 47: Pro passes with Cashfree in test mode, tiered AI limits, pricing, billing and refund pages (PAY-1 to PAY-6). PR 52 to 54: deepening older lessons, three batches of three (LQ-7). PR 55: the remaining 74 AI-engineering lessons deepened in one pass (LQ-7). PR 56: the 11 classic ML lessons (LQ-7).
- **7 to 8 Nov:** PR 40: three book-informed lessons (LQ-1). PR 41: videos page by topic with filters and view counts (VD-1). PR 42: sideways testimonials with excerpts, example-week card, line-art covers, infographic cheatsheets (BR-4). PR 43: cheatsheets paused, reviewed marks, product focus recorded (CS-3, FOCUS-1).

`docs/decisions.md` is up to date to 16 November (it has entries for LT-1, LT-2, UX-7 and the Library and menu restructure). Add new decisions there as you make them.

---

## 14. The other docs

| File | What it is |
| --- | --- |
| `CLAUDE.md` | Project rules for Claude Code. Short. Read every session |
| `AGENTS.md` | Warning that Next.js 16 differs from older versions |
| `docs/PRD.md` | The spec. Requirement rows by ID. The live source of truth |
| `docs/decisions.md` | Why choices were made, slice by slice, to 16 Nov. Read the newest entries first |
| `docs/seo-keywords.md` | The keyword map and Search Console steps (SE-8) |
| `docs/notes-tool-ideas.md` | Ideas for the study-from-notes tool (Indian exam formats, chapter summaries and more) |
| `.claude/skills/README.md` | Which design, 3D and motion skills are in the repo (about 127) and where they came from; they load in every session, nothing to install |
| `docs/brand.md` | Logo, colour, type, buttons, corners |
| `docs/product-plan.md` | Nine paths and the feature phases |
| `docs/supabase-setup.md` | Step-by-step account set-up for the owner |
| `docs/handoff.md` | The older (25 to 26 Oct) handoff. Superseded by this file; kept for history |
| `docs/roadmap-sh-comparison.md` | How the roadmaps compare to roadmap.sh |
| `docs/review/` | Notes from the October content review pass |

---

## 15. Appendix: PRD requirement families

`AC` accounts · `AG` AI needs an account · `AI` AI tools · `AN` funnel counts · `A11Y` accessibility · `BIZ` business details · `BK` books and affiliate · `BL` blog · `BR` brand and look · `CB` colleges and batches · `CG` content gates · `CM` commitments and reminders · `CO` spend caps · `CS` cheatsheets (paused) · `CT` certificates · `DOC` documentation · `ED` editorial rules · `FOCUS` product focus · `GP` guided projects · `IL` tutor in Indian languages · `IP` interview patterns and interview page · `IQ` interview questions and mock review · `IR` interview readiness · `JB` jobs and salaries · `JM` resume to job match · `LB` papers and free books · `LQ` book-informed lessons · `LT` lesson translations and promoting them · `LY` Library · `MB` study from notes and books · `MO` motion and 3D · `NG` nudges · `NV` navigation · `OP` pricing around outcomes · `OS` outcome stories · `PAY` Pro passes and payments · `PF` public profile · `PG` code playground · `PL` placement test · `PP` interview-date plan · `PR` practice and project review · `PV` privacy · `QA` quality and performance · `QS` 2-minute check · `RD` roadmap PDF · `RF` referrals · `RG` roadmap gates · `RM` roadmaps and lessons · `RV` resume review · `RZ` Razorpay · `SC` security · `SE` search and AI answer visibility · `SO` social proof · `SU` sign-up gates · `SWE` software engineering track · `TR` trust and founder story · `UX` look and feel details · `VD` videos page · `VS` voice and mock interview · `WP` weekly plan · `XB` X Bot (removed).

## Restore points

- **Before the unslop passes (UX-5, UX-6), 13 Nov 2026.** The site exactly as it was is saved on the branch `backup/pre-unslop-2026-11-13` (commit `1b76ae7`). The unslop change is one squash commit on main, `22e21a4` (PR 75). To roll back in one step, either:
  - revert it: `git revert 22e21a4` on a branch, then merge that PR; or
  - in Vercel, open Deployments, find the production deployment of `1b76ae7` and choose "Instant Rollback" (fastest, no code change; the next merge to main deploys again).
  Keep the backup branch; do not delete it.

- **Before the Library, menu and loading-screen changes, 16 Nov 2026.** The last `main` commit before the Library and menu restructure is `41b5510` (PR 98). The restructure (LY-1, LY-2, IP-4, NV-8) is one squash commit, `8f85bcc` (PR 99): `git revert 8f85bcc` on a branch undoes it (old `/topics` links keep working either way). The loading screen (UX-7) is `3a2a8d8` (PR 97). In Vercel, "Instant Rollback" to the production deployment of `41b5510` is the no-code way back.
- **Database changes made outside the repo:** the `xp100` promo code's `expires_at` was set to 2026-11-30 23:59:59+05:30. To lift it: `update public.promo_codes set expires_at = null where code = 'xp100';`.

