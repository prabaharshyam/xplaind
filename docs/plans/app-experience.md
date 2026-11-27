# Plan: Xplaind as an app once signed in (draft for the owner)

27 Nov 2026. Status: **plan agreed in outline (decisions in section 11); nothing built yet.** Owner: "go with A and B. I also want ours to look like an app, not a website: landing and marketing pages, but once signed in an app interface where users learn, download roadmaps, do mock interviews, use the resume reviewer, flashcards and every feature. Don't implement anything yet." Reference: `docs/research/studyfetch-platform.md` (patterns only).

## 1. The idea in one line

Same URLs, two frames. Visitors see the website (header, footer, marketing pages, everything search engines index). A signed-in learner sees the same pages inside an app frame: a side rail, a slim top bar, no marketing footer, and a phone tab bar. Lessons, roadmaps and tools are the same pages in both; only the frame around them changes.

## 2. How it works technically (and why)

- Sign-in is known only in the browser today, and pages are static (Cache Components). Choosing the frame on the server would make every page dynamic and slower, so the frame is chosen in the browser.
- To avoid a jump on load, copy the dark-mode trick (`THEME_SCRIPT`): a tiny script in `<head>` reads a "signed in on this device" hint and sets `data-app` on `<html>` before paint. CSS shows the app frame or the website frame from that attribute. Both frames are in the static HTML; only one is shown.
- The hint is presentation only. It never unlocks content; access rules (account wall, PV-2 under-18, Pro) stay exactly as they are. When the real sign-in state arrives it corrects the hint (expired session, sign-out in another tab).
- The in-memory flag in `account-sync.ts` is not stored today; the hint needs a stored value. Name it so the secret scan does not flag it (gitleaks matches constants ending in `KEY`).
- No redirect from `/`: the owner wants signed-in learners to see the landing page, with a way into the app.

## 3. Step 0: see and test it signed in (first deliverable)

All builds here run with accounts off, and every browser test runs signed out, so nothing signed-in can be checked today. Before any frame work:
- An accounts-on test build (dummy Supabase URL) where Playwright places a fake session in the browser's storage and answers Supabase calls, so tests and screenshots can run as a signed-in learner. No product code changes; test-only.
- First use: finally check the signed-in dashboard and the phone tab bar (both still "unseen" in the handover).

## 4. Which pages get which frame

A pure function `frameFor(path)` in `src/lib/nav.ts` with a unit test:

| Frame | Pages |
| --- | --- |
| Website always | `/`, `/pricing`, `/about`, `/colleges`, `/stories`, `/blog/*`, `/how-we-rank`, `/disclosure`, `/contact`, `/privacy`, `/terms`, `/refunds`, `/explore`, `/signin`, `/interview/for/*`, `/u/*` (public profile), `/certificate/*`, `/card/*`, `/go/*`, `/r/*` |
| App when signed in, website for visitors | `/dashboard` (app Home), `/paths`, `/roadmap/*`, `/stop/*`, `/library`, `/topics`, `/videos`, `/glossary`, `/papers`, `/books`, `/resources`, `/certifications`, `/projects/*`, `/practice`, `/interview` (Questions, patterns, design, top), `/interview/simulator`, `/interview/prep`, `/ai/*`, `/plan`, `/playground`, `/jobs`, `/settings/*`, `/start`, `/result` |

## 5. The app frame

**Laptop (from 1024 px):** a light rail on the left (not StudyFetch's near-black; it keeps the light pastel look the owner chose), 72 px of icons that widen to labels on hover or a pin: Home, Learn (roadmaps, lessons, library), Practice (flashcards, questions), Interview (mock interview, prep plan), AI Studio (notes, tutor, resume, playground), Career (jobs, resume), and at the bottom Settings and the account. A slim top bar inside the canvas: page title or breadcrumb, search (Ctrl K), streak, focus timer, theme switch, account menu. The content canvas is the warm page with white cards.

**Tablet (640 to 1023 px):** the rail stays as icons only.

**Phone (360 px first):** a compact top bar (title, search, timer, account) and the existing bottom tab bar (NV-11) widened to five places: Home, Learn, Practice, Interview, AI.

**What moves or changes:**
- The marketing header (GL-1 capsule, UX-25 docking) is not shown in the app; the reading-progress line (LS-3), sticky offsets and the phone menu sheet are re-anchored to the app top bar.
- The full footer (FT-2) and the Explore more tools band (UX-17) are not shown in the app frame; the rail replaces both. A small "Help, privacy, terms" link sits at the foot of the rail.
- Timer, streak, search, theme switch and account menu move from the marketing header to the app top bar.
- Pages with their own bottom bar (a lesson, the mock interview call) keep hiding the tab bar.

## 6. App Home (replaces the dashboard's top)

Like StudyFetch's signed-in home, in Xplaind's brand:
- A greeting and an "Ask anything" box that opens the AI tutor with the question.
- Quick-action cards (springy icon tiles): Continue my lesson, Mock interview, Review my resume, Study from my notes, Flashcards, Download my roadmap PDF, Plan my week.
- Continue: the current roadmap with progress, then "Your study sets" (folder cards) and recent tests and decks.
- Today: this week's plan and the streak.

## 7. Every feature and where it lives in the app

| Feature | Rail place | Page |
| --- | --- | --- |
| Roadmaps, download roadmap PDF | Learn | `/paths`, `/roadmap/*` (download is a button in the roadmap's top bar and a Home quick action) |
| Lessons, library, videos, glossary, papers, books, courses, certifications | Learn | as today |
| Flashcards, quick quizzes | Practice | `/practice` |
| Interview questions, patterns, system design | Interview | `/interview` |
| Mock interview, prep plan | Interview | `/interview/simulator`, `/interview/prep` |
| Study from my notes & books, AI tutor, code playground | AI Studio | `/ai/book`, `/ai/tutor`, `/playground` |
| Resume review, jobs and salaries | Career | `/ai/resume`, `/jobs` |
| Weekly plan, projects | Learn | `/plan`, `/projects` |
| Progress, certificates, profile, settings | Account | `/dashboard`, `/settings` |

## 8. Order of work (changed from "A then B", and why)

B's three-pane notes workspace is laid out differently inside the app frame than under the website header, so building B first would mean building it twice. A (small animations) does not depend on the frame.

1. **Step 0:** signed-in test seam, and check today's signed-in screens.
2. **Part A** (can run alongside 3): springy icon tiles and card lift; flashcards that flip in 3D with Space and arrow keys; quiz answer rows with A to D keys, "I don't know", three confidence tiles (1 to 3) and a green result card; pulsing loading placeholders and a confirmation pill; focus timer colours and a "Nice work!" screen; a typed greeting and "Thinking…" in the tutor.
3. **App frame:** `frameFor`, the pre-paint hint, the rail, top bar and phone tab bar; move header items; hide footer and Explore band in the app; tests at 360, 768 and 1280 px, light and dark.
4. **App Home.**
5. **Part B inside the app frame:** the notes workspace (sections, content, and "Ask your notes" always open on the right); study sets as folders that fan on hover; the 3-step test wizard with a live preview; select text to Ask or highlight; set dashboard with stats and "recommended next".
6. **Signed-in audit** of every page at 360 and 1280 px, then docs and a preview link.

A preview link after each step.

## 9. Translating StudyFetch into Xplaind's brand

The teardown's values do not drop in. The brand rules (docs/brand.md, `brand.test.ts`) allow only brand teal, brass, emerald, amber, rose, sky and zinc, corners of full, 2xl or 3xl, tap targets of at least 44 px, and no serif. So: their lime, lavender and pink become our emerald, sky and rose; 6 to 12 px corners become 2xl; 32 px pills become 44 px. Widths: at 1280 px a rail (72) plus a set navigation (224) plus an Ask panel (360) leaves about 620 px for content, so the notes workspace shows all three only from 1280 px; below that the Ask panel opens over the content.

## 10. Not changing

Who can see what (lessons stay open; the account wall, PV-2 and Pro stay as they are), URLs, search pages, prices and their dates, the brand colours.

## 11. Decisions (owner, 27 Nov)

1. **A signed-in learner who opens xplaind.in sees the landing page**, not the app. The landing page stays in the website frame for everyone; for a signed-in learner its main buttons and the header lead into the app ("Go to my app", the app Home at `/dashboard`). No redirect from `/`.
2. **Visitors keep the website frame** on lessons, roadmaps and tools, with sign-up prompts; the app frame starts after sign-in.
3. **No marketing footer inside the app**; a small "Help, privacy, terms" link sits at the foot of the rail.
4. Still open from Part C, not planned: serif headings, a dark rail (the plan uses a light one), first-visit guided tours (later, notes workspace only).

## 12. PRD rows this will add or amend

New rows under a free ID family (`APP-`, checked free on 27 Nov). Amends NV-10 (menu groups move to the rail in the app), NV-11 (tab bar becomes the app frame's phone form), GL-1 and UX-25 (header only in the website frame), FT-2 and UX-17 (not in the app frame), DB-1 (dashboard becomes the app Home).
