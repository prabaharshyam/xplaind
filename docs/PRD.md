# Xplaind: product requirements

Oct 25, 2026 · Shyam Prabahar

This PRD specifies release 1 of Xplaind (xplaind.ai) for building with Claude Code: a free-first AI learning path for Indians, where a short test places each learner on a nine-level ladder and then shows the next five steps, each with the best free or low-cost course. Requirement IDs such as PL-1 and RM-2 tie every requirement to a build slice.

Release 1 is about eight weeks of work, and a one-week landing page (release 0) goes live first. The voice interview simulator is release 3, not release 1.

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
| PL-7 | Item review. A query lists questions answered correctly by more than 90% or less than 10% of takers | Used after the 50-tester soft launch to retune questions and thresholds |
| PL-8 | Re-test (release 2). After 30 days offer a new test; keep every attempt and show the level over time | Earlier attempts are never overwritten |

## Roadmap engine and resources

The structure is goal, then levels, then stops, then resources. A stop is one learnable outcome that takes 1 to 6 hours and ends in a check or a project. Release 1 needs at least 5 stops per level (45 in all) and about 150 resources, roughly 3 per stop.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| RM-1 | Roadmap page. Show the nine levels as a path, mark the learner's start level, and tick completed stops. It works signed out from the saved result | Renders from content files with no database call when signed out |
| RM-2 | Stop page. Show the outcome in one sentence, why it matters (60 words or fewer), estimated hours, one primary resource, up to two alternates, and a check or project | Content validation fails if a stop has no primary resource or no check |
| RM-3 | Next-five-steps card. List the next five incomplete stops from the start level, with up to two review stops for the learner's gaps first. Show it on the result page, the dashboard and the weekly email | A pure function with tests: start level, gap tags and completed stops in, an ordered list of five out |
| RM-4 | Resource card. Show provider, title, cost label, hours, language, certificate yes or no, level, last-verified date, link-check date, "why we picked it", and an affiliate label when it applies | Every field renders; a missing last-verified date fails validation |
| RM-5 | Outbound route /go/\[resource-id\]. Log the click (resource, stop, level, no personal data), then redirect. Add an affiliate tag only when the resource is marked affiliate, and always show the label on the card | Works with JavaScript off; the log holds no email or IP address |
| RM-6 | Cost labels: "Free"; "Free to learn, paid certificate"; or a price in rupees with "price checked on \[date\]". If the price date is over 60 days old, show "price may have changed" | A price is never shown without its check date |
| RM-7 | Completion. A stop is done when the learner passes its check (70% or more), submits a project link, or marks it done with one tap (recorded as self-marked). Release 1 trusts self-reports | Three states: not started, in progress, done. Self-marked stops are counted separately from checked ones and do not earn level badges |
| RM-8 | "I already know this". The learner can skip a stop. It counts as done, is flagged as self-skipped, and the re-test can contradict it | Skipped stops are counted separately in analytics |
| RM-9 | Preference toggle "Free only". When on, paid resources move below free alternates and are not the primary | The toggle persists for signed-in learners |

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
| IQ-7a | Mock interview review (added 2026-10-27 at the owner's request). Every answer in a mock interview is analysed in the browser without a model: key points covered with the learner's own words as evidence, closeness to the reference answer, structure (definition, example, trade-off, real use), an understanding score per answer and per concept, and lessons to revisit. Signed-in learners can add one AI review of the whole interview that grades every answer for meaning, lists what was right, wrong and missing, and sums up strengths, gaps and next steps. Daily cap of 3 reviews, answers treated as data | The report shows understanding per answer and per concept with no model call; the AI review is one call per interview and respects the caps |
| IQ-8 | Release 2: spaced repetition. Questions rated "partly" or "missed" return after 1, 3, 7 and 21 days | The practice queue is ordered by due date |

**Books**

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| BK-1 | A books page with about 20 books by level: title, author, why it is worth reading, level, and a buy link on Amazon India | Each book has a why-it-helps line of 40 words or fewer |
| BK-2 | Affiliate links carry a visible "we earn a commission" label and a sitewide disclosure page. Commission never changes order | The sort function does not read the affiliate field; a test enforces it |
| BK-3 | Link to a free PDF only when the author or publisher hosts it | Validation requires a hosted\_by field for any PDF link |

The Amazon India commission rate is unconfirmed: a 2026 guide I found said about 4% and older sources said 10%, so treat books as a trust feature first and an income line second.

## Accounts, progress and messages

Keep gamification light. In a Belgian study of 6,592 adults, which the idea validation doc cites, gamification added only 1.6 percentage points to course completion, so the main pull must be a clear next step. The streak counts weeks, not days, because the target learner has 3 to 8 hours a week and a daily streak would punish a part-time learner.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| AC-1 | Sign-in by email link only, no passwords. Before sending the link, the learner ticks "I am 18 or older" | No link is sent without the tick; the tick is stored with a timestamp |
| AC-2 | Claim. On first sign-in, attach the device's saved test result and progress to the account | A learner who tested signed out sees the same result after signing in |
| AC-3 | Dashboard: current level, next five steps, progress across the nine levels, weekly streak, weekly-hours goal, and a re-test link | Loads in under 2 seconds on a mid-range phone over 4G |
| AC-4 | Progress rows per stop: status, check score, project link, timestamps. Any change records an activity day | Rows are readable and writable only by their owner |
| AC-5 | Weekly streak. A week (Monday to Sunday, India time) counts when the learner marks a stop done, passes a check or finishes a practice set | The streak resets after one empty week, not before |
| AC-6 | Badges in release 1: one per level passed. First-project and 4-week-streak badges come in release 2 | A badge appears only after the passing rule in PL-3 or RM-7 |
| AC-7 | Level card: an image of 1200 by 630 pixels showing level, goal, weeks active and the site URL, with an optional first name. Sharing is opt-in and the link is unguessable | The card holds no email, photo or exact dates; the learner can delete it |
| AC-8 | Weekly email on a fixed weekday and time chosen by you: the next step, a progress line, and an unsubscribe link, plus the List-Unsubscribe header. Sent only to learners who gave consent | An unsubscribe takes effect before the next send |
| AC-9 | Landing and in-app email capture uses double opt-in. Store the consent text shown, the timestamp and the source page | A row exists for every sent email address, with consent evidence |
| AC-10 | WhatsApp in release 1 is a link to a public WhatsApp Channel. No phone numbers are collected. Direct messages to individuals need the WhatsApp Business API and are a release 2 decision | No phone field exists in release 1; I have not checked current WhatsApp Business API pricing |
| AC-11 | Settings: delete account and export my data as JSON | Deletion removes the learner's rows in the same request |

## Editorial rules, link checks and admin

Build decision: editorial content (levels, stops, resources, questions, books, lessons) lives in the git repository as YAML and MDX files, and the site is built from them. Link-check results live in a file the weekly job commits. Only user data lives in the database. This gives version history, review by pull request and cheap static pages that search engines can read, and it means no admin forms to build in release 1.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| ED-1 | A primary pick comes from the official provider or a creator with clear credentials, was updated or confirmed current in the last 12 months, fits the level without a prerequisite jump, includes hands-on work, and is free or within the price cap (about ₹400 typical, hard cap about 10 US dollars) | Validation rejects a paid resource above the cap unless exception\_reason is filled in |
| ED-2 | Ranking uses an editor score from 0 to 5 (fit, quality, currency, hands-on, cost) stored in the file. No code that picks or orders resources reads the affiliate or commission fields | A test fails if any ranking function imports those fields |
| ED-3 | A "How we rank" page lists these rules, how often links are checked, how the site earns money, that no one can pay for placement, and how to report a wrong link. Every resource card links to it | Page exists and is linked from the footer and each card |
| ED-4 | Every resource has why\_picked, last\_verified (the date an editor opened it and confirmed access and price) and verified\_by | Validation fails on a missing field |
| ED-5 | Weekly link check, run by a scheduled GitHub Action. A status of 2xx or 3xx is ok; 404 or 410 is broken; 403, 429, 5xx or a timeout is unknown, because many sites block bots, and unknown is not shown to users as broken. Three unknown results in a row go to the review queue. The job writes data/link-status.json and opens an issue listing broken items | A test with one 404 fixture and one 403 fixture reports broken 1 and unknown 1 |
| ED-6 | Freshness. An item last verified over 90 days ago enters the review queue; over 180 days shows a "needs re-check" badge on the card | Dates are computed from last\_verified, not file modified time |
| ED-7 | Review page at /admin, open only to emails in an allowlist setting. It lists broken and unknown links, stale items, expired prices and unreviewed questions, each with a link to the file on GitHub. Read-only in release 1 | Anyone not on the allowlist gets a 404 |
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
```

## Architecture, pages and API

A Next.js site renders static pages from content files, a small server layer handles the test claim, progress and email, and Supabase holds user data. The stack below is my recommendation; versions and prices were not checked, so confirm them at build time.

&#91;embedded content: architecture · 7 parts, 6 links\]

Content reaches the site only through the build. User data reaches the database only through server routes or row-level-security policies. The test runs in the browser using the shared scoring module, and the server re-scores the answers when a learner signs in. Answers ship to the browser, which is acceptable because the test has no stakes.

| Layer | Choice | Note |
| --- | --- | --- |
| Framework | Next.js App Router, TypeScript strict, Tailwind CSS | Static generation for content pages |
| Hosting | Vercel or Cloudflare Pages | Free tier to start; the idea validation doc estimates ₹2,000 to ₹10,000 a month for the whole stack, approximate |
| Auth and database | Supabase: Postgres, email-link sign-in, row-level security | One service for both |
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
| PV-1 | Collect only email, goal, weekly hours, level, progress and an optional first name for the level card. No phone number, photo, government ID or precise location | The schema holds no other personal fields |
| PV-2 | Under-18 path. No account and nothing stored on the server. Analytics for signed-out visitors uses no cookies and no user identifier | Choosing "under 18" never reaches the profiles or quiz\_attempts tables |
| PV-3 | The privacy page names every processor (hosting, Supabase, email service, analytics), the purpose and retention of each data type, and how to delete data. Unconfirmed email signups are deleted after 7 days | Page exists before the first public signup; a scheduled job deletes stale rows |
| SC-1 | Secrets live only in environment settings, never in the repository | A secret scan runs in CI |
| SC-2 | Row-level security tests: a test signs in as user A and must fail to read or change user B's rows | The test runs in CI on every pull request |
| SC-3 | Rate limits on /api/subscribe, /api/claim and /api/progress | More than the limit returns a 429 response |
| SC-4 | /go/\[resource-id\] redirects only to URLs that exist in the content files | A request with an unknown id returns 404, never a redirect |
| SC-5 | Release 2 grader: typed answers are passed to the model as data inside delimiters, never as instructions, and the output is checked against the score schema | A test answer containing "ignore your instructions" is scored like any other answer |
| QA-1 | Mobile first. Design at 360 pixels wide; the largest-content paint is under 2.5 seconds on a mid-range phone over 4G on the landing page, /start and stop pages | Measured with a lab test before launch |
| QA-2 | Accessibility to the WCAG 2.1 AA level on the test, result, roadmap and stop pages: keyboard use, contrast, labels, focus states | An automated check passes and one manual keyboard run is done |
| QA-3 | The test and the roadmap work without JavaScript errors on current Chrome, Safari and Firefox on phones | Playwright runs the main flow on three browser engines |
| CO-1 | Release 2 model spend has a monthly cap set in settings, a per-learner daily cap of 5 grades, and a kill switch. Every call writes tokens to ai\_usage | At the cap the grader returns a friendly "try tomorrow" message |

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
Next.js App Router, TypeScript strict, Tailwind, Supabase (Postgres, email-link auth, row-level security), Zod, Vitest, Playwright, GitHub Actions.

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
| Paid tier: price and what it includes | Decide after the day-90 review | Release 2 |
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
