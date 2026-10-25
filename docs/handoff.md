# Handoff: where the build stands

Written 2026-10-25 so a new Claude Code session can pick up without the earlier chat. Read `CLAUDE.md`, `docs/PRD.md` and `docs/decisions.md` first. This file adds what those do not say.

## Product in one paragraph

Xplaind (xplaind.ai) is a free-first AI learning path for India. A short test places a learner on a nine-level ladder (B1 to P3) for a goal, first "GenAI Engineer". The site then shows the next five steps, each with the best free or low-cost course, a check and a project. There are interview questions, multiple-choice practice and books with disclosed affiliate links. No ads and no sponsored content. Owner: Shyam (prabaharshyam@gmail.com). The PRD in `docs/PRD.md` is a snapshot; the live copy is the Claude doc at https://claude.ai/artifact/Mv69GaZfM4gJn3TdcgyUq5.

## Update, later on 2026-10-25: nine paths

The owner widened the product from one path to nine; read `docs/product-plan.md`. Where the build stands now:

- Nine paths in `content/goals/`, each an ordered route through one shared lesson library: GenAI Engineer, Forward Deployed Engineer, AI for Beginners, Agentic AI Expert, RAG Expert, AI Automation Specialist, LLMOps / AI Platform Engineer, AI Product Manager and ML Engineer. Every topic on every path has a lesson; nothing is left "being written".
- 163 lessons, all in the explainer format (What it is, How it works, A worked example, Common mistakes, Practise), each with key terms, a free primary course and a check. 239 resources (links opened by Claude on 2026-10-25), 450 check questions, 261 glossary terms at `/glossary`.
- Pages: `/paths` (chooser), `/roadmap/<path>` (staged map), `/start/<path>` (level test for ladder paths), home page rebuilt for nine paths.
- Everything is still a draft for human review; launch mode lists about 1,200 sign-off gaps.
- Not built yet, from the owner's final-stage list (phases in the product plan): bookmarks, guided projects with rubrics, curated AI news, newsletter and reminders, Tamil, adaptive tutoring and mock interviews (need model calls), portfolios, premium interview prep, college and company programmes, community contributions. Interview questions still cover the GenAI topics only.

## Standing rules from the owner

- Do not ask learners their background (IT, marketing, sales). The test places the level. Ask only goal and weekly hours.
- Prefer free and very low-cost courses (about ₹400, under $10), and make the value feel high.
- Affiliate links are always labelled and never change ranking (ED-2).
- He buys domains he does not use, so keep scope tight and avoid waste.
- When he is driving he listens to replies as audio: plain sentences, no tables or heavy formatting.

## Done (branch `phase-1-build`, three commits)

- S0 scaffold: Next.js 16 with Cache Components, Tailwind 4, Vitest, Playwright at 360 px, CI workflow with a secret scan, `.env.example`.
- S1 content pipeline: Zod schemas, loader, cross-file validator, `npm run content:validate` (add `-- --launch` for the strict mode), sample stops rendered at `/stop/[id]`.
- S2 placement test: pure module in `src/lib/placement/` (scoring, gaps, staircase, server re-scoring, staircase check), `/start`, `/result`, 54 draft questions.
- Checks that passed on the last run: 119 unit tests, 9 browser tests, axe WCAG 2.1 AA scans on the start, question and result screens, lint, typecheck, production build.
- Not yet run: the GitHub Actions workflow. It runs when a pull request is opened.

## Not trustworthy yet (needs a person)

- All 54 placement questions, 6 stops, 6 check questions and 6 sample resources were drafted by Claude and are flagged `UNREVIEWED` / `UNVERIFIED`. Launch mode fails until a person replaces those fields with their name after checking each item. Resource hours, certificate flags and prices were written from memory; the provider pages could not be opened from the build environment.
- `PRICE_CAP_INR = 900` is an assumption about "about 10 US dollars".

## S3 done (branch `claude/practical-albattani-im1h44`)

Roadmap and level pages, full resource cards with cost labels, `/go/[resource-id]`, the next five steps on the result page, stop progress with the check quiz, project links and "I already know this", the "Free only" switch and a draft How we rank page. Progress is saved on the device until S5. See `docs/decisions.md`, slice S3.

## Next slices (from the PRD build plan)

1. Books (BK-1 to BK-3), once the owner has an Amazon Associates India tag. Interview questions and practice are done (S4).
2. Lessons for optional topics, to reach 5 per level.
3. Switch on accounts: the owner follows docs/supabase-setup.md; then test sign-in end to end. S5 code is done.
4. S6 link checker and admin, S7 landing, email and legal pages, S8 hardening and launch.

Write more stops as you go. `npm run content:validate -- --verbose` lists topic tags that have no review stop yet; that list is the outline for the stops still to write.

## The owner's five-step phase 1 flow (message of 2026-10-25)

1. User analysis, then a roadmap with a checklist. 2. Each roadmap topic linked to knowledge sources (books, YouTube, courses, certifications). 3. Checklist ticked as topics finish, with a percent covered. 4. An evaluation section: interview questions, multiple-choice questions and interview simulations, with a strengths and gaps analysis after a mock interview. 5. Interview prep based on top companies' interview structure.

Suggestions already given to him, pending his reply:

- Steps 1 to 3 match release 1. Make percent covered hours-weighted and measured from the start level.
- Step 2: one primary resource plus up to two alternates per stop.
- Step 4: questions and MCQs in release 1; a typed mock interview with a strengths and gaps report in release 2 (needs model calls, a daily cap, a spending cap and a kill switch; this is the first run-time model use, so CLAUDE.md's "no model calls in release 1" still holds); voice later. Every gap in the report should link to a stop.
- Step 5: build tracks by employer type (global product company, Indian IT services and in-house tech centres, AI startup), labelled "typical, from candidate reports". Company-specific interview structure found so far is secondhand from prep vendors and inconsistent, so do not assert per-company facts without a source. Do not use leaked questions.

## Open decisions for the owner

- Who reviews the 54 questions and the sample resources.
- Whether the typed mock interview in release 2 is approved.
- Whether the test must always ask 12 questions (needs about 10 questions at B1) or may end early when the bank runs out at the learner's level (current behaviour; see `docs/decisions.md`).
- The PRD document still needs updating for the five-step flow once he decides.

## Running it

```bash
npm install
npm run check            # lint, typecheck, unit tests, content validation
npm run dev
PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e   # only if a browser is pre-installed
```

GitHub login in the cloud workspace was invalid, so no pull request has been opened. Open one from `phase-1-build` to `main`: https://github.com/prabaharshyam/xplaind/pull/new/phase-1-build
