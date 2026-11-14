# Xplaind: product requirements

Oct 25, 2026 · Shyam Prabahar

This PRD specifies release 1 of Xplaind (xplaind.ai) for building with Claude Code: a free-first AI learning path for Indians, where a short test places each learner on a nine-level ladder and then shows the next five steps, each with the best free or low-cost course. Requirement IDs such as PL-1 and RM-2 tie every requirement to a build slice.

Release 1 is about eight weeks of work, and a one-week landing page (release 0) goes live first. The voice interview simulator is release 3, not release 1.

## Amendments, 2026-10-26 (owner's request)

- **Nine roles.** The site offers exactly these roadmaps, in this order: AI Engineer; Generative AI & LLM Engineer; Forward Deployed Engineer (FDE); AI Product Manager; Agentic AI Engineer; AI Automation Specialist; AI Governance & Compliance Specialist; Machine Learning Engineer; MLOps Engineer. The home page shows all nine first. The nine-level ladder below is the Generative AI & LLM Engineer path (id `genai-engineer`), which now includes the retrieval lessons. AI for Beginners and RAG Expert are retired, and LLMOps became MLOps Engineer. Their old links redirect to the closest new roadmap.
- **Positioning.** The owner asked that Xplaind not call itself free, because people value free things less. Pages no longer say "free" about Xplaind itself. "Free first" below still governs how courses are chosen and ranked, and course cards still show each course's real cost (RM-6).

## Status review, 2026-11-09

A pass comparing this document with the site as built. Rows that changed carry a "Status 2026-11-09" note at the start.

- **Built and current:** placement test (PL-1 to PL-6), roadmaps and lessons (RM-1 to RM-15, every AI-engineering and ML lesson deepened under LQ-7 and reviewed by the owner), guided projects (GP), X Bot (XB-1, XB-2), search and AI visibility (SE-1 to SE-8), Study from my notes & books (MB), roadmap PDF (RD), interview content (IQ-1 to IQ-9, IP-1 to IP-3), books and papers (BK, LB), accounts and progress (AC-1 to AC-7, AC-11), playground, jobs, weekly plan and resume review (PG, JB, WP, RV), design and motion (BR, MO, NV), Pro passes in test mode (PAY-1 to PAY-6), Commit to 90 days (CM-90).
- **Superseded:** SU-3 for AI tools (by SU-5), XB-3 (by SU-5 and PAY-1), CS-1 and CS-2 (paused by CS-3), CM-1 (by CM-2), the pastel palette in MO-5 (by BR-3).
- **Not built yet:** PL-7 (item review query), the 30-day part of PL-8, IQ-10 (spaced repetition), ED-5 (weekly link check job), ED-7 (/admin review page), AC-9 (landing email capture). The voice simulator rows VS-2 to VS-7 describe a recorded, model-scored release; the simulator that shipped transcribes in the browser and stores no audio.
- **Added 2026-11-09 and 10:** AG-1 (AI needs an account once sign-ups open), RG-1 (roadmaps show a preview, then need an account), PG-6 (runnable code only where it runs, plus 34 "Try it" examples), MB-7 (X Bot tucks aside on phones), TR-3 (the About page's free promise).
- **Waiting on the owner:** opening sign-ups (SU-4, which also switches on AG-1), payments going live (PAY), legal review of privacy and terms, and the placement-test length question in "Risks and decisions for you".
- **IDs made unique:** a second BR-3 became BR-8, a second BR-4 became BR-9, a second AC-6 became AC-12, a second IQ-8 became IQ-10, and the software engineering track became SWE-1.

## Product summary and evidence

Xplaind helps India prepare for AI. A learner takes a short test, is placed on a nine-level ladder, and sees the next five steps, each with the best free or low-cost course, a check and a project. Interview practice lives in the same product.

**The problem.** Friends of the founder say "I want to learn AI, but I don't know what to learn or where to start." YouTube and Instagram roadmaps name topics, such as Python and then machine learning, but not the exact free course for each step. The product's job is that last mile: the exact resource, in order, at the learner's level.

**Principles the build must respect.**

- Place by test, not by label. Never ask "marketing, IT or sales". The test sets the level; the learner states a goal and weekly hours.
- Free first, low cost where it earns its place. Paid picks target about ₹400 and stay under about 10 US dollars unless a written exception says why.
- No ads and no sponsored content. Affiliate links are disclosed and never change ranking.
- Small steps. Show the next five steps, not the whole map.
- Prove it. Every stop ends in a check or a project, so learners see themselves improving.

| Finding | Source | What it changes in the design |
| --- | --- | --- |
| "most people quit because they overload themselves too early"; "Most people burn out trying to optimize the 'perfect roadmap.'" | [r/learnmachinelearning](https://reddit.sentinel-team.org/posts/1t5hza4/snapshots/2026-05-09T01%3A10%3A29.64383Z) | Next-five-steps card, weekly hours in the test, a time estimate on every stop |
| "following guides that don't quite work"; a commenter asks for concrete examples | [r/ArtificialInteligence](https://reddit.sentinel-team.org/posts/1qutafg/snapshots/2026-02-03T22%3A20%3A10.39207Z) | Each stage ends in a mini-project with a finished example to compare against |
| "nobody's prep material covers all four in one place"; LLM evals "comes up way more than I expected" | [r/LLMDevs](https://reddit.sentinel-team.org/posts/1sn7hc8/snapshots/2026-04-17T05%3A37%3A44.74927Z) | Interview track spans transformers, RAG, agents, evals and system design |
| A beginner asks for advice with "no sponsored stuff please"; two of four replies promoted something | [r/learnmachinelearning](https://reddit.sentinel-team.org/posts/1t5zq5u/snapshots/2026-05-09T01%3A10%3A29.64383Z) | How-we-rank page, affiliate disclosure, last-verified date on every resource |
| roadmap.sh shipped an AI Tutor (Apr 2025), AI quizzes (Jul 2025), a personalize button (Aug 2025) and a learning-plan generator (Sep 2025) | [roadmap.sh changelog](https://roadmap.sh/changelog) | A personal roadmap alone is not the difference. Win on India, rupee prices, the exact resource per step, interview practice and non-engineers |
| AI training is "always teaching the AI engineering of 18 months ago" | [Tian Pan](https://tianpan.co/blog/2026/05/05/ai-engineering-training-programs-perpetually-behind) | Levels teach fundamentals (transformers, retrieval, evals, systems); the resource layer carries dates |
| 85% of employees say their training does not help them use AI in their role; 79% say learning is not fully personalized | [Docebo](https://www.businesswire.com/news/home/20260407928752/en/Docebo-Releases-The-AI-Readiness-Gap-The-2026-Enterprise-Learning-Wake-Up-Call-Report) | Release 2 role tracks built on weekly work tasks. This is a vendor survey of six Western countries, not India |

The evidence is small: five Reddit threads read through a third-party mirror, two Hacker News threads and two vendor or blog pieces. Market size, hiring and traffic figures are in the Demand and Competitors sections of the idea validation doc, filed under the earlier name One Stop AI Guide; this PRD does not repeat them.

## Users, goals and success metrics

Release 1 serves one learner: an Indian fresher or working professional who wants to become a GenAI engineer, or to understand what that takes, and can give 3 to 8 hours a week. Assumptions to test: English first, mostly on a phone, learns mostly from free material. Non-engineers who want AI for their own work arrive in release 2, through the same test and a second goal.

**Goals**

- G1: A learner knows their level in under 3 minutes without signing up.
- G2: A learner sees exactly what to do next, with the course and link, on one screen.
- G3: Every resource on the site is real, current and honestly priced.
- G4: A learner comes back weekly because the next step is waiting.
- G5: A learner can practice AI interview questions at their level.

**Non-goals for release 1**

- Ads, sponsored placements or paid listings, ever.
- Hosting full courses. Own content is limited to short lessons and notes.
- A tool directory, a daily news site, forums or comments.
- Accounts for anyone under 18.
- Native mobile apps, our own certificates, and languages other than English.

| Metric | Target | If missed |
| --- | --- | --- |
| Tests completed by day 90 after public launch | 1,000 or more | Rethink the idea if under 300 |
| Signed-in learners who return within 7 days | 25% or more | Rethink if under 10% |
| Email or WhatsApp Channel signups by day 90 | 500 or more | Rethink if under 100 |
| Test starters who finish | 60% or more | Shorten the test; fix the question with the worst drop-off |
| Median time to finish the test | Under 3 minutes | Cut questions |
| Soft-launch testers who say their placed level feels right | 70% or more | Retune question difficulty and the pass thresholds |
| Broken links live on the site at each weekly check | 0 | Block the release until fixed |

The first three targets come from the Verdict in the idea validation doc. All targets are my judgment, not sourced benchmarks.

## Scope and main flow

| Release | When | Ships |
| --- | --- | --- |
| 0: Landing | Days 1 to 7 (xplaind.ai is already bought) | One page, a "biggest problem" poll, email capture, a WhatsApp Channel link, privacy and disclosure pages |
| 1: MVP | Weeks 1 to 8 | Placement test; the GenAI Engineer roadmap with nine levels; resource pages with rupee prices and last-verified dates; 100 interview questions and MCQ checks (40 by week 4); a books page; email-link login, saved progress, streak and level card; weekly email; weekly link check; a review page for you |
| 2: Depth | After the day-90 review | Typed-answer grader with a daily cap; a second goal, AI at work, for non-engineers; 30-day re-test; spaced repetition for interview questions; a news item in the weekly email; glossary hover; paid-tier waitlist |
| 3: Voice and reach | After release 2 proves out | Voice interview simulator with a written report; more goals; Hindi and Tamil; teacher and parent kit |

Never ships, in any release: ads, sponsored content, paid placement, or selling learner data.

**Main flow, release 1**

1. A learner arrives from a video or search and taps "Find my level".
2. They pick a goal and weekly hours. In release 1 the only goal is GenAI Engineer; a second option, "something else", records what they want, to choose goal two.
3. They answer 12 to 15 questions, each with an "I don't know" choice. No sign-up.
4. They see their level, top three gaps, a time estimate and the next five steps. The result is saved on the device.
5. They tap a step and see why it was picked, its cost and hours, then open the course in a new tab.
6. They return, mark the step done, and take a 3 to 5 question check or submit a project link.
7. To keep progress across devices or get the weekly email, they sign in with an email link after confirming they are 18 or older. The saved result attaches to the account.
8. The weekly email brings the next step. After 30 days the site offers a re-test.

If a learner says they are under 18, the test and roadmap still work, but there is no account and nothing is stored on the server.

## Placement test and levels

The GenAI Engineer ladder has nine levels: Beginner 1 to 3 (B1 to B3), Intermediate 1 to 3 (I1 to I3) and Pro 1 to 3 (P1 to P3). Each level is defined by what a learner can do, and the test questions are written from those sentences. The wording and hours below are my draft for you to review; hours are estimates to replace after the soft launch. The total is about 213 hours, roughly 43 weeks at 5 hours a week, which is why most learners start mid-ladder.

| Level | A learner at this level can | Draft hours | Exit check or project |
| --- | --- | --- | --- |
| B1 AI newcomer | Explain in plain words what AI, machine learning and a language model are; use a chat assistant for a real task; spot a wrong or made-up answer | 8 | Write three prompts for a work task and check the answers against a source |
| B2 Python starter | Write and run short Python programs with variables, loops, functions, lists and dictionaries; read and write a file | 25 | A script that cleans a CSV file |
| B3 Data and tools | Use libraries, the terminal and Git; call a web API and read JSON; handle tables with pandas | 20 | A script that calls a public API, saves results and is pushed to GitHub |
| I1 LLM builder | Call an LLM API; manage prompts, tokens and context; get structured JSON output; handle errors and cost | 20 | A small web or command-line app that uses an LLM API |
| I2 RAG builder | Explain embeddings, chunking and vector search; build question answering over their own documents; check whether retrieval found the right text | 30 | A RAG app over 20 or more documents with a 20-question test set |
| I3 Agent builder | Explain tool calling and agent loops; build an agent with tools; name common failure modes | 30 | A multi-step agent that completes a task, with logs |
| P1 Quality engineer | Design test sets and evals; know the limits of LLM judges; defend against basic prompt injection | 25 | An eval harness that shows a measured improvement |
| P2 Production engineer | Deploy, monitor and cache; control latency and cost; handle security and privacy | 30 | A deployed app with monitoring and a cost report |
| P3 AI system designer | Choose between prompting, RAG and fine-tuning; design a system on a whiteboard; explain trade-offs in an interview | 25 | A written design for an AI product, plus ten interview questions answered aloud to a friend |

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| PL-1 | Question bank. Each question has a level, topic tags, four options plus "I don't know", the correct option, an explanation, and reviewed\_by and reviewed\_on | The build fails if any level has fewer than 5 reviewed questions; the launch target is 6 per level, 54 in all |
| PL-2 | Selection. The test is a staircase of 12 questions with no repeats. It starts at B3, picks a random unseen question at the current level, moves up one level on a correct answer and down one on a wrong answer or "I don't know", and stays within B1 to P3 | A simulated all-correct run ends at P3; an all-wrong run ends at B1; no question appears twice |
| PL-3 | Placement. The passed level is the highest level where the learner answered at least 2 questions and got at least two thirds right. The start level is the level after it (P3 stays P3, with a "top of the ladder" message). If no level is passed, the start level is B1 | Unit tests cover at least 8 cases, including ties, a lucky guess at a high level, and all "I don't know" |
| PL-4 | Gaps. Gap tags are the topic tags of wrong or "I don't know" answers at or below the start level. Show up to three, most frequent first, lower levels first on ties. Each gap links to a review stop | Result page shows 0 to 3 gaps; every gap tag maps to a stop |
| PL-5 | Result. Show passed level, start level, gaps, a time estimate at the learner's weekly hours, and the next five steps. No sign-up needed. Save the attempt in the browser; store it on the server only after sign-in | Refreshing the page keeps the result; a signed-out user leaves no row in the attempts table |
| PL-6 | Scoring and placement live in one pure module with no database or UI imports | The module is covered by unit tests and runs in the browser and on the server |
| PL-7 | Status 2026-11-09: not built yet. Item review. A query lists questions answered correctly by more than 90% or less than 10% of takers | Used after the 50-tester soft launch to retune questions and thresholds |
| PL-8 | Status 2026-11-09: partly built: every attempt is kept and "Take the test again" is always offered; the 30-day prompt and level-over-time view are not built. Re-test (release 2). After 30 days offer a new test; keep every attempt and show the level over time | Earlier attempts are never overwritten |

## Roadmap engine and resources

The structure is goal, then levels, then stops, then resources. A stop is one learnable outcome that takes 1 to 6 hours and ends in a check or a project. Release 1 needs at least 5 stops per level (45 in all) and about 150 resources, roughly 3 per stop.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| RM-1 | Status 2026-11-10: once sign-ups open, signed-out visitors see a preview only (RG-1). Roadmap page. Show the nine levels as a path, mark the learner's start level, and tick completed stops. It works signed out from the saved result | Renders from content files with no database call when signed out |
| RM-2 | Stop page. Show the outcome in one sentence, why it matters (60 words or fewer), estimated hours, one primary resource, up to two alternates, and a check or project | Content validation fails if a stop has no primary resource or no check |
| RM-3 | Next-five-steps card. List the next five incomplete stops from the start level, with up to two review stops for the learner's gaps first. Show it on the result page, the dashboard and the weekly email | A pure function with tests: start level, gap tags and completed stops in, an ordered list of five out |
| RM-4 | Resource card. Show provider, title, cost label, hours, language, certificate yes or no, level, last-verified date, link-check date, "why we picked it", and an affiliate label when it applies | Every field renders; a missing last-verified date fails validation |
| RM-5 | Outbound route /go/\[resource-id\]. Log the click (resource, stop, level, no personal data), then redirect. Add an affiliate tag only when the resource is marked affiliate, and always show the label on the card | Works with JavaScript off; the log holds no email or IP address |
| RM-6 | Cost labels: "Free"; "Free to learn, paid certificate"; or a price in rupees with "price checked on \[date\]". If the price date is over 60 days old, show "price may have changed" | A price is never shown without its check date |
| RM-7 | Completion. A stop is done when the learner passes its check (70% or more), submits a project link, or marks it done with one tap (recorded as self-marked). Release 1 trusts self-reports | Three states: not started, in progress, done. Self-marked stops are counted separately from checked ones and do not earn level badges |
| RM-8 | "I already know this". The learner can skip a stop. It counts as done, is flagged as self-skipped, and the re-test can contradict it | Skipped stops are counted separately in analytics |
| RM-9 | Preference toggle "Free only". When on, paid resources move below free alternates and are not the primary | The toggle persists for signed-in learners |
| RM-10 | Library and tags. Lessons, video lessons and skills (glossary terms) sit in one list at /library, tagged by topic, level, skill and channel, and filtered by kind, topic, level, channel and a search box. Tags on every lesson open the Library filtered to that tag. Filters live in the address so a tag link opens the right view | Filters work at 360 px; a lesson's topic tag opens /library?topic=… with only that topic |
| RM-11 | Video lessons. Each lesson may list up to three YouTube video lessons, shown first in its Watch & learn panel and playable on the page (RM-4 player). /videos features recommended teaching channels with their best videos. Videos are not repeated at the bottom of the lesson; the full RM-4 card remains for the best course | Every listed video exists and allows embedding when added; nothing loads from YouTube before play |
| RM-12 | Topic tracks for interview foundations: Data structures and algorithms, and System design, each a set of deep lessons under /topics, linked from the coding roles' roadmaps (AI Engineer, GenAI & LLM Engineer, FDE, Agentic AI Engineer, ML Engineer, MLOps Engineer). They are not roles | Both tracks render under /topics; the six coding roadmaps link to them |
| RM-13 | Roadmap topic panel (2026-11-04). Tapping a topic on any roadmap opens a side panel with the topic's title, its Learning, Done and Skip buttons, "What it is" (the lesson's one-line plain answer, SE-4), its key terms, a "Read the full chapter" button to the lesson, and the best course. It does not show the lesson's outcome or "why it matters", which stay on the lesson page. Amended 2026-11-06: the panel shows no videos (they stay on the lesson page), and its resources sit in a "Free resources" dropdown, with paid courses in a separate "Paid courses" dropdown, both closed until tapped; the best pick is marked | e2e: the panel shows "What it is" and "Read the full chapter", and no "Why it matters" |
| RM-14 | Lesson diagrams (2026-11-06, owner request: replace the black text diagrams with minimal infographics). A diagram is a ```flow block of short lines ("step -> step", "-[label]->", "Name \| note", "?" for a decision, optional title and dir) drawn on the server as SVG: white boxes, thin lines, arrows, violet decisions, in light and dark mode, with the steps also written out for screen readers. Phones get the narrower layout and keep text at 80% size or more, scrolling sideways if needed. Comparisons are Markdown tables. Program output, logs and code stay in light text boxes; no black boxes remain. content:validate fails on a diagram that does not parse, and a deep lesson needs at least one diagram | Unit tests for the parser and layout (no overlaps); e2e: a lesson draws its diagram as SVG with a text description, and has no dark text box |
| RM-15 | "On this page" on the left (2026-11-06, clarified by the owner on 7 Nov). On screens 1024 px and wider, the lesson's own sections (Why it matters, What it is, How it works, A worked example, Common mistakes, Practice, then the exercise, flashcards, course, check and tutor) sit in a sticky left column, so a learner jumps to a section in one tap; the current one is highlighted and read ones are ticked. The lesson sits to its right; on 1280 px and wider the videos and the path's lesson list stay in a right column. Phones keep the reading bar and the lesson list at the end. Roadmaps show no month estimates anywhere: learners go at their own pace. Video cards have no "Open on YouTube" link, because the player has its own YouTube button | e2e: the path's lesson list marks the current lesson on a phone; no "Open on YouTube" text on a lesson |
| CS-1 | Status 2026-11-09: paused by CS-3; pages removed until the owner decides on a redesign. Cheatsheets (2026-11-06, owner request). /cheatsheets lists one-page sheets per topic (RAG, prompt engineering, LLM basics, evals, agents, LLM system design interview, Python for AI, SQL, Git, ML metrics, Docker and Kubernetes, Big O and DSA patterns), linked from Practice. Each is a file in content/cheatsheets: sections of term, detail and optional code, the lessons it sums up, and a reviewer and date; a draft note shows until a person reviews it | content:validate checks every sheet and its lesson links; the sitemap lists every sheet |
| CS-2 | Status 2026-11-09: paused by CS-3. A sheet is interactive: sections rise into view in turn (none under reduced motion), "Quiz me" hides every answer until the card is tapped, a filter narrows the items, code has a Copy button, and "Download PDF" makes a two-column PDF in the browser | e2e: quiz hides and reveals an answer; the PDF downloads |
| CS-3 | Cheatsheets paused (2026-11-08, owner request: "remove cheatsheets for now, we'll do this later"). The /cheatsheets pages, their links (Practice page, Practice menu, Interview hub), sitemap entries and PDF code are removed; /cheatsheets and /cheatsheets/<id> redirect temporarily to /practice. The 12 sheets stay in content/cheatsheets and still pass content:validate, so bringing them back is a page-and-link job. The infographic layout from BR-4 is in git history (PR #42). CS-1 and CS-2 are paused with it | Sitemap and nav tests; the redirect is checked by hand |
| SO-1 | Testimonials (2026-11-07, owner request). The home page shows what early users said, in their own words, from content/testimonials/testimonials.yaml, shared with their permission. Never invented; the section hides when the file is empty | e2e: the home page shows the section with names and roles |
| IP-1 | Interview patterns (2026-11-07, owner request: "the AlgoMaster for AI roles"). /interview/patterns lists named patterns in five groups (retrieval, agents, evals, serving, safety). Each has when to use it, a diagram of how it works, trade-offs, pitfalls interviewers probe, a "say it in the interview" paragraph, and links to its interview questions, lessons and the designs that use it. Content in content/interview/patterns; a draft note shows until reviewed | content:validate checks every link and diagram |
| IP-2 | Worked LLM system design answers. /interview/design lists them; each answer follows the 35-minute shape (clarify, requirements and numbers, high-level diagram, deep dives, failures, evals, trade-offs and follow-ups), with a step list on the left on big screens, the patterns it uses, related questions and lessons. Content in content/interview/designs | content:validate checks every link and diagram; e2e opens a design and a pattern |
| IP-3 | Interview menu and hub. The main menu has an Interview group (patterns, system design answers, mock interview, Q&A by role, question bank); /interview starts with cards for every way to prepare, then the question bank | Unit test: interview pages mark the Interview group current |
| FOCUS-1 | Product focus (2026-11-08, owner decision): Xplaind is a one-stop platform for AI education. System design stays at the basics. The 6 system design basics lessons, the 28 interview patterns and the 10 worked system design answers stay as they are, and no more system design content or features are built (for example, no system design mock interview). New work goes to AI learning itself: lessons, practice, videos and tools | Applies to all later planning |
| FOCUS-2 | Narrower product (2026-11-12, owner decision from a focus review). Removed: the AI roadmap generator (/ai/roadmap redirects to /paths; the hand-built roadmaps are the product, and the AI kind `roadmap` is gone), X Bot (the floating helper, its instant answers, its API and the AI kind `bot`; the AI tutor on /ai/tutor now also knows the site's pages and points learners to them), and the Rust track (7 lessons, the Rust blog post, Rust-only glossary terms and resources; old URLs redirect to /topics and /blog). Merged: the weekly plan and the 90-day emails are one page, "Stay on track" at /plan: this week's plan, a calendar reminder without an account, and the Monday email opt-in (CM-90) for signed-in learners; the dashboard links there | e2e: old generator, Rust lesson, Rust topic and Rust post URLs redirect; /plan shows Stay on track; unit tests: the tutor gets the site guide only outside lessons and every guide page exists |
| SWE-1 | (Was SE-1, which also names search indexing; renamed 2026-11-09.) Software engineering and Git track (2026-11-07, owner request). A "Software engineering" topic holds the Git lessons (terminal and Git, branches with merging and rebasing, undoing with restore, reset, revert and reflog, Git on a team) and the engineering fundamentals (writing tests with pytest, debugging systematically, clean code and refactoring, code review, design principles with SOLID and dependency injection). Coding roadmaps show it beside the DSA and system design tracks | content:validate passes for every lesson; e2e: the topic page lists the lessons |
| LQ-1 | Book-informed lessons (2026-11-07, owner request: use a reference AI engineering book to raise the depth and value of lessons, written in our own words). Pilot of three deep lessons on topics we had no lesson on: how a model picks its next word (temperature, top-p, top-k), how fine-tuning works (data, training, risks), and LoRA, QLoRA and the GPU memory maths. Each adds the parts that carry most value: when not to use it, from demo to production, a worked calculation and runnable code. The book is cited as further reading, never copied. Length follows value, not a target: lessons stay near 1,500 to 3,000 words | content:validate; e2e renders each lesson |
| LQ-2 | Book-informed lessons, batch 2 (2026-11-08, owner request: continue LQ-1 in small reviewed batches). Three deep lessons on gaps no lesson covered: how a chat model is made (pre-training, supervised fine-tuning, preference tuning with RLHF and DPO), choosing a model (hard requirements, public benchmarks and leaderboards and their limits, contamination, deciding with your own test set), and synthetic data and distillation (why and how to generate, how to verify, limits such as model collapse, distilling a task into a small model). Each comes with three check questions, glossary terms, resources and two matching interview questions. The book is cited as further reading, never copied | content:validate; e2e renders each lesson |
| LQ-3 | Book-informed lessons, batch 3 (2026-11-08, owner request to continue LQ-2). Three deep lessons on gaps no lesson covered: reasoning models and test-time compute (chain of thought, best-of-N with verifiers or votes, reasoning models, routing hard cases), inside LLM inference (prefill and decode, time to first token and per token, KV cache sizing, batching, speculative decoding, prompt caching, batch APIs) and building a training dataset (formats, the six signs of quality, labelling guide and pilot, coverage, starting with 50 to 100 examples, learning curves). Each has three check questions, glossary terms, verified videos and articles, a matching DeepLearning.AI video course and two interview questions. The book is cited as further reading, never copied | content:validate; e2e renders each lesson |
| LQ-4 | Book-informed lessons, batch 4 (2026-11-08, owner request to continue). Three deep lessons: scoring open-ended answers (functional checks, exact match, word overlap such as BLEU and ROUGE and its limits, meaning similarity with embeddings, side-by-side comparison and its limits), growing an AI app in layers (context, guardrails, router and gateway, caches, agent patterns, monitoring from day one; linked from Design an AI system) and catching hallucinations (why models make things up, where they cluster, prevention, judge, claim-by-claim, entailment and resampling checks). Each has three check questions, glossary terms, verified videos and articles, a matching DeepLearning.AI video course and two interview questions. The book is cited as further reading, never copied | content:validate; e2e renders each lesson |
| LQ-5 | Book-informed lessons, batch 5 (2026-11-08, owner request to continue). Three deep lessons: AI in Indian languages (why most Indian languages are low-resource, token fertility and its cost, code-mixing, general model versus translate-and-back versus Indian-language models, AI4Bharat and Bhashini), model size and scaling laws (parameters and memory, mixture of experts, training tokens and compute, Chinchilla and training beyond it, diminishing returns) and perplexity and cross-entropy (what they mean, bits and nats, bits per byte for fair comparison across tokenizers, uses and limits). Each has three check questions, glossary terms, verified videos and articles and two interview questions. The book is cited as further reading, never copied | content:validate; e2e renders each lesson |
| LQ-6 | Book-informed lessons, batch 6 (2026-11-08, owner request to continue). Three deep lessons completing the book's main topics: fine-tuning in practice (base model, method and tool, progression and distillation paths, learning rate, batch size and gradient accumulation, epochs, prompt loss weight, reading loss curves, smoke tests), model merging (merging versus ensembles, task vectors, averaging, SLERP, TIES and DARE, layer stacking, testing merges) and running models on many GPUs (replicas, tensor, pipeline, context and sequence parallelism, sizing a serving layout). Each has three check questions, glossary terms, verified videos and articles and two interview questions. The book is cited as further reading, never copied | content:validate; e2e renders each lesson |
| LQ-7 | Deepen older lessons (2026-11-08, owner request to continue after LQ-6). Bring the most-used roadmap lessons up to the depth of the book-informed ones, three at a time: runnable code, a when-not-to section, a from-demo-to-production section, the book's relevant ideas and a further-reading reference, keeping the existing worked example. First batch: evals and test sets (step-level evals, several test sets, how many cases detect a difference, bootstrapping, Simpson's paradox), cost control (cost arithmetic with a calculator, token cost of Indian languages, routing) and prompt injection (defences at model, prompt and system level, other attacks, violation and false refusal rates, automated red-teaming tools). Second batch: structured output (five layers from prompting to fine-tuning, constrained decoding, truncation, a forced-tool extraction pipeline with business checks), first LLM API call (streaming, errors and retries, a multi-turn chat program with token checks) and deploy and monitor (TTFT and TPOT, percentiles, metrics, logs and traces, behaviour signals, three kinds of drift, a logging wrapper and daily report, privacy in logs). Third batch: security and privacy (input and output guardrails, mask-call-unmask for Indian identifiers, retrieval permission filters, the OWASP 2025 list with one defence each, the DPDP Act in brief), the agent loop (compounding errors, planning styles, reflection, a runnable loop with limits and error handling, agent failure modes and how to measure them) and tool calling (read, compute and write tools, tool_choice, a full round trip with validation, ownership checks and confirmation, choosing the tool set, MCP, testing tool use). Then, at the owner's request (2026-11-08, "update the entire thing in a single shot"), every remaining lesson in the agents, automation, voice, evals, governance, LLM, retrieval, data, ops and security themes in one pass (74 lessons), each with runnable code, a when-not-to section and a from-demo-to-production section. The 11 classic ML lessons followed in a second pass at the owner's request. A deepened lesson returns to UNREVIEWED until the owner reviews it again | content:validate; e2e renders each lesson with code |
| VD-1 | Videos by topic (2026-11-07, owner request: "instead of having the videos by the YT channel, we should categorise with topics ... filters ... add how much views the video has"). /videos is one list of every video lesson (not grouped by channel). Filters: topic chips with counts (a video can have more than one topic), level (beginner, intermediate, professional), length (under 10, 10 to 30, over 30 minutes) and a search over title, teacher and lesson. Sort: most viewed (the default), shortest, longest, easiest first. Each card shows the picture, teacher, topic, public view count, length, level and the lesson it belongs to, and plays on the page (RM-4). View counts are the public YouTube numbers, stored in content/video-views.yaml by `npm run videos:views` with the date they were read, and the page states that date. Sorting reads only views and length, never a paid or partner field (ED-2) | Unit tests for filter, sort and number formats; e2e for topic, level, length, search, sort, play, 360 px and accessibility |
| VD-2 | Video courses (2026-11-08, owner request: "add the courses from deeplearning.ai/courses and all of Andrew Ng's courses and lessons ... with the relevant topics"). A resource tagged video-course is a whole course taught on video, with instructors, topics and publish date. It covers every course and specialization on deeplearning.ai (134 on 2026-11-08), Andrew Ng's Stanford CS229 and CS230 lectures, the Deep Learning Specialization lectures on YouTube, and his full-course videos. His talks are video lessons on the matching lessons. /videos has two tabs, Videos and Video courses (#courses opens the second). The courses tab filters by topic, level, length (under 2, 2 to 10, over 10 hours), a "Taught by Andrew Ng" chip and search over title, provider, teacher and lesson, and sorts by newest, length or level, never by a paid or partner field (ED-2). Each card shows provider, teacher, length, level and cost label (RM-6). YouTube series play on the page; a YouTube video whose owner turned off embedding (embeddable: false) and deeplearning.ai courses open on the provider's site through /go. A lesson lists up to three matching video courses in more; the Watch & learn panel shows them after its videos. Amended 2026-11-11 (owner request): video courses from other platforms (Anthropic Academy, Google, Microsoft, Harvard CS50, fast.ai, NVIDIA) are tagged too, the tab has a "From" filter by platform, and the button reads "Start the course" | Unit tests for the filter, sort, labels and embedding switch; content:validate requires topics and instructors on every video course; e2e: the courses tab filters to Andrew Ng and a lesson panel shows a video course |
| PAY-1 | Pro passes and AI limits (2026-11-08, owner decision on a pricing plan; the owner chose Cashfree and accepted these recommendations). All content stays free: roadmaps, lessons, videos, video courses, practice cards, interview questions and answers, project guides and the code playground, with no daily limit and no lock. Pro only raises the daily AI allowance. Three one-time passes, no auto-renewal: 30 days ₹249, 6 months ₹999 (recommended), 12 months ₹1,499 (prices changed on 2026-11-13, PAY-8); a pass bought while one runs starts when it ends. Daily limits per feature for guests, free accounts and Pro are in src/lib/billing/plans.ts and on /pricing (for example the AI tutor 5, 10 and 50). Until PAYMENTS_MODE is set, everyone keeps the old single set of limits, so turning Pro on is the only switch. The AI tutor and X Bot run on the fast model (AI_FAST_MODEL, default Haiku 5.5); grading, reviews, the roadmap generator and the book helper keep AI_MODEL. Pro calls are bounded by Pro limits, not the site's monthly cap (CO-1); the kill switch still stops all AI | Unit tests: limits by tier, unchanged limits while Pro is closed, fast-model routing, the free limit and upgrade response once open |
| PAY-2 | Payment records. public.payments (order, plan, amount in paise, environment, status, Cashfree payment reference; no card, UPI or phone data) and public.entitlements (plan and valid_until, one row per learner). Learners read their own rows; only the server writes. A server-only grant_pass function marks an order paid and grants or extends the pass exactly once. On account deletion the pass goes and the payment row stays with the user id cleared, for tax records. Both are in the data export | RLS tests: own rows only, visitors see nothing, no learner writes or grants, one grant per order, extension from the end date, kept on deletion |
| PAY-3 | Cashfree checkout (sandbox first). /api/billing/order needs a signed-in 18+ learner, a 10-digit mobile number (sent to Cashfree, not stored) and consent to the terms and refund policy, then creates the Cashfree order. Cashfree's checkout script loads only after the learner presses Pay. The return page and the webhook both confirm the order with Cashfree's API (PAID, INR, the plan's exact amount) before granting; the webhook also checks Cashfree's HMAC signature and timestamp | Unit tests: signature accepted only for the exact body, secret and a recent timestamp |
| PAY-4 | Upgrade prompt and usage counter. When an AI helper reaches a free or guest learner's daily limit and Pro is open, the reply offers /pricing and one site-wide prompt opens (closable, never on content pages otherwise). AI pages show "N of M free … left today" with a link to Pro. No prompts or counters while Pro is closed | e2e: pricing page; unit test: the upgrade response |
| PAY-5 | /pricing: free plan and the three passes, the daily allowance table by account type, FAQ, and a test-mode banner in sandbox. The menu (AI tools) and footer always link to it (BIZ-1, 2026-11-13; until then only when Pro was open); the home page FAQ mentions passes only then | e2e: /pricing renders, fits 360 px and passes axe |
| PAY-6 | Billing and policies. /settings/billing shows the plan, its end date and every payment with a printable receipt ("not a tax invoice" until GST is decided). /refunds: full refund within 7 days of buying, extra or failed charges always refunded, nothing to cancel. Terms and privacy describe passes, Cashfree and the 8-year payment record | e2e: /refunds renders and passes axe |
| PAY-7 | Free accounts get a one-time trial of each AI helper (2026-11-13, owner decision: "give maximum 2-3 tries in basic and after that prompt for Pro"). Once Pro is open, a free account can use each AI helper this many times in total, ever: AI tutor 3, interview answer feedback 3, mock interview report 2, resume review 2, tests or flashcards from notes 2, questions about notes 3 (TIER_LIMITS.free). Today's allowance is the trial minus every use on earlier days, enforced by the same locked daily guard, so the lifetime total never passes the trial. When it is used up, the reply says so and offers /pricing (the site-wide upgrade prompt opens). The usage counter shows "N of M free tries left" and "Unlock with Pro". Pro keeps its daily limits; visitors without an account (only while sign-ups are on hold) get at most the free trial per day. Before Pro opens, nothing changes | Unit tests: trial sizes, trial left across days, the guard gets the remaining trial and the reply offers Pro; e2e: the pricing table shows "N tries" for a free account |
| PAY-8 | A pricing page that sells on value (2026-11-13, owner request). Prices: 30 days ₹249, 6 months ₹999 (recommended), 12 months ₹1,499, so a longer pass always costs less per month. Savings are shown only against the real monthly price (6 × ₹249 = ₹1,494 struck through, "Save 33%"; 12 × ₹249 = ₹2,988, "Save 50%"), never against an invented "was" price (Consumer Protection Act 2019, CCPA dark-patterns guidelines 2023). Each pass shows its price per day. Order: a plain hero with the promise and four reassurances (one payment, 7-day refund, payment methods, GST included), the three passes (the recommended one first on a phone, in the middle on a wide screen; "Recommended", not "Most popular", since there are no sales figures yet), what Pro does as four outcomes with their daily numbers, a free-vs-Pro table, a 7-day refund band, the questions as folded accordions, and "What you can buy" (BIZ-1) last. No 3D header on this page | Unit tests: prices, savings and per-day figures; e2e: prices, savings, per-day price, the table, a folded question that opens, BIZ-1 text, 360 px fit and axe |
| PAY-9 | Promo codes (2026-11-13, owner request). A code takes a percentage off a pass; the owner's four codes give 100%, 50%, 25% and 10% off and work only on the 30-day pass. Each account can use each code once; there is no overall cap and no expiry unless one is set. Codes live only in the database table promo_codes (the repository is public, so codes are never in it); the owner adds, switches off or expires them in the Supabase SQL editor. The learner types the code in the pay window (Razorpay only), sees the price after the discount, and pays it; the server checks the code again and prices the order itself, never trusting the browser. Confirming a payment checks the amount against the plan price after the order's own discount. A 100% code starts the pass at once with no payment (an order of ₹0). A code is used up only when its order is paid or granted, in the same step as the pass (promo_redemptions), so an abandoned checkout does not use it, and two free orders racing with one code cannot both succeed. Codes are checked at 10 tries per 10 minutes per account. Refunds are at the price paid | Unit tests: code format, discounted prices, the code checks, the discount-aware amount check; database tests: codes unreadable by learners, a free order granting once, a second free use refused, abandoned orders not using a code, own redemptions only, removal with the account |
| PAY-10 | AI tools are part of Pro (2026-11-13, owner decision). Whatever costs us to run, the AI tools, is for Pro passes. Visitors without an account get no AI (AG-1). A free account keeps the one-time trial of each AI tool (PAY-7) so learners can try it before buying. All copy says so: the AI sign-in card, the sign-in message, the home FAQ, the AI tutor's site guide | Unit test: a visitor without an account is refused with the Pro message |
| PAY-11 | A 7-day pass (2026-11-14, owner decision): ₹99 for everything in Pro for 7 days, one payment. It sits under the three passes on /pricing as "Interview this week?", so the longer passes still read as the better deal per day (₹14 a day against ₹8.3 and less). grant_pass counts days for it, calendar months for the rest | Unit test: ₹99, 7 days, dearer per day than 30 days; database test: a week pass lasts 7 days |
| RF-1 | Referrals (2026-11-14, owner decision). Every account has a share link (/r/<code>) in Settings, Billing, with Copy and WhatsApp share. Opening a link remembers the code for 30 days in a first-party cookie. A friend's first pass is 10% off (shown in the pay window; a promo code replaces it, never both). When the friend pays, the learner who shared gets 7 more days of Pro, added in grant_pass in the same transaction; once per friend, never for your own code, never for a friend who has paid before. The learner sees how many friends bought and the days earned | Unit tests: code rules, who gets the discount; database tests: reward once, own rows only, nobody else writes |
| AN-1 | Funnel counts (2026-11-14, owner request). One number per event per day in funnel_daily: sign-up, first lesson finished, AI trial turn used, pricing page seen, checkout started, purchase, invite-link visit. No user id, device id or network address; the browser may report only first lessons and pricing views, the rest are counted on the server. The owner reads them in the Supabase SQL editor (`select * from funnel_daily order by day desc`). The privacy page says so | Unit test: the browser event allowlist; database tests: unknown events refused, nobody reads or writes the table but the server |
| IR-1 | Interview readiness score (2026-11-14, owner decision). Each AI-reviewed mock interview for a role stores one score out of 100 (the average answer score) in interview_readiness. Readiness for a role is the average of the last three, with the change since the three before, and a plain label (Just starting, Getting there, Nearly there, Interview-ready). It shows in the interview report right after the review and on the dashboard for every role practised | Unit tests: session score, readiness and change, labels; database tests: own rows only, server writes, range, deleted with the account |
| IR-2 | Ask at the moment of value (2026-11-14, owner decision). After an AI interview review without Pro, the learner keeps the summary, strengths, gaps, next steps, readiness and each answer's score and verdict; what they got right, the mistakes, the missing points and a stronger answer for each answer are Pro, and the server does not send them. A link to Pro sits where they would be | Unit test: the free view keeps scores and verdicts and drops the detail |
| PR-1 | AI project review (2026-11-14, owner decision). Every guided project page (behind the free sign-up gate) has "Get your project reviewed": an optional public GitHub link and a write-up of what the learner built. For a github.com link the server reads the README from raw.githubusercontent.com only (no other host), with an 8-second limit. The AI scores the project against that project's rubric, criterion by criterion (Strong, Partly there, Not yet, with evidence and a fix), with a score out of 100 and next steps. It passes with 70 or more and no criterion Not yet, decided in code. Uses the answer-review allowance. Only the score, pass and link are kept (project_reviews), for the certificate (CT-1); the write-up and README are not stored | Unit tests: link parsing, review cleaning and the pass rule; database tests: own rows only, server writes, https links only |
| JM-1 | Resume-to-job match (2026-11-14, owner decision). The resume review (RV-1) also returns, when a job post is pasted, a match score out of 100 with fixes aimed at that post, and always a LinkedIn headline and About section written only from what the resume shows, each with a Copy button | Unit test: match only with a job post; trimmed LinkedIn copy |
| PF-1 | Public learner profile (2026-11-14, owner decision: free, opt-in). In Settings a learner (18+) can choose a handle (3 to 30 letters, digits or hyphens), a display name and a headline, and switch the profile on; it is off by default. When on, xplaind.in/u/<handle> shows the name, headline, progress on each role started, interview readiness, passed project reviews and certificates, and nothing else (no email, no activity dates). The page is noindex. Turning it off hides it at once | Database tests: off by default, own rows only, server writes, unique handle, goes with the account |
| CT-1 | Verified certificate (2026-11-14, owner decision: Pro). A Pro learner can claim one certificate per role once every lesson on its roadmap is done, at least 80% of them by passing the quick check or a project (not just marked done), and one of the role's guided projects passed the AI review (PR-1); decided in code. The certificate page xplaind.in/certificate/<id> is public and noindex, shows the name chosen at claim, the role, the date and a verify link, offers Add to LinkedIn, and says plainly it is issued by Xplaind, not a university or government-accredited qualification | Unit tests: eligibility rules, id, handle, LinkedIn link; database tests: one per role, own rows only, server writes |
| CG-1 | Learning content is free with a free account, with an open preview (2026-11-13, owner decision). Anyone, including search engines and under-18s, sees: the quick answer and "Why it matters" of every lesson, the first 6 video lessons, video courses and courses, every project's brief and deliverable, the roadmap preview (RG-1), the level test, the blog and the glossary. A free account opens the rest: the full lesson (parts, videos, best course, practice, check, tutor), every video and course, and every project step, rubric and stretch goal. Signed out, or while the session loads, a "Sign up free" card with Sign up and Sign in takes the place of the rest. While accounts are off, nothing is hidden. The site no longer says "no sign-up" where an account is needed | Manual check with accounts on: the four gates show for a signed-out visitor; e2e with accounts off: content unchanged |
| BIZ-1 | Business details for the payment gateway (2026-11-13, owner request for Cashfree onboarding). Xplaind is a brand of ZEREH Venture, GSTIN 33GDZPS4274J1ZK; contact hello@xplaind.in and +91 8608761359, kept in src/lib/business.ts. /contact shows the email, phone, reply hours and the business; the footer says "Xplaind is a brand of ZEREH Venture" with the GSTIN, email and phone, and links Privacy, Terms, Refunds and cancellations, Pricing and Contact. Privacy and terms open with "Who we are"; refunds add a Delivery section (a digital pass, active on payment, nothing shipped). /pricing always shows the passes and their prices, says what is sold, by whom, that prices are in rupees and include GST, and, while payments are off, that online payment opens shortly (no buy buttons). Receipts name the business and GSTIN and still say "not a tax invoice". No registered address is shown, by the owner's choice | e2e: /contact renders with mailto and tel links, fits 360 px and passes axe; the footer line and policy links; pricing shows what is sold and the GST note |
| RZ-1 | Razorpay Standard Checkout (2026-11-13, owner request), beside Cashfree. PAYMENTS_PROVIDER picks the gateway (razorpay or cashfree); unset, Razorpay is used when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set. Only one gateway is ever live. The key's rzp_test_ or rzp_live_ prefix must match PAYMENTS_MODE (sandbox or production) or payments stay off. POST /api/billing/create-order: a signed-in 18+ learner, a plan id and consent; the amount comes from the plan on the server (at least 100 paise); our order row is stored and the Razorpay order is created with our order id as its receipt; a Razorpay 401 (wrong keys) or other error answers 500 and marks the row failed. The browser loads checkout.js only on Pay and opens the Standard Checkout window (prefilled email; Razorpay asks for the phone); closing it or a failed payment shows a message. POST /api/billing/verify-payment: all three ids are required (400 if missing); the HMAC-SHA256 of "order_id|payment_id" with the key secret must match (400 if not, nothing is paid); then Razorpay is asked for the order and payment (receipt, amount, currency, same order, captured; an authorised payment is captured) before grant_pass runs. POST /api/billing/razorpay-webhook (payment.captured, order.paid) does the same when RAZORPAY_WEBHOOK_SECRET is set. No new tables: payments.cf_payment_id holds the Razorpay payment id. Policies, receipts and the pricing FAQ name the live gateway. The key secret never reaches the browser; the key id is returned by create-order | Unit tests: settings and prefix rules, checkout and webhook signatures, order creation, confirmation (amount, other order, environment, capture, failed, already paid); e2e: the APIs stay shut while payments are off; checked by hand: the test-mode checkout window opens from /pricing |
| CM-90 | Commit to 90 days (2026-11-06, owner choice: weekly, opt-in, 13 weeks, one-click unsubscribe). A signed-in learner opts in on /plan ("Stay on track", FOCUS-2; it was on the dashboard until 2026-11-12) by choosing a path and ticking a consent box (off by default). Every Monday at 08:30 India time, a Vercel Cron job sends one email through Resend: the week (of 13), lessons finished that week and in total, and the next three lessons on the path. Each email has a one-click unsubscribe link and List-Unsubscribe headers. Stored in public.commitments (readable by its owner without the email or token; written only by the server), included in the data export and deleted with the account. Needs RESEND_API_KEY and CRON_SECRET in Vercel and the 20261107000000_commitments migration | RLS tests; unit tests for weeks due, at most 13 emails, none after unsubscribing, and the email text |

**Seed resources and what is verified.** Verify each one again on the provider's page before it goes live, and record the date.

| Resource | Likely level | Cost | Verification status |
| --- | --- | --- | --- |
| Oracle University AI courses at Foundations level, including Agentic AI Foundations | B1 to I3 | Free at Foundations level; Professional level is paid | Seen on Oracle's page during research |
| DeepLearning.AI crewAI course, about 3 hours | I3 | Free for a limited time in beta; the graded accomplishment needs PRO | Seen on the provider's page during research |
| Claude Academy, 26 free courses, including Claude Code | B1, I1, I3 | Free | Third-party report only; you named the Anthropic Claude Code course |
| OpenAI Academy, 3 free courses | B1 | Free with a ChatGPT account; certificate and badge | Third-party report only |
| NVIDIA Deep Learning Institute | I1 to P2 | 11 of 52 courses free as of Oct 17, 2026; exams 125 to 500 US dollars | Third-party report only |
| Beginner Python on YouTube, 6 to 12 hours, from Mosh Hamedani and Data Engineering Tamil | B2 | Free | You named them; I have not checked them |
| Low-cost Udemy courses, about ₹400 on sale | Any | Paid, price changes often | No course chosen yet |

A Meta Llama certificate exists on Coursera, but it sits under a paid Coursera Plus plan, so it probably fails the low-cost rule.

## Guided projects

Added at the owner's request (2026-10-26). Each stage's closing project becomes a guided project: the proof a learner shows an employer, with enough structure that a beginner can finish it alone.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| GP-1 | Content. A guided project is a file in content/projects with a summary, difficulty, hours, the lessons it uses, what you will need, 4 to 8 steps (each with what to do, an optional hint and "done when"), a rubric of 4 to 6 criteria (what strong and weak look like), deliverables and stretch goals. It is flagged as drafted with AI and needs a person's sign-off before launch (ED-9) | Content validation fails on a missing lesson, a wrong step or rubric count, or a raw web address in the steps |
| GP-2 | Project page /projects/\[id\]. Show the brief, the lessons it uses as links, the steps as a checklist with hints, the rubric as a self-check, the deliverables, and a place to submit the project link | Works signed out; ticks and the link are kept on the device; WCAG 2.1 AA |
| GP-3 | Projects index /projects. List every guided project with its path, difficulty and hours, filterable by path and difficulty | Renders from content files with no database call |
| GP-4 | Each path stage that has a project links its guide, and the roadmap's Projects tab opens it. Project progress stays on the device until a user table for it is added to the data model | Validation fails if a stage links a guide that does not exist, or a guide is not linked from any stage |

## X Bot and motion

Added at the owner's request (2026-10-26): a friendly helper on every page, and smooth, light motion across the site.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| XB-1 | Status 2026-11-12: removed by FOCUS-2 (X Bot merged into the AI tutor). X Bot, a small animated mascot, floats in the bottom corner of every page except the mock interview (the voice simulator flow, step 3: nobody coaches during the interview). It opens a chat panel that works with the keyboard and a screen reader and closes with Escape | Opens and closes at 360 px without horizontal scroll; WCAG 2.1 AA with the panel open; focus returns to the launcher |
| XB-2 | Status 2026-11-12: removed by FOCUS-2 (X Bot merged into the AI tutor). Instant answers for everyone, with no account and no model call: X Bot matches the question against the glossary, lessons, interview questions, guided projects, roadmaps and short how-to notes on using the site, shows the best answer and links to read next, and says so when it finds nothing. It never ranks courses (ED-2) | Pure, unit-tested matcher; the index is prerendered from the content files; nothing is stored, on the device or the server |
| XB-3 | Status 2026-11-12: removed by FOCUS-2 (X Bot merged into the AI tutor). Status 2026-11-09: superseded by SU-5 and PAY-1: guests get AI answers too, with daily limits per tier in src/lib/billing/plans.ts. AI answers for signed-in learners aged 18 or over when AI is on, under the AI guards (CO-1, SC-5): 30 a day, the current page sent as context, the learner's words wrapped as data, lesson links checked against the catalog. Under-18s and signed-out visitors keep XB-2 only (PV-2) | Prompt test; the route uses the shared caps and kill switch |
| MO-1 | A route change plays a short rise-in of the new page | Never fades text, so contrast holds at every frame |
| MO-2 | Cards rise and tip into place as they scroll into view, page pictures tip back as they scroll away, and long reads show a reading-progress bar | Scroll-driven CSS only where the browser supports it; position and angle only, never opacity; no horizontal scroll at 360 px |
| MO-3 | Cards and page pictures tilt a few degrees toward the pointer | Mouse and trackpad only, not touch |
| MO-4 | Every animation stops under prefers-reduced-motion: reduce | Checked in the stylesheet: each effect sits behind a no-preference query |
| MO-5 | Status 2026-11-09: the pastel palette was replaced by the minimal look (BR-3); the WebGL rules here still apply to the road and particle headers. Pastel brand and 3D. A soft pastel palette (lilac, peach, mint, sky) on every page; page headers, lesson headers and the home hero show a live WebGL scene (three.js) in the page's pastels: since 2026-11-02 a liquid, iridescent orb ringed by orbiting light that leans toward the pointer and stirs on scroll. Scenes load only when on screen, pause off screen and in hidden tabs, draw one still frame under reduced motion, skip data-saver connections, and fall back to the drawn cover without WebGL. Card grids arrive in a staggered 3D scroll entrance (transforms only) | No horizontal scroll at 360 px; WCAG 2.1 AA unchanged; canvases are aria-hidden |
| MO-6 | Home page road flight. The home page draws a glowing 3D road (three.js) winding into the distance behind the content; scrolling flies the camera along it past four milestone gates (Choose your role, Learn, Practice and prove it, Your AI career), and each section opens with its milestone marker. GSAP drives the hero intro, word-by-word heading reveals and card entrances; Lenis is the only smooth-scroll engine and feeds ScrollTrigger. Under reduced motion there is no smooth scroll, no entrance animation and one still frame of the road; without WebGL the sky gradient stays and every word is readable | No horizontal scroll at 360 px; WCAG 2.1 AA; headings keep their full accessible name; the canvas is aria-hidden; scene pauses in hidden tabs and disposes on leave |
| MO-7 | Motion across the site. Lenis smooth scrolling and GSAP run on every page: section headings wipe up as they arrive, card grids rise in with a slight 3D tilt, numbers count up, main buttons lean toward the pointer and a soft light follows the pointer across cards. Only content below the fold is set up to animate, and only transforms and clipping move, so nothing jumps at load and text keeps its contrast. Reduced motion turns all of it off | No horizontal scroll at 360 px; WCAG 2.1 AA unchanged; scenes draw only while on screen; nested scroll areas keep their own scrolling |
| MO-8 | Status 2026-11-09: the community globe went with the Community page (CM-2). Particle sculptures. Every page header and lesson header shows, on the header itself with no card around it, thousands of crisp particles that swirl in from a spiral galaxy and settle into a 3D shape that stands for the page, in the page's theme colours: a compass for roadmaps, a microphone for the mock interview, a bookshelf for books, a trophy for top questions, a globe for the community, and so on; lessons, topic pages and role roadmaps use their topic's shape (a database for Data, a robot for Agents). The shape turns and breathes, a shimmer sweeps through it, particles part around the pointer, a click bursts them and they re-form, and they drift apart as the header scrolls away. The home page keeps the road (MO-6) | Canvas is aria-hidden; reduced motion draws the finished shape once; without WebGL the page's icon shows; draws only while on screen; shapes are pure functions with unit tests |
| BR-1 | Brand system (2026-11-03, the owner's request for a world-class look). docs/brand.md is the one source for logo, colour, type, shape, buttons, motion and mascot. Seven colour families only: violet (primary: buttons, links, focus), teal (accent), emerald (done), amber (warning, XP), rose (error), sky (information) and zinc. The logo's "AI" and X Bot are violet. Pages are solid near-white or near-black; colour washes stay in headers and the home sky. Supersedes MO-5's peach and mint washes | A unit test fails if any other Tailwind colour family appears in src |
| BR-2 | Buttons and tap targets. Every button is a pill from components/ui.ts in three sizes (44, 48 and 56 px); one filled violet button is the main action of a screen; links are violet; video buttons are secondary. Nothing tapped on a phone is under 44 px tall. Three corner sizes: full, 16 px and 24 px | A unit test fails on min-h-8, 9 or 10 or on rounded-md, lg or xl in src |
| BR-3 | Minimal, DataCamp-style look (2026-11-07, owner request: "Keep the road and particle. Plain white or dark pages, simple cards, less text and fewer badges"). Pages are plain white (light) or dark; cards are flat with a thin grey border and no shadow, tilt or scroll rise (overlays such as menus and dialogs keep their shadow); covers are a flat tint with the topic icon; card facts are one plain line, not badges; page headers are plain grey with their particle sculpture; the home road and its milestones stay. MO-2 card rise and MO-3 tilt are retired. The home page drops the pain-point and trust card blocks and keeps the counts | Brand and e2e tests; screenshots in light and dark |
| BR-4 | Home and page polish (2026-11-07, owner request). Testimonials are a row that scrolls sideways with arrows, each card showing a short excerpt made only of the person's own words (with an ellipsis where a part is left out, checked by content:validate) and a Read more button for the whole quote. The "Stay on track" card shows an example week (days, three lessons, streak) so it matches the practice card beside it. Roadmap, topic and project cards carry a minimal line graphic (a central drawing with four smaller ones around it) in the topic colour, one for every role, topic and project, in place of a small icon. A cheatsheet is a minimal infographic: a map of numbered sections, each a labelled panel of tiles, and a sequence (such as the RAG pipeline or the 35-minute answer) drawn as a numbered timeline; filter, Quiz me, copy and PDF stay | Unit tests for scenes and excerpts; e2e for the carousel, the example week, the timeline, the section map and the line graphics |
| BR-8 | (Was a second BR-3, renamed 2026-11-09.) Content first. Page headers are compact by default (no sculpture on phones); hub pages opt into the full header. A lesson on a phone shows the quick answer straight after its title, the videos after the first part, related tags at the end and Learning, Done and Skip in a bar fixed to the bottom. A roadmap's main action is its first (or next) lesson; the PDF is secondary. The Library folds topic and level filters behind one button on phones and names levels in words ("Intermediate 2"). X Bot greets once, ever, and is 48 px on phones. The home road runs on the right of wide screens, clear of the hero text | e2e: the lesson track bar, the roadmap start button and the folded Library filters at 360 px |
| BR-9 | (Was a second BR-4, renamed 2026-11-09.) Trust pages. /about (why Xplaind exists, what it believes, how content is made), /privacy (PV-3) and /terms, linked from every footer. A contact address for privacy requests comes from NEXT_PUBLIC_CONTACT_EMAIL | Each page passes the WCAG check at 360 px |
| BR-5 | Short home page copy (2026-11-04, tester and owner feedback: too much to read). Each home page card says one thing in one short sentence, section intros are one line or none, guide cards show titles only and FAQ answers are two or three sentences. Every section, link and promise stays | Visible words on the home page fell from 1,576 to 1,187 with no section or link removed |
| BL-1 | Guide covers (2026-11-04). Every guide (blog post) has its own cover picture in public/blog/covers, named in its front matter with alt text. It shows on the home page Guides cards, the Blog index and at the top of the guide, and is the guide's share image. Covers are AI-generated illustrations with no text in them | Unit test: every guide names a cover file that exists |
| BR-6 | Light and dark mode switch (2026-11-06, owner request). A sun or moon button at the top right of the header switches the whole site, the 3D scenes included, and the choice is remembered on the device. With no choice made, the site follows the device setting; a script in the page head applies the theme before it paints, so it never flashes | e2e: the switch turns a light page dark and the choice survives a reload |
| BR-7 | Copy button on code (2026-11-06, owner request). Every code block in lessons and guides has a "Copy" button in its corner that copies the code and says "Copied"; text diagrams have none | e2e: a lesson's code block copies its text |
| TR-2 | The founder's story (2026-11-03, written with and approved by the owner). /about#founder shows Shyam Prabahar's photo, his story in his own words and a LinkedIn link; the footer links to it. His current employer is not named, at his request | e2e: the section, photo, LinkedIn link and footer link; WCAG at 360 px |
| NV-1 | Status 2026-11-09: since IP-3 the menu has five groups (Learn, Practice, Interview, Career, AI tools); the mock interview and Interview Q&A moved to Interview, and Pro appears under AI tools when NEXT_PUBLIC_PRO_OPEN=1. Grouped menu (2026-11-03). The top menu groups pages by what the visitor wants: Learn (Roadmaps, Library, Topics, Videos, Projects, Glossary, Papers and free books), Practice (Practice cards, Mock interview, Interview Q&A, Code playground, Weekly plan), Career (Jobs and salaries, Resume review) and AI tools. Papers and free books and the Weekly plan moved here on 2026-11-04 at the owner's request. Each group opens a short menu that works without JavaScript and closes on Escape, a click outside or a link | e2e: a link opens from a group menu |
| NV-2 | "You are here". The group of the current page is underlined and named as the current section to screen readers; the current link has aria-current="page" | Unit test of the page-to-group rule; e2e on a roadmap and the jobs page |
| NV-3 | Phone menu. On phones the menu fills the screen below the top bar with the main action first and the same groups; the page behind it does not scroll | e2e: the panel reaches the bottom of a 360 by 740 screen |
| NV-4 | Pages open at the top (2026-11-03). Following a link opens the new page at its top, even when the visitor clicks while the page is still scrolling. Back and forward return to where the visitor was, and a link to a #section lands on that section | e2e: a link clicked mid-scroll opens the next page at the top |
| NV-5 | The phone menu is an accordion (2026-11-13, owner request): one row per group (Learn, Practice, Interview, Career, AI tools) with a chevron; tapping a group opens its links and closes the others. The group of the page you are on starts open. Plain <details>, so it works without JavaScript | e2e: groups folded, the current group open, tapping another opens it and closes the first; links still reachable |
| NV-6 | The phone menu, redesigned (2026-11-13, owner request: smooth, modern, not an ordinary dropdown). Each group is a big row: a mono number (01 to 05, the road-marker signature), the name in the display face and a one-line hint of what is inside, with a round plus that turns into a filled minus. Tapping a row unfolds its links as a two-column grid of tiles that cascade in; the other rows fade back. The rows rise in one after another when the menu opens. One group open at a time; the group you are in starts open. Closed panels are hidden from screen readers. Under reduced motion nothing moves | e2e: groups folded, the current group open, tapping another opens it and closes the first; menu closes after a link and on Escape |
| NV-7 | Pro has its own place in the menu (2026-11-13, owner request). The AI tools group is renamed "AI Studio" and no longer holds the pricing page. Pro sits on its own: a "Pro" link with a violet dot at the end of the desktop bar, and an "Xplaind Pro" card at the foot of the phone menu (what Pro gives, from ₹249). The footer still links Pricing (BIZ-1) | Unit test: no menu group holds /pricing, the AI group is AI Studio |
| A11Y-1 | Lesson headers keep white text at 4.5:1 or more on every topic: the light end of a topic's colours is blended in a third of the way and a dark layer sits over the art | Checked by calculation for all topics |
| A11Y-2 | Loading states show a placeholder shaped like the content, with a spoken label, instead of plain text | Used on the dashboard, settings, weekly plan and account checks |
| A11Y-3 | Dark mode passes the same WCAG 2.1 AA check as light mode on the main page types | e2e in dark mode at 360 px |

## Search and AI answer visibility

| ID | Requirement | Acceptance |
|---|---|---|
| SE-1 | The production site (VERCEL_ENV=production) is open to search engines and AI answer crawlers (OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended and others); previews stay noindex. DISALLOW_INDEXING=1 closes production; private pages (dashboard, settings, sign-in, results, /go, /api) are never indexed | robots.txt allows / on production with the sitemap; previews disallow / |
| SE-2 | The sitemap lists every public page with a last-modified date (a lesson's review date, otherwise the newest review date) | Dates are deterministic, not the build clock |
| SE-3 | Every public page has a title of 60 characters or fewer, a description of at most 155 characters, a canonical address and Open Graph and Twitter tags | Audit of the built pages finds none missing on public routes |
| SE-4 | Every lesson has an `answer`: one or two plain sentences (at most 200 characters) answering "what is this?" or "how do I do this?". It is shown first on the page as Quick answer and used as the search description | content:validate fails a lesson without one |
| SE-5 | Lessons carry LearningResource, FAQPage (from their flashcards) and BreadcrumbList structured data; roadmaps carry Course structured data listing their lessons | JSON-LD parses on every lesson and roadmap |
| SE-6 | Shared links show an image: a site card and a card per lesson with its title, topic and level | Each lesson has an opengraph-image |
| SE-7 | /llms.txt maps the site for AI tools, listing every lesson with its answer by topic; /llms-full.txt holds each lesson's answer, why it matters and flashcards | Both are prerendered text files |
| SE-8 | Search-led titles, brand and keyword pages (2026-11-10, owner request after Google showed xplaind.com, an unrelated site, for "Xplaind"). The home page carries WebSite and Organization structured data naming Xplaind, xplaind.in, its logo, founder and audience, and a "What is Xplaind?" FAQ that says it is not xplaind.com. Every public template leads its title with the words India searches for (from Google India autocomplete; map in docs/seo-keywords.md): titles at most 60 characters, " | Xplaind" only when it fits; descriptions at most 155 characters, saying what the page helps the learner do. Amended the same day (owner): Xplaind is never called free anywhere on the site, in titles, descriptions, headings, buttons, FAQ or structured data; positioning is about outcomes (the job, the path, the skills, interview readiness). "Free" stays only as a fact about an outside course or book (cost labels, the "Free only" filter, certificate notes, the free-courses guide), because RM-6 needs prices shown. Guides may set a shorter `seo_title`. Two guides target the largest clusters: how to become an AI engineer in India, and free AI courses with certificate. Search Console and Bing ownership tags come from GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION | Unit test: fitTitle never gives a title over 60 characters for any role roadmap; content:validate passes the guides |
| UX-1 | Friendly errors (2026-11-11, owner report: "sometimes the site shows an error while loading"). The site has its own error page (app/error.tsx) with "Try again" and "Go to the home page", and a last-resort page for when the site frame itself fails (app/global-error.tsx). When the error is a missing code file from an older deploy (a page left open across a release), the page reloads itself once, at most once a minute, so a real outage never loops | Unit test: stale-deploy errors are recognised and reloads are limited to one a minute |
| UX-2 | Loading feedback (2026-11-11, owner request). A thin violet bar runs across the top from the moment a link to another page is tapped until the new page shows, and the road-and-dot loading mark shows while the error page reloads a stale page. No site-wide loading.tsx: every page is prebuilt, and a root loading boundary delayed hydration so early taps were lost. Both stay still under reduced motion | Checked by hand; e2e suite passes with the bar mounted on every page |
| UX-3 | Menu with icons (2026-11-11, owner request, StudyFetch's menu as reference). Every item in the five menus has its own icon on a soft coloured tile, with its one-line note; groups with more than four items show in two columns, and the phone menu shows the same icons | nav.test.ts still finds every item; checked by hand at 360 and 1440 px |
| UX-4 | Feature deck on the home page (2026-11-11, owner request, StudyFetch's feature cards as reference, built as Xplaind's own design). The Learn, Notes and Get hired sections are one section with six tabs (Roadmaps, Lessons, Your notes, Interviews, Weekly plan, Get hired); the chosen card comes to the front of a fanned stack and the old one slides away. Swipe on phones, arrow keys on the tabs, a slow autoplay only while on screen and untouched, and none under reduced motion. The home page is about a quarter shorter | e2e: the Your notes tab shows its card with "Try it with your notes" (MB-6) |
| UX-5 | Home page unslop pass (2026-11-13, owner request, with the unslop skill). Polish only: same sections, order, copy and 3D road. The brand violet is kept for buttons and links only; no gradient text, no coloured number figures, no rainbow icon tiles or pastel card stack. Steps and milestones share one signature marker, a mono distance number with a short rule, as on a road. No magnetic or bouncy buttons on the home page. Headline and closing heading end without a full stop | e2e: home heading text, links and the hero's interview shortcut; brand corner test |
| UX-6 | Site-wide unslop pass (2026-11-13, owner request, with the unslop skill). Violet stays the one action colour: primary buttons and links. Secondary buttons, icon tiles, AI badges and the AI chat avatar are quiet neutrals. No sparkle icons, no two-hue gradients on tiles, bars or progress lines, no violet-tinted shadows, no uppercase tracked labels, no cards that lift or images that zoom on hover, no bouncing dots, no exclamation marks in interface text. Topic chips show a small colour dot for the category. Pricing badges are quiet text. Kept on purpose: the 3D road, the particle page headers and each lesson's theme-coloured header | Unit tests; full e2e suite; brand corner test |

## Community

| ID | Requirement | Acceptance |
|---|---|---|
| CM-1 | (Replaced by CM-2 on 2026-11-02.) /community explained the learner community, its rules and its 18+ age limit, and links to the Discord server or WhatsApp community set in content/community/community.yaml. With no link set it says the community is launching soon. Xplaind stores no community data | The page renders with and without links; the age note is visible |
| CM-2 | No separate Community page (owner, 2026-11-02). Every "Join the community" button goes straight to the WhatsApp group set in content/community/community.yaml, and /community redirects there, so old links still work. The header's Community slot now holds Jobs | The footer invite links to chat.whatsapp.com; /community answers a redirect to the group |

## Study from my notes & books (was "Ask me from my book")

Added at the owner's request (2026-10-26). A learner tests themselves on their own textbook or notes, a retrieval-grounded quiz on material we do not host.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| MB-1 | The learner picks a PDF with selectable text, or a .txt or .md file, up to 60 MB. It is read in the browser, split into excerpts of about 250 words, each labelled with its page and its chapter from the PDF's bookmarks (or ten-page parts when there are none). Contents pages and number tables are skipped. The learner chooses the chapters, the difficulty (easy recall, medium understanding, hard apply and compare), 5 to 25 questions and 5 to 60 minutes | The file never leaves the browser; a scanned book with no text gets a clear message; works at 360 px and passes WCAG 2.1 AA |
| MB-2 | Questions are written by AI from excerpts spread over the chosen chapters in proportion to their length, at most 30 excerpts a test. Each question has 4 options, an explanation and a quote of 8 to 40 words copied from its excerpt. The server keeps a question only if the quote is found in the excerpt it cites, so every answer can be found in the book. Signed-in learners aged 18 or over only, 5 tests a day, under the AI guards (CO-1, SC-5) | Unit tests for excerpt spread, the quote check and the prompt; under-18s and signed-out visitors can read a book but not generate (PV-2) |
| MB-3 | The test is timed and ends itself when time runs out. The report shows the score, each question with the learner's answer, the right answer, the explanation and the quote with its chapter and page, a score per chapter, the chapters where the learner is strong (80% or more on two or more questions) and the ones to focus on (under 60%) with the pages to reread. The report downloads as a PDF | Pure scoring function with tests; the download is a real PDF file |
| MB-4 | Tests and results are kept on the device only, at most 10. The book, its excerpts and the answers are never stored on the server | Stored shape is checked on every read; a malformed entry is dropped |
| MB-5 | Flashcards from the learner's file (2026-11-06, owner request). After choosing chapters the learner picks "A timed test" or "Flashcards" (10, 15, 20 or 30 cards). Cards are written by AI from the same kind of excerpts as MB-2; the server keeps a card only if its quote is found in the excerpt it cites. Each card has a front, a back, the quote and its chapter and page. Cards flip; "Again" cards come first next time. Decks are kept on the device only, at most 10, and download as CSV for Anki and similar apps. Shares the daily cap of MB-2 (5 tests or decks a day) | Unit tests for the grounding check, study order, CSV and the stored shape |
| MB-6 | Name and place (2026-11-06, owner request). The tool is called "Study from my notes & books" (was "Ask me from my book"). It has its own section on the home page and is first in the AI tools menu. It also reads Word (.docx) files, with Word headings as chapters; an old .doc file gets a message to save it as .docx or PDF | Unit test for Word headings; e2e for the heading and the home section |

## Roadmap checklist download

Added at the owner's request (2026-10-26).

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| RD-1 | Every roadmap downloads as a printable PDF checklist: each section with a box per topic (hours, optional, coming soon), the section project with its deliverables, space for start and target dates and notes, and topics already done or skipped ticked | Made in the browser; works at 360 px |
| RD-2 | Before the first download the learner gives name, email, professional experience and, optionally, a phone number, and agrees to the stated consent text. Details go to a server-only table with row-level security, are deleted with the account and included in the data export. A learner who says they are under 18 downloads without giving details and nothing is sent (PV-2); since SU-1 this applies only while accounts are off, because the PDF needs an account and accounts are 18+. Signed in, the form is pre-filled from the account. Details are asked once per device | RLS test; the API validates every field; the under-18 path sends no request |

## Interview Q&A, MCQs and books

Interview prep is the entry point and the reason to share the site. Release 1 is read-and-check practice; typed-answer grading follows in release 2 and the voice simulator in release 3. The topic list comes from what the r/LLMDevs poster said interviewers test: transformers, RAG, agents, fine-tuning versus prompting versus RAG, evals, system design and behavioral questions ([thread](https://reddit.sentinel-team.org/posts/1sn7hc8/snapshots/2026-04-17T05%3A37%3A44.74927Z)).

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| IQ-1 | Question record: question, short answer (60 words or fewer), deeper answer, 2 to 3 follow-up questions, common mistakes, level (B1 to P3), topic tags, reviewed\_by and reviewed\_on | Content validation rejects a record with any field missing |
| IQ-2 | Launch volume: 40 questions by week 4 and 100 by week 8, across transformers and LLM basics, RAG, agents, evals, fine-tuning versus RAG versus prompting, system design, ML basics and behavioral questions | At least 5 questions per topic; each links to a roadmap stop |
| IQ-3 | Browse and filter by topic and level. Each question has its own page with a clean URL and title for search | Pages are statically generated and listed in the sitemap |
| IQ-4 | Practice mode: show the question, let the learner think, reveal the short answer, then the deeper answer; the learner rates "got it", "partly" or "missed" | Ratings are saved for signed-in learners and in the browser otherwise |
| IQ-5 | MCQ practice. Each stop's check is 3 to 5 MCQs; interview topics also have standalone MCQ sets | At least 3 MCQs per stop; each has an explanation |
| IQ-6 | Review rule. Any text drafted with an AI tool must be reviewed and signed by a person before it is published | The publish check reads reviewed\_by; no unreviewed record is built into the site |
| IQ-7 | Release 2: typed-answer grader. The learner types an answer; a small model scores it 0 to 5 against the reference answer and a rubric, and returns what was missing. Daily cap per learner, treat the typed text as data not instructions, log token cost | A user cannot exceed the cap; an answer that says "ignore your instructions" is graded as an answer |
| IQ-7a | Mock interview review (added 2026-10-26 at the owner's request). Every answer in a mock interview is analysed in the browser without a model: key points covered with the learner's own words as evidence, closeness to the reference answer, structure (definition, example, trade-off, real use), an understanding score per answer and per concept, and lessons to revisit. Signed-in learners can add one AI review of the whole interview that grades every answer for meaning, lists what was right, wrong and missing, and sums up strengths, gaps and next steps. Daily cap of 3 reviews, answers treated as data | The report shows understanding per answer and per concept with no model call; the AI review is one call per interview and respects the caps |
| IQ-8 | Top 25 per role (added 2026-10-26 at the owner's request). Each role has 25 interview questions on one page, in study order, at least 12 of them scenario, use-case or real-life questions. Each shows the short answer, the explanation, an example the learner can tell in a real interview, follow-ups and mistakes to avoid. The page prints or saves as PDF | Validation fails unless every role lists exactly 25 existing questions on its own lessons, each with an example, and at least 12 practical ones |
| IQ-9 | Interview answers by role (added 2026-11-02). One page lists every interview question for the role picked in a filter that names every role, each with its short answer, deeper answer, follow-ups and common mistakes; it can be searched, shortened to short answers and printed. Single question pages stay public | The filter lists every role and an "All roles" choice; the page passes WCAG 2.1 AA at 360 px |
| IQ-10 | Status 2026-11-09: not built; the practice queue orders by rating (src/lib/practice/queue.ts). (Was a second IQ-8, renamed 2026-11-09.) Release 2: spaced repetition. Questions rated "partly" or "missed" return after 1, 3, 7 and 21 days | The practice queue is ordered by due date |

**Books**

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BK-1 | A books page with about 20 books by level: title, author, why it is worth reading, level, and a buy link on Amazon India | Each book has a why-it-helps line of 40 words or fewer |
| BK-2 | Affiliate links carry a visible "we earn a commission" label and a sitewide disclosure page. Commission never changes order | The sort function does not read the affiliate field; a test enforces it |
| BK-3 | Link to a free PDF only when the author or publisher hosts it | Validation requires a hosted\_by field for any PDF link |
| BK-4 | Lesson pages show up to two books for the lesson's topic, and topic pages up to four, each with the same "we may earn a commission" label and a link to the books page. The pick uses the editor's score, never commission. Buy links go through /go/book/\[id\], which adds the Amazon Associates tag from the AMAZON\_IN\_TAG setting | The book-order function is in the ED-2 test; a book file holds a plain amazon.in link with no tag |
| LB-1 | Papers and free books library (added 2026-11-02 at the owner's request). /papers lists landmark AI research papers and free AI books, grouped by topic, each with authors, year, level and a "why read it" line of 40 words or fewer. Links go only to copies the authors or publishers host (arXiv, the authors' sites), and each item names its host (BK-3). We never host the files | Validation requires a host for every item; paper details are checked against arXiv |
| LB-2 | Opening or downloading a paper or book needs a free account (SU-3) | Signed out, the download opens the sign-up prompt and the link is not followed |

The Amazon India commission rate is unconfirmed: a 2026 guide I found said about 4% and older sources said 10%, so treat books as a trust feature first and an income line second.

## Accounts, progress and messages

Keep gamification light. In a Belgian study of 6,592 adults, which the idea validation doc cites, gamification added only 1.6 percentage points to course completion, so the main pull must be a clear next step. The streak counts weeks, not days, because the target learner has 3 to 8 hours a week and a daily streak would punish a part-time learner.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| AC-1 | Sign-up and sign-in with Google, GitHub, email and password, or an email link (amended 2026-11-01 at the owner's request; was email link only). One form offers all four and works with JavaScript off. A new account needs the "I am 18 or older" tick; for Google and GitHub the tick travels to the callback in a short-lived cookie. Passwords are 8 to 72 characters; a learner can set one later in Settings. After signing in the learner returns to the page they came from, or the home page (2026-11-06; was the dashboard), and the device's progress is claimed (AC-2) on that page | No account is created without the tick; the tick is stored with a timestamp; a new Google or GitHub account without it is signed out again |
| AC-1a | Sign in with Google on xplaind.in (2026-11-04, owner request: Google's window showed the Supabase address and looked like spam). With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, the sign-in form shows Google's own button (Google Identity Services, loaded only on sign-in forms); the ID token and a one-time nonce go to /auth/google, which calls Supabase signInWithIdToken, so Google shows xplaind.in or the app name. The 18+ tick and profile rules of AC-1 and PV-2 apply unchanged. Without the setting, or before Google's script loads, the redirect button of AC-1 stays | Unit tests: the form needs a token, a nonce and the 18+ tick; the nonce is random and hashed with SHA-256 |
| AC-12 | Two account words only (2026-11-11, owner request: a signed-out learner who already had an account was told to "Create your account", and the phone menu showed "Get started" and "Sign in or create an account" side by side). Everywhere the site asks for an account it offers exactly two actions, "Sign up" and "Sign in": the header and phone menu, the roadmap and AI gates (both open the sign-in dialog on the matching tab), the account wall and the sign-in form. Headings read "Sign in or sign up to …" | Checked by hand with accounts on; e2e suite passes with accounts off |
| AC-13 | Sign-in timeout (owner decision 2026-11-12: learners stayed signed in forever). A signed-in learner is signed out after 7 days without a visit, and always 30 days after signing in. Every page load records the visit in a first-party cookie (xp_seen, 30 days, never sent elsewhere); the browser checks on every page and the proxy on account pages and APIs, using the sign-in time from the session token. The privacy page lists the cookie | Unit test: idle and absolute limits, unknown times never sign out |
| SU-1 | What needs a free account (added 2026-11-01 at the owner's request): downloading a roadmap PDF, the mock interview simulator, and saving progress (lesson status, check scores, project links, streaks, practice ratings). Everything else stays open without an account, so search engines and AI answers can read it: lessons, roadmaps, videos, glossary, blog, books, interview questions and the placement test with its result (PL-5) | With accounts on, a signed-out visitor who starts a gated action sees the sign-up prompt and nothing is saved; with accounts off (no Supabase settings) everything works as before |
| SU-2 | One sign-up prompt for the whole site opens over the page, names what the learner was trying to do, offers every sign-up option and returns them to the same page. Anyone can still take a lesson check or practice a card; only saving needs an account. Saves the learner did not ask for (opening a course marks a lesson "learning") are skipped quietly | The prompt passes the accessibility scan at 360 px; a check score is not celebrated or counted unless it was saved |
| SU-3 | Status 2026-11-09: for AI tools, superseded by SU-5 (they work without an account). The other gates apply only once sign-ups open (SU-4). Also behind a free account (added 2026-11-02 at the owner's request): every AI tool page (Study from my notes & books, roadmap generator, AI tutor), the interview answers-by-role page (IQ-9) and downloads from the papers library (LB-2). Their descriptions stay public for search. On the AI tools page, Ask me from my book comes first | A signed-out visitor sees the sign-up form in place of the tool; with accounts off the tools show as before |
| SU-4 | Temporary hold on sign-ups. Until the owner finishes the sign-in set-up, the site runs as if accounts were off: no sign-up prompts, every gated feature (roadmap PDF, mock interview, papers library, AI tools pages, saved progress on the device) is open, and the sign-in page says sign-ups are paused. (Since SU-5 the AI helpers work during the hold too.) Setting NEXT_PUBLIC_SIGNUPS_OPEN=true in the host's settings and redeploying lifts the hold with no code change | Unit test: Supabase set up but sign-ups not opened leaves every gate open |
| SU-5 | Status 2026-11-10: once sign-ups open, AG-1 replaces guest AI with a sign-up requirement. AI tools without an account. Every AI helper (roadmap generator, AI tutor, resume review, ask-my-book, interview feedback, the code playground's error help, the site bot) works without signing up. A signed-in learner with an 18+ profile uses their own daily allowance; anyone else is a guest, counted by a hash of their address that changes every day (the address is never stored), with the same per-kind daily limits and a burst limit. Guest spend counts toward the one monthly cap (CO-1). The owner can still switch AI off with AI_KILL_SWITCH | Unit tests: guests use the guest guard; database tests: per-visitor daily limits, guest and learner spend share the monthly cap, no visitor or learner can read or write guest usage |
| AG-1 | AI needs an account (2026-11-09; tightened 2026-11-10 by the owner: "without signing up, nobody should be able to use any AI tools"). Once sign-ups are open (SU-4 lifted), every AI call from a visitor without an account (tutor, X Bot AI answers, answer feedback, mock interview report, resume review, roadmap generator, notes to test, playground error help) is refused with 401 and `signin: true` before anything is spent, and the AI tool pages show a "Sign up free to use the AI tools" card that opens the site-wide sign-up prompt (Google or an email link). X Bot keeps its instant answers from Xplaind's own pages, which use no AI. While sign-ups are on hold, guests keep the per-feature limits. Under-18s cannot have accounts (PV-2), so they get no AI. The free-try function from 9 Nov (ai_reserve_guest_sample) stays in the database but is no longer called | Unit test: a guest under the gate gets 401 with signin and no reservation or model call |
| RG-1 | Roadmaps need an account, with a preview (owner decision, 2026-11-10). Once sign-ups are open, a signed-out visitor on a role roadmap sees the header, the first stage and a "Sign up free to see the full roadmap" card; on the Generative AI level pages, the first three steps and the same card. Search engines get the same preview in the HTML, so pages stay indexed. Lessons, topics, practice, projects and the blog stay open without an account. The card tells under-18s, who cannot have accounts, that every lesson is still open by topic. The gate runs in the browser: the roadmap's structure still ships in the page data, and lessons are public anyway | Accounts off in CI, so existing roadmap e2e still see the full roadmap; checked by hand with accounts on |
| PG-6 | Runnable code only where it runs (2026-11-09, owner request to embed the playground in lessons). A lesson's Python block gets "Run this code" only when every import is in the standard library or Pyodide's package set (numpy, pandas, scikit-learn, pydantic, PyYAML and others); code that needs model SDKs, servers or PyTorch stays copyable. Technical intermediate and professional lessons without such a block gained a short "Try it in your browser" example (34 lessons), so 126 of 146 now have one; the rest are Rust, career and client-delivery lessons | Unit test: the import check; every new example was run before adding it |
| MB-7 | Status 2026-11-12: removed by FOCUS-2 (X Bot merged into the AI tutor). X Bot on phones (2026-11-09, owner report: the button covered lesson text and buttons). Under 640 px the launcher slides half off the right edge while the reader scrolls down and returns when they scroll up; the first-visit hint bubble shows only on larger screens. It stays one tap to open | e2e: on a lesson at 360 px the launcher tucks on scroll down, returns on scroll up and still opens |
| MB-8 | Ask your notes (2026-11-12, owner request, the study loop from docs/notes-tool-ideas.md). After opening a file the learner can pick "Ask your notes" beside a test and flashcards. The browser picks the 6 passages that best match the question (a small keyword score) and sends only those; if none matches, the reply is "not in your notes" with no AI call. Answers use only those passages and come with 1 to 3 exact quotes and their pages; an answer whose quote is not found in the cited passage is shown as "not in your notes". New AI kind `notes` on the fast model, daily limits 30 (before Pro), 5 guest, 20 account, 100 Pro. Nothing asked is saved | Unit tests: passage picking, quote check, not-found path; e2e: the choice renders, fits 360 px and passes axe; the API checks input, refuses when AI is off and answers "not in your notes" without AI for no passages |
| MB-9 | Retest what I missed. A finished report with any miss offers "Test me on what I missed": a new test at the same level on the sections scored under 60% (or, when none was that low, every section with a miss), 2 questions per miss between 5 and 15, from fresh passages of those sections. The file is not kept, so if it is not open the learner opens it again on the device; a different file is flagged. Retests are labelled in the list | Unit tests: sections and count; e2e: the panel names the weak section and asks for the file |
| MB-10 | Spaced repetition. Every flashcard deck keeps a box and a due date per card on the device: "I knew it" moves the card up a box (1, 2, 4, 8, 16, 32 days), "Again" brings it back tomorrow. Studying a deck shows only the cards due today (overdue first, then new); the tool's start shows how many cards are due across decks with "Review now". A report can turn the questions missed into a review deck (question, right answer and why, and the quote), with no AI call. Old decks without a schedule treat every card as new | Unit tests: intervals, due order, date maths; e2e: a review saves the schedule, due cards are counted and shown first, missed questions become a deck |
| TR-3 | The free promise on About (2026-11-09, owner request). The About page leads with "All N roadmaps, N written lessons and N course picks are free, forever", using live counts, and lists "Learning stays free" among its beliefs. When Pro is open it adds one paragraph saying a Pro pass gives more AI help each day and never unlocks lessons. It names only features that exist | Counts come from the content files |
| AI-1 | One AI tutor (owner, 2026-11-02; the personal coach was merged into it). Inside every lesson it is grounded in that lesson; on /ai/tutor it sees a short summary of the learner's progress on the device and also plans study, answers career questions and, since FOCUS-2, points learners to the right page of the site. /ai/coach redirects to /ai/tutor. The AI course generator and editing a roadmap with AI were removed; a generated roadmap is still edited by hand | Unit and e2e tests: one tutor route serves both, the old coach link lands on the tutor, the removed tools are gone |
| PG-1 | Code playground: Python runs in the learner's browser with Pyodide (pinned version) in a Web Worker, so nothing is sent to a server and a long loop never freezes the page; a run is stopped after 15 seconds | The playground runs code and shows output and errors; e2e checks the editor and starters |
| PG-2 | /playground offers starter programs tied to lessons (tokens, embeddings, retrieval, pandas, a bug to fix) and opens code handed over from a lesson in its link | Unit tests: examples link only to lessons that exist; code survives the link round trip |
| PG-3 | When a run fails and AI is on, "Explain this error with AI" sends only the code and the error to the AI tutor, on request | The button appears only after an error and only with AI on |
| PG-4 | Python examples in lessons get a "Run this code" button that opens them as an editable runner with an "Open in playground" link; other code blocks are unchanged | e2e: a lesson's Python block opens a runner |
| PG-5 | More to practice (2026-11-04, owner request). The playground groups its starters as Warm-ups (chai budget, text pyramid, emoji chart, rock-paper-scissors, number guessing), AI ideas (tokenizer, temperature, similarity, retrieval, prompt template, spam filter, nearest neighbours, line of best fit, precision and recall, pandas) and Challenges (fix the bug, palindrome, Fizz Buzz Chai, count vowels). Each starter is short, runs with no input() and shows one "Try this" change | Unit tests: every group has at least four starters, each with a tip and no input() |
| JB-1 | /jobs: for every role roadmap, typical yearly salary bands in India (lakh rupees) by experience, from published salary data and job posts, with the date they were checked and the sources listed; editorial content in content/jobs/salaries.yaml, re-checked every quarter | Unit tests: every role is covered, bands rise with experience, the checked date is not in the future |
| JB-2 | Each role lists the skills job posts ask for, and links to live openings on Naukri and LinkedIn searched across India. Xplaind does not list, rank or earn from jobs | Unit and e2e tests on the links |
| JB-3 | Each role roadmap links to its salary card; Jobs is in the top bar | e2e: the roadmap link lands on /jobs#role |
| JB-4 | The home page hero backs its promise with three dated, sourced figures on India's AI job market (stored with the salaries in content/jobs/salaries.yaml), linked to a sources note at the foot of the page | Unit tests: every figure has an https source and a checked date not in the future; e2e: the Sources link and its targets |
| WP-1 | /plan: this week's study plan (Monday to Sunday, India time) for the chosen role, sized to the hours the learner picks: lessons already started first, then the next ones in roadmap order, plus a 30-minute practice session; never empty while lessons remain | Unit tests on the week and the plan |
| WP-2 | The week's plan is kept on the device so finishing a lesson ticks it instead of swapping it; changing the role or hours makes a new plan | Unit tests: the plan holds within a week and settings |
| WP-3 | Weekly reminder without an account: "Add to Google Calendar" and a downloadable .ics, both a 30-minute event every Monday at 9 am India time that opens /plan. Email or WhatsApp reminders wait for sign-ups and a sending service | Unit tests on the calendar file and link; e2e downloads the .ics |
| RV-1 | /ai/resume: the learner uploads a resume (PDF with text, or .txt) or pastes it, and may add the target role and a job post. The file is read in the browser; only its text is sent to the AI, for one review, and Xplaind stores nothing | The API refuses without AI and refuses a too-short resume |
| RV-2 | The review reads it as a recruiter and an applicant tracking system would: a 0 to 100 shortlist score, a short verdict, what already works, 5 to 12 fixes in priority order with a rewritten example line, and missing keywords. It never invents experience or numbers | Unit tests: the prompt wraps learner text as data; the clean-up bounds the score and orders the fixes |
| RV-3 | Status 2026-11-09: the daily limit now follows PAY-1's table per tier. Daily limit of 5 reviews per learner or guest; counts toward the monthly cap (CO-1) | Covered by the AI guard tests |
| PR-9 | The Practice page shows an AI glossary section (term count, popular terms, a link to /glossary) and an AI glossary button, since the glossary was otherwise only in the footer | e2e checks both links |
| AC-2 | Claim. On first sign-in, attach the device's saved test result and progress to the account | A learner who tested signed out sees the same result after signing in |
| AC-3 | Dashboard: current level, next five steps, progress across the nine levels, weekly streak, weekly-hours goal, and a re-test link | Loads in under 2 seconds on a mid-range phone over 4G |
| AC-4 | Progress rows per stop: status, check score, project link, timestamps. Any change records an activity day | Rows are readable and writable only by their owner |
| AC-6 | Carry on where you left off. The lesson a learner opened last is kept on the device and, signed in, on their profile (last_stop_id), so the home page and dashboard offer "Continue where you left off" on any device. Signed out, the card invites sign-up. The header's main button reads "Sign up" when signed out and "My progress" when signed in | The column is writable only by its owner (RLS); the newer of device and account wins on sign-in |
| AC-5 | Weekly streak. A week (Monday to Sunday, India time) counts when the learner marks a stop done, passes a check or finishes a practice set | The streak resets after one empty week, not before |
| AC-12 | (Was a second AC-6, renamed 2026-11-09.) (Amended 2026-11-06, owner request: XP, ranks and badges are removed from the site; points were not a real motivation and confused learners.) No XP, rank or badge is shown anywhere. A level whose steps are all done shows "Level done" on the dashboard. The day streak and lesson progress stay. Level-passed records are still kept for the level card | e2e: no "XP" text on lessons, the header or the dashboard, and no Badges section |
| AC-7 | Level card: an image of 1200 by 630 pixels showing level, goal, weeks active and the site URL, with an optional first name. Sharing is opt-in and the link is unguessable | The card holds no email, photo or exact dates; the learner can delete it |
| AC-8 | Status 2026-11-09: built as CM-90, the opt-in weekly 'Commit to 90 days' email. Weekly email on a fixed weekday and time chosen by you: the next step, a progress line, and an unsubscribe link, plus the List-Unsubscribe header. Sent only to learners who gave consent | An unsubscribe takes effect before the next send |
| AC-9 | Status 2026-11-09: not built; there is no landing-page email capture. CM-90 opt-in is for signed-in learners. Landing and in-app email capture uses double opt-in. Store the consent text shown, the timestamp and the source page | A row exists for every sent email address, with consent evidence |
| AC-10 | WhatsApp in release 1 is a link to a public WhatsApp Channel. No WhatsApp messages are sent to individuals; that needs the WhatsApp Business API and is a release 2 decision. Amended 2026-10-26: an optional phone number may be given with consent on the roadmap checklist download (RD-2), and nothing else collects one | The only phone field is the optional one in roadmap_downloads |
| AC-11 | Settings: delete account and export my data as JSON | Deletion removes the learner's rows in the same request |

## Editorial rules, link checks and admin

Build decision: editorial content (levels, stops, resources, questions, books, lessons) lives in the git repository as YAML and MDX files, and the site is built from them. Link-check results live in a file the weekly job commits. Only user data lives in the database. This gives version history, review by pull request and cheap static pages that search engines can read, and it means no admin forms to build in release 1.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ED-1 | A primary pick comes from the official provider or a creator with clear credentials, was updated or confirmed current in the last 12 months, fits the level without a prerequisite jump, includes hands-on work, and is free or within the price cap (about ₹400 typical, hard cap about 10 US dollars) | Validation rejects a paid resource above the cap unless exception\_reason is filled in |
| ED-2 | Ranking uses an editor score from 0 to 5 (fit, quality, currency, hands-on, cost) stored in the file. No code that picks or orders resources reads the affiliate or commission fields | A test fails if any ranking function imports those fields |
| ED-3 | A "How we rank" page lists these rules, how often links are checked, how the site earns money, that no one can pay for placement, and how to report a wrong link. Every resource card links to it | Page exists and is linked from the footer and each card |
| ED-4 | Every resource has why\_picked, last\_verified (the date an editor opened it and confirmed access and price) and verified\_by | Validation fails on a missing field |
| ED-5 | Status 2026-11-09: not built yet; cards say each link has not been checked until a job writes data/link-status.json. Weekly link check, run by a scheduled GitHub Action. A status of 2xx or 3xx is ok; 404 or 410 is broken; 403, 429, 5xx or a timeout is unknown, because many sites block bots, and unknown is not shown to users as broken. Three unknown results in a row go to the review queue. The job writes data/link-status.json and opens an issue listing broken items | A test with one 404 fixture and one 403 fixture reports broken 1 and unknown 1 |
| ED-6 | Freshness. An item last verified over 90 days ago enters the review queue; over 180 days shows a "needs re-check" badge on the card | Dates are computed from last\_verified, not file modified time |
| ED-7 | Status 2026-11-09: not built yet. Review page at /admin, open only to emails in an allowlist setting. It lists broken and unknown links, stale items, expired prices and unreviewed questions, each with a link to the file on GitHub. Read-only in release 1 | Anyone not on the allowlist gets a 404 |
| ED-8 | A command, content:validate, checks schemas, references (every stop points to real resources), counts per level, review fields, the price cap, and hosted\_by on PDF links. It runs in CI and blocks the merge | A deliberately broken fixture fails the command |
| ED-9 | AI-assisted drafts of questions or lessons are allowed but flagged drafted\_with\_ai and need a human review before publishing | The publish check reads reviewed\_by and reviewed\_on |

## Data model

Two stores. Editorial content is files in the repository, validated by Zod types. User data is Postgres tables with row-level security. Names below are the contract; Claude Code may add fields but should not rename these.

**Content files**

```markdown
content/
  goals/genai-engineer.yaml
  levels/levels.yaml                 # B1..P3: name, can_do, draft_hours
  stops/<level>/<stop-id>.mdx        # frontmatter below + short lesson text
  resources/<resource-id>.yaml
  questions/placement/<id>.yaml
  questions/interview/<id>.yaml
  questions/checks/<stop-id>.yaml
  books/<id>.yaml
data/link-status.json                # written by the weekly job
```

```ts
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Level = z.enum(["B1","B2","B3","I1","I2","I3","P1","P2","P3"]);
const Cost = z.enum(["free", "free_cert_paid", "paid"]);

const Resource = z.object({
  id: z.string(), title: z.string(), provider: z.string(), url: z.string().url(),
  type: z.enum(["course","video","article","book","repo","tool","docs"]),
  level: Level, cost: Cost,
  price_inr: z.number().int().positive().optional(),   // required when cost is "paid"
  price_checked_on: IsoDate.optional(),                // required when price_inr is set
  exception_reason: z.string().optional(),             // required above the price cap
  hours: z.number().positive(), language: z.string().default("en"),
  certificate: z.boolean(), affiliate: z.boolean().default(false),
  editor_score: z.number().min(0).max(5),
  why_picked: z.string().max(280),
  last_verified: IsoDate, verified_by: z.string(),
  tags: z.array(z.string()),
});

const Stop = z.object({
  id: z.string(), level: Level, order: z.number().int(),
  title: z.string(), outcome: z.string(), why_it_matters: z.string().max(360),
  hours: z.number().min(1).max(6), gap_tags: z.array(z.string()),
  primary_resource: z.string(), alternates: z.array(z.string()).max(2),
  check: z.union([
    z.object({ type: z.literal("mcq"), question_ids: z.array(z.string()).min(3).max(5) }),
    z.object({ type: z.literal("project"), brief: z.string() }),
  ]),
});

const Review = { drafted_with_ai: z.boolean(), reviewed_by: z.string(), reviewed_on: IsoDate };

const PlacementQuestion = z.object({
  id: z.string(), level: Level, topic_tags: z.array(z.string()),
  stem: z.string(), options: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
  correct: z.string(), explanation: z.string(), ...Review,
});

const InterviewQuestion = z.object({
  id: z.string(), question: z.string(), short_answer: z.string(), deeper_answer: z.string(),
  follow_ups: z.array(z.string()).min(2).max(3), common_mistakes: z.array(z.string()),
  level: Level, topic: z.string(), stop_id: z.string(), ...Review,
});

const Book = z.object({
  id: z.string(), title: z.string(), author: z.string(), level: Level,
  why: z.string().max(280), amazon_in_url: z.string().url(), affiliate: z.literal(true),
  hosted_pdf_url: z.string().url().optional(), hosted_by: z.string().optional(),
});
```

**User tables.** Turn on row-level security for every table. Policy for the tables with a user\_id: the row is visible and writable only when user\_id equals the signed-in user. email\_subscriptions and resource\_clicks are written only by server routes.

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  goal_id text not null default 'genai-engineer',
  weekly_hours smallint check (weekly_hours between 1 and 40),
  adult_confirmed_at timestamptz not null,
  start_level text,
  created_at timestamptz not null default now()
);

create table quiz_attempts (            -- signed-in only; signed-out results stay in the browser
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  goal_id text not null, quiz_version text not null,
  answers jsonb not null,               -- [{question_id, level, chosen, correct}]
  passed_level text, start_level text not null,
  gap_tags text[] not null default '{}',
  finished_at timestamptz not null default now()
);

create table stop_progress (
  user_id uuid not null references auth.users on delete cascade,
  stop_id text not null,
  status text not null check (status in ('in_progress','done')),
  done_how text check (done_how in ('check','project','self_marked','self_skipped')),
  check_score smallint, project_url text,
  updated_at timestamptz not null default now(),
  primary key (user_id, stop_id)
);

create table activity_days (user_id uuid not null references auth.users on delete cascade, day date not null, primary key (user_id, day));
create table badges (user_id uuid not null references auth.users on delete cascade, badge_id text not null, earned_at timestamptz not null default now(), primary key (user_id, badge_id));
create table practice_ratings (user_id uuid not null references auth.users on delete cascade, question_id text not null, rating smallint not null check (rating in (0,1,2)), due_on date, updated_at timestamptz not null default now(), primary key (user_id, question_id));

create table email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique, user_id uuid references auth.users on delete set null,
  source text not null, consent_text text not null, consent_at timestamptz not null,
  confirmed_at timestamptz, unsubscribed_at timestamptz
);

create table level_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  level text not null, goal_id text not null, weeks_active smallint not null,
  display_name text, created_at timestamptz not null default now()
);

create table resource_clicks (          -- no user id, no IP address
  id bigint generated always as identity primary key,
  resource_id text not null, stop_id text, level text, clicked_at timestamptz not null default now()
);

create table ai_usage (                 -- release 2: grader and tutor caps
  user_id uuid not null references auth.users on delete cascade,
  day date not null, kind text not null,
  calls int not null default 0, tokens_in int not null default 0, tokens_out int not null default 0,
  primary key (user_id, day, kind)
);

create table ai_guest_usage (           -- SU-5: AI without an account; server only, no policies
  visitor text not null,                -- daily-rotating hash of the address, never the address
  day date not null, kind text not null,
  calls int not null default 0, tokens_in int not null default 0, tokens_out int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  primary key (visitor, day, kind)
);
```

## Architecture, pages and API

A Next.js site renders static pages from content files, a small server layer handles the test claim, progress and email, and Supabase holds user data. The stack below is my recommendation; versions and prices were not checked, so confirm them at build time.

&#91;embedded content: architecture · 7 parts, 6 links\]

Content reaches the site only through the build. User data reaches the database only through server routes or row-level-security policies. The test runs in the browser using the shared scoring module, and the server re-scores the answers when a learner signs in. Answers ship to the browser, which is acceptable because the test has no stakes.

| Layer | Choice | Note |
| --- | --- | --- |
| Framework | Next.js App Router, TypeScript strict, Tailwind CSS | Static generation for content pages |
| Hosting | Vercel or Cloudflare Pages | Free tier to start; the idea validation doc estimates ₹2,000 to ₹10,000 a month for the whole stack, approximate |
| Auth and database | Supabase: Postgres, sign-in with Google, GitHub, email and password or an email link, row-level security | One service for both |
| Content | YAML and MDX in the repo, validated with Zod | Review by pull request |
| Search | Pagefind, a static search index built at deploy | No search server |
| Email | A service with List-Unsubscribe support, such as Resend or Brevo | Pick after checking free limits and delivery to Indian inboxes; not verified |
| LLM, release 2 | Claude Haiku 5.5 (model string claude-haiku-5-5) behind /api/grade | Caps in the data model; my cost guess is ₹2,000 to ₹6,000 a month at first |
| Analytics | Plausible or PostHog | Events listed under Privacy, quality, cost and analytics |
| Tests and CI | Vitest for pure modules, Playwright for the main flow, GitHub Actions | The main flow is test, result, roadmap, stop |
| Scheduled jobs | GitHub Actions for the link check; Vercel Cron or a Supabase scheduled function for the weekly email | Email job must be safe to run twice in one week |

**Pages**

| Route | What it does | Release |
| --- | --- | --- |
| / | Landing page: the promise, a "Find my level" button, the poll, email capture | 0 |
| /how-we-rank, /disclosure, /privacy, /terms | Trust and legal pages | 0 |
| /start | Goal and weekly hours, then the test | 1 |
| /result | Saved result and next five steps, read from the device or the account | 1 |
| /roadmap/genai-engineer and /roadmap/genai-engineer/\[level\] | The nine-level path and one level's stops | 1 |
| /stop/\[id\] | Outcome, resources, and the check or project | 1 |
| /interview, /interview/\[id\], /practice | Question list, question page, practice mode with MCQs | 1 |
| /books | Books with disclosed affiliate links | 1 |
| /dashboard, /settings | Progress and account, signed in only | 1 |
| /card/\[id\] | Public level card page and image | 1 |
| /go/\[resource-id\] | Logs the click, then redirects | 1 |
| /admin | Review page for allowlisted emails | 1 |

**Server endpoints**

| Endpoint | What it does |
| --- | --- |
| POST /api/claim | Signed in: store the device's test result and progress; the server re-scores the answers with the shared module |
| POST /api/progress | Set stop status, check score or project link; record the activity day |
| POST /api/practice | Save an interview practice rating |
| POST /api/subscribe, GET /api/confirm, POST /api/unsubscribe | Double opt-in, confirmation by token, and unsubscribe |
| POST /api/card | Create or delete a level card |
| GET /api/export, DELETE /api/account | Data export and account deletion |
| POST /api/grade | Release 2: grade a typed answer; requires sign-in and enforces the daily cap |
| GET /api/cron/weekly-email | Send the weekly email; protected by a secret header; sends at most once per learner per week |

## Privacy, quality, cost and analytics

Release 1 makes no language-model calls at run time, which keeps the first months cheap. I am not a lawyer; have the privacy policy and terms reviewed before public launch. The children's-data rules are summarized in the Risks section of the idea validation doc.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| PV-1 | Collect only email, goal, weekly hours, level, progress, an optional first name for the level card, and, for a roadmap checklist download, name, email, professional experience and an optional phone number given with consent (RD-2, amended 2026-10-26 at the owner's request). No photo, government ID or precise location | The schema holds no other personal fields |
| PV-2 | Under-18 path. No account and nothing stored on the server. Analytics for signed-out visitors uses no cookies and no user identifier. Since SU-1 (2026-11-01, the owner's choice), under-18s cannot use the features that need an account; everything open to signed-out visitors stays open to them Amended 2026-11-06 at the owner's request: the sign-in form has no "I am 18 or older" tick; it says "By continuing, you confirm you are 18 or older." above every way in, and continuing records the 18+ confirmation as the tick did | Choosing "under 18" never reaches the profiles or quiz\_attempts tables |
| PV-3 | The privacy page names every processor (hosting, Supabase, email service, analytics), the purpose and retention of each data type, and how to delete data. Unconfirmed email signups are deleted after 7 days | Page exists before the first public signup; a scheduled job deletes stale rows |
| SC-1 | Secrets live only in environment settings, never in the repository | A secret scan runs in CI |
| SC-2 | Row-level security tests: a test signs in as user A and must fail to read or change user B's rows | The test runs in CI on every pull request |
| SC-3 | Status 2026-11-09: /api/subscribe does not exist (see AC-9); the other routes are rate-limited. Rate limits on /api/subscribe, /api/claim and /api/progress | More than the limit returns a 429 response |
| SC-4 | /go/\[resource-id\] redirects only to URLs that exist in the content files | A request with an unknown id returns 404, never a redirect |
| SC-5 | Release 2 grader: typed answers are passed to the model as data inside delimiters, never as instructions, and the output is checked against the score schema | A test answer containing "ignore your instructions" is scored like any other answer |
| QA-1 | Mobile first. Design at 360 pixels wide; the largest-content paint is under 2.5 seconds on a mid-range phone over 4G on the landing page, /start and stop pages | Measured with a lab test before launch |
| QA-2 | Accessibility to the WCAG 2.1 AA level on the test, result, roadmap and stop pages: keyboard use, contrast, labels, focus states | An automated check passes and one manual keyboard run is done |
| QA-3 | The test and the roadmap work without JavaScript errors on current Chrome, Safari and Firefox on phones | Playwright runs the main flow on three browser engines |
| CO-1 | Status 2026-11-09: built for every AI feature, not just the grader; the daily limits per feature and tier now live in src/lib/billing/plans.ts (PAY-1). Release 2 model spend has a monthly cap set in settings, a per-learner daily cap of 5 grades, and a kill switch. Every call writes tokens to ai\_usage | At the cap the grader returns a friendly "try tomorrow" message |

| Event | When it fires | Properties |
| --- | --- | --- |
| poll\_answered | The landing poll is answered | choice: overload, tutorial\_hell, interview\_prep, trust, non\_engineer, whats\_next, other |
| quiz\_started | The test begins | goal, weekly\_hours |
| quiz\_question\_answered | Each answer | question\_id, level, correct, dont\_know. No user id; feeds PL-7 |
| quiz\_completed | The result shows | passed\_level, start\_level, gap\_count, duration\_seconds |
| signup\_started, signup\_completed | Email sign-in or email list | source page |
| roadmap\_viewed, stop\_viewed | A page is opened | level, stop\_id |
| resource\_clicked | /go runs | resource\_id, cost, affiliate |
| stop\_done, check\_taken | Progress changes | stop\_id, how, score |
| interview\_question\_viewed, practice\_rated | Interview use | question\_id, rating |
| card\_created, email\_confirmed, unsubscribed | Retention steps | none |

The finish rate of the test comes from these events. The 7-day return rate comes from activity\_days for signed-in learners, because cookie-free analytics cannot follow a visitor across days, so that metric counts only learners who signed in.

## Voice interview simulator, release 3

Release 3 adds a voice agent that interviews the learner and sends a written report. It comes later because every minute of voice costs money, and its quality depends on the question bank and rubrics that releases 1 and 2 build.

**Flow**

1. The learner picks the role, a level from B1 to P3, and a length of 5, 10 or 20 questions, and consents to voice processing.
2. The agent asks one question at a time from the interview bank at or near that level, then at most one follow-up chosen from the record's follow-ups, based on the answer.
3. The learner answers aloud. The agent does not coach during the interview.
4. After the session the learner gets a report: a score from 0 to 5 per question against the rubric, what the answer covered and missed, an outline of a stronger answer, delivery notes (length, filler words, pace, computed from the transcript), the top three things to fix, and links to the roadmap stops and practice questions for each gap, plus interview tips for the role.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| VS-1 | Add a rubric to each interview record: 3 or more key points a strong answer must contain, reviewed by a person | No question is used by the simulator without a reviewed rubric |
| VS-2 | Explicit consent before the first recording. Store the transcript and scores, not the audio, by default. The learner can delete a session. Retention period is set after legal review | A delete removes the transcript and report in the same request |
| VS-3 | Cost control. Measure the cost of a 10-minute session before launch, set the free sessions per month from that figure, and add a hard monthly cap and a kill switch | The cost per session is written down before any public release |
| VS-4 | Accent test. Run the speech-to-text on at least 20 recordings of Indian-accented English from different regions and record the word error rate. Offer a typed-answer fallback | Results are recorded; the fallback works if recognition is poor |
| VS-5 | Report quality. A person reads at least 20 reports and marks wrong or unfair feedback. My target is under 10% marked | The review is logged before release |
| VS-6 | The agent replies within about 2 seconds of the learner stopping (my target) | Measured on a mid-range phone over 4G |
| VS-7 | Vendor choice. Compare a pipeline of speech-to-text, a model and text-to-speech against a single real-time voice service on cost, Indian-accent accuracy and latency | I have not checked any vendor's price or quality; this is a test to run, not a decision |

Until then, release 2's typed-answer grader gives learners most of the feedback loop at a fraction of the cost.

## Build plan for Claude Code

How to use this PRD: export it as Markdown into the repository as docs/PRD.md, put the CLAUDE.md below at the repository root, and give Claude Code one slice at a time. For each slice, start in plan mode, name the requirement IDs, and ask for tests that prove each acceptance criterion. Commit per requirement ID and run the checks before moving on.

```markdown
# Xplaind

Free-first AI learning path for India. Read docs/PRD.md before changing anything. Requirement IDs (PL-1, RM-2 and so on) are the spec.

## Stack
Next.js App Router, TypeScript strict, Tailwind, Supabase (Postgres, auth with Google, GitHub, email and password or an email link, row-level security), Zod, Vitest, Playwright, GitHub Actions.

## Rules
- Editorial content is files under content/, validated by Zod with `npm run content:validate`. Never store editorial content in the database.
- User tables follow the SQL in the PRD data model. Every table has row-level security and a test for it.
- Placement scoring and next-five-steps are pure functions with unit tests and no database or UI imports.
- Code that ranks or orders resources must never read affiliate or commission fields (ED-2). Keep the test.
- Release 1 makes no language-model calls at run time.
- Never show a price without its check date (RM-6).
- No ads, no sponsored placement, no tracking scripts beyond the analytics chosen in the PRD.
- Under-18 learners get no account and nothing stored on the server (PV-2).
- Mobile first at 360 px wide. WCAG 2.1 AA on test, result, roadmap and stop pages.
- Weeks and dates use Asia/Kolkata.
- Commit messages start with the requirement ID.
- Before finishing a slice run lint, typecheck, tests and content:validate.
- If the PRD is ambiguous or two requirements conflict, stop and ask. Do not guess.
```

Release 0 needs no slice. Publish a one-page landing page with a hosted signup form and a hosted poll from your email service, plus plain privacy and disclosure pages. Slice S7 replaces the hosted pieces with the built versions.

| Slice | Covers | Done when | Starter prompt |
| --- | --- | --- | --- |
| S0 Scaffold, days 1 to 2 | SC-1, QA-3 setup | CI is green and an empty homepage is on a preview URL | "Read docs/PRD.md and CLAUDE.md. Scaffold the repo as the Architecture section describes, with Vitest, Playwright and a CI workflow running lint, typecheck, tests and a secret scan. Add .env.example. No features. Stop when CI is green." |
| S1 Content pipeline, weeks 1 to 2 | ED-1, ED-4, ED-8, the content schemas | content:validate fails on every deliberately broken fixture; sample stops render as static pages | "Implement the content schemas from the Data model section, loaders, and content:validate with failing fixtures. Add sample content for B1 and B2: 3 stops and 6 resources. Render stops from MDX." |
| S2 Placement test, weeks 2 to 3 | PL-1 to PL-6 | The PL-3 test cases pass; a 12-question run works at 360 px with no sign-up | "Implement PL-1 to PL-6. Write the scoring module first with at least 8 unit tests, then the /start and /result pages. Save the result in the browser only." |
| S3 Roadmap and stops, weeks 3 to 4 | RM-1 to RM-9, ED-2 | All nine levels render from sample content; the RM-3 tests pass; /go returns 404 for an unknown id | "Implement RM-1 to RM-9, including the next-five-steps function with tests, resource cards, cost labels and the /go route with the resource\_clicks table." |
| S4 Interview, MCQ and books, weeks 3 to 5 | IQ-1 to IQ-6, BK-1 to BK-3, ED-9 | 40 sample questions load; unreviewed records fail validation; pages are in the sitemap | "Implement IQ-1 to IQ-6 and BK-1 to BK-3. Practice ratings are saved in the browser until sign-in exists." |
| S5 Accounts and progress, weeks 4 to 6 | AC-1 to AC-7, AC-11, SC-2, SC-3, PV-1, PV-2 | RLS tests pass; a signed-out result is claimed after sign-in; deleting an account removes its rows | "Create the Supabase migrations from the SQL in the PRD with row-level security and tests. Implement sign-in with the 18+ tick, /api/claim, /api/progress, the dashboard, the weekly streak, level badges, level cards and settings." |
| S6 Link checker and review page, weeks 5 to 6 | ED-5 to ED-7 | The fixture test reports broken 1 and unknown 1; /admin returns 404 for anyone not on the allowlist | "Write scripts/check-links.ts with the status rules in ED-5 and tests, a weekly GitHub Action that commits data/link-status.json and opens an issue, and the read-only /admin queue." |
| S7 Landing, email and legal, weeks 6 to 7 | AC-8 to AC-10, PV-3, ED-3, analytics events, SEO | A test signup is confirmed and gets the weekly email once; every event in the analytics table fires | "Build the landing page with the poll, double opt-in, the weekly email job, the trust and legal pages as drafts for legal review, the analytics events, sitemap and metadata." |
| S8 Hardening and launch, week 8 | QA-1 to QA-3, SC-4, PL-7 | The release 1 checklist is fully ticked; the 50-tester item review is done | "Run an accessibility and performance pass, review every route for the security rules, load-test /api/claim, and produce the launch checklist from this PRD." |

Release 2 slices, in order: typed-answer grader (IQ-7, SC-5, CO-1), spaced repetition (IQ-8), re-test (PL-8), the second goal, and the weekly email news item.

**Content work, which is the real bottleneck**

| Item | Release 1 target | Who | Weeks |
| --- | --- | --- | --- |
| Level can-do sentences | 9, from the Placement test section | You review | 1 |
| Placement questions | 54 (6 per level) | AI draft, you review | 1 to 3 |
| Stops | 45 (5 per level) | You | 2 to 5 |
| Resources, each opened and confirmed | 150 | You | 1 to 6 |
| Check MCQs | 135 (3 per stop) | AI draft, you review | 3 to 6 |
| Interview questions | 100, with 40 by week 4 | AI draft, you review | 3 to 7 |
| Books | 20 | You | 5 |
| Own short lessons | 10 of five minutes, optional | You | 4 to 7 |

That is roughly 500 reviewed items in eight weeks for one person, so decide the cut order now. If you fall behind, cut in this order: own short lessons, books, interview questions down to 60, then check MCQs down to 2 per stop. Do not cut resource verification or the placement questions.

## Risks and decisions for you

The biggest risk is not code: it is about 520 reviewed content items and a placement test no one has tested yet.

| Risk | Why it matters | Mitigation in this PRD |
| --- | --- | --- |
| Content effort | One person reviewing about 520 items in 8 weeks may ship late or thin | The cut order under Build plan; AI drafts with human review; the landing page ships first |
| Placement test accuracy | Home-written questions can put people at the wrong level and spoil the first impression | PL-7 item review, a 50-tester soft launch, a 70% "feels right" target |
| Wrong or stale content | A wrong interview answer or a dead link costs trust, which is the product's promise | IQ-6, ED-5, ED-6, RM-6 |
| roadmap.sh already personalizes | A quiz and personal roadmap alone will not win people over | India context, rupee prices, an exact resource per step, interview practice, non-engineers; the landing poll tests which gap matters most |
| Search traffic | The idea validation doc found AI answers cutting clicks to pages like these | Distribute through your videos and the email list; treat search as a bonus |
| Affiliate links versus "no sponsored content" | Learners may doubt the ranking | ED-2, ED-3, visible labels, a test that ranking ignores commission |
| Children's data | India's data protection rules need verifiable parental consent for under-18 data | PV-2: no accounts or server storage for under-18s; legal review |
| Bots blocked by course sites | False "broken link" alerts | ED-5 separates broken from unknown |
| Voice cost and accent accuracy | Cost per session and poor recognition of Indian accents could sink release 3 | VS-3, VS-4, VS-7 tested before launch |
| Another unused project | You have bought domains you did not use | Landing page live within 7 days; the day-90 review |

| Decision | My default | Needed by |
| --- | --- | --- |
| Confirm GenAI Engineer as the first goal | Yes | Before S2 |
| Who reviews content | You, plus one or two friends who work in AI | Week 1 |
| Weekly email day and time | Saturday morning, India time (my guess) | S7 |
| Email service | Pick after checking free limits and delivery to Indian inboxes | S7 |
| WhatsApp | A public Channel link only in release 1 | S7 |
| Logo and trademark search for Xplaind | Run the IP India search before launch | Before public launch |
| Legal review of privacy policy and terms | A lawyer reviews the drafts | Before public launch |
| Monthly spend cap for release 2 model calls | Not set | Before release 2 |
| Paid tier: price and what it includes | Decided 2026-11-08: Pro passes, see PAY-1 to PAY-6 | Release 2 |
| Domain | xplaind.ai is bought. Turn on auto-renew and two-factor sign-in, and note the renewal date and price; .ai renewals can cost more than .com, which I have not checked | Now |

## Sources and limits

Pages opened for the evidence in this PRD: [r/learnmachinelearning roadmap thread](https://reddit.sentinel-team.org/posts/1t5hza4/snapshots/2026-05-09T01%3A10%3A29.64383Z), [r/learnmachinelearning beginner thread](https://reddit.sentinel-team.org/posts/1t5zq5u/snapshots/2026-05-09T01%3A10%3A29.64383Z), [r/ArtificialInteligence thread](https://reddit.sentinel-team.org/posts/1qutafg/snapshots/2026-02-03T22%3A20%3A10.39207Z), [r/LLMDevs interview handbook thread](https://reddit.sentinel-team.org/posts/1sn7hc8/snapshots/2026-04-17T05%3A37%3A44.74927Z), [r/IndiaCareers thread](https://reddit.sentinel-team.org/posts/1slz43x/snapshots/2026-04-16T02%3A51%3A06.14174Z), [Ask HN: How to Learn LLM Fundamentals](https://news.ycombinator.com/item?id=35368176), [Ask HN: I'm getting overwhelmed by AI](https://news.ycombinator.com/item?id=40579867), the [roadmap.sh changelog](https://roadmap.sh/changelog), [Tian Pan on AI training](https://tianpan.co/blog/2026/05/05/ai-engineering-training-programs-perpetually-behind), and the [Docebo report](https://www.businesswire.com/news/home/20260407928752/en/Docebo-Releases-The-AI-Readiness-Gap-The-2026-Enterprise-Learning-Wake-Up-Call-Report). Market, hiring, traffic, competitor and course-catalog evidence is in the idea validation doc, filed under the earlier name One Stop AI Guide.

Limits:

- Reddit posts were read as snapshots on a third-party mirror, with 4 to 26 comments each. On X, search gave titles only, so X is not evidence here.
- The stack, tools and prices are my recommendations from general knowledge. I did not check current versions, free limits or pricing for any service.
- The nine level definitions, hours, pass thresholds and every target marked as mine are my judgment and need testing with real learners.
- Seed resources marked "third-party report only" or "not checked" must be opened and confirmed before they are listed.
- The Belgian gamification study and the children's-data rules are cited from the validation doc and were not reopened for this PRD.
- This is not legal advice; a lawyer should review the privacy policy, terms and the under-18 approach before launch.
