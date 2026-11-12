# Ideas for "Study from my notes & books", from studying StudyFetch

Researched 11 Nov 2026 at the owner's request, from studyfetch.com's home page, features menu and feature section. StudyFetch is a US study app (founded 2023, claims 8M+ users) that turns uploaded course material into many study formats around one AI tutor called Sparky. Ideas 1 to 3 (the study loop) were built on 12 Nov 2026 as MB-8 to MB-10, with missed questions turned into review cards; the rest are proposals for the owner to choose from.

## What we have today

Xplaind's tool reads a PDF or Word file in the browser (never stored) and makes:
- a timed multiple-choice test with a report that names pages to reread, or
- a flashcard deck.

Every answer cites its page.

Our two edges over StudyFetch are worth keeping: the file never leaves the device, and every item quotes its page.

## What StudyFetch offers, mapped to us

| StudyFetch feature | What it does | Do we have it? |
| --- | --- | --- |
| Flashcards | Cards generated from your material | Yes |
| QuizFetch, Practice Tests | Auto-generated quizzes and full-length timed exams | Yes (MCQ test) |
| Exam-Specific Questions | Practice in real exam formats | No |
| Tutor Me / Sparky | 24/7 chat tutor that knows your material | Partly: our AI tutor knows our lessons, not your file |
| Notes | Turns PDFs, slides and videos into structured notes | No |
| Study Plan, Calendar | A schedule from your deadlines, with a cram mode | Partly: weekly plan for roadmaps only |
| Audio Recap | Listen to summaries | No |
| Explainer Video, Sparky Visuals | Generated videos and visual explanations | No |
| Arcade | Turns material into games, such as matching | No |
| Record Lecture | Records a class and writes notes live | No |
| Citations | Every generated item links to its source | Yes, by page |
| Inputs: slides, images, YouTube, lecture audio | Many file types | PDF and Word only |

## Recommended additions, in priority order

Each idea notes its cost to run, because every AI call costs money and AI needs an account (AG-1).

### P1: high value, cheap to build

1. **Ask your notes (chat).** A chat box that answers only from the uploaded file, quoting pages, and says "not in your notes" when it isn't there.
   - **How:** reuse the excerpt picker in `src/lib/book/chunk.ts` to send the few most relevant passages to the tutor endpoint.
   - **Cost:** one AI call per question, inside the daily limits.
   - This is StudyFetch's core feature, and the most-asked one in study apps.

2. **Spaced repetition for decks.**
   - Saved decks bring back the cards you got wrong and show "12 cards due today", like our practice cards already do.
   - **Cost:** none; it runs in the browser and builds on the practice-card scheduler.

3. **"Test me on what I missed".**
   - One button on the report makes a new test from only the sections you scored low on.
   - **Cost:** one AI call. It closes the learning loop in a single tap.

4. **Indian exam formats.**
   - Question styles: assertion–reason, match the following, fill in the blank, 2-mark and 5-mark short answers (graded against a model answer with the existing grader), and negative marking.
   - **Why:** this is our clearest edge over a US product, since school boards, university exams, GATE-style and campus tests all use these styles.

5. **Chapter summaries ("Smart notes").**
   - A one-page summary per chapter, with key terms and page links, kept on the device.
   - **Cost:** one AI call per chapter, generated only on request.

### P2: delight and stickiness

6. **Listen to a recap.** Read a chapter summary or the deck aloud with the browser's built-in voice (Indian English voices exist on most phones). No AI cost; good for commutes.
7. **Match game.** A timed "match the term to its meaning" game built from any deck. Browser-only, no AI cost, and it covers StudyFetch's Arcade.
8. **Exam-date study plan.** Enter the exam date and the chapters you have, and get a day-by-day plan with a calendar file (reuse the weekly plan's calendar export). Add a cram mode for the last 3 days that puts weak chapters first.
9. **Photos of handwritten notes.** Read phone photos and scanned pages with in-browser OCR, so nothing is uploaded. Many students in India study from notebooks and photocopies.
10. **Progress per file.** A small dashboard for each book: chapters covered, average score and cards due. It gives a reason to come back daily.

### P3: later, costly or needs policy decisions

11. **YouTube lecture to notes.** Paste a lecture link and make a test from its transcript. This needs a server fetch, which takes the "never leaves your device" promise off the table for this input.
12. **Record a class.** Live lecture notes need audio capture and speech-to-text. The run cost is high and so is the privacy weight; most Indian classrooms wouldn't allow recording either.
13. **Hindi and regional languages.** Questions and summaries in Hindi or Tamil for vernacular-medium students. High value, but every prompt and check needs native review.
14. **Explainer videos and visuals.** These cost the most to generate. The flow diagrams the lessons already use are a cheaper version.

## What not to copy

- **Unverifiable outcome claims** such as "92% improved grades". Xplaind's rule is no claims we can't back.
- **Storing users' files on a server.** Our "read on your device" is a trust advantage. Keep anything that needs the server, such as YouTube, as opt-in and clearly labelled.
- **A playful mascot as the tutor's face.** We already have X Bot. Keep one character, not two.

## Suggested first slice (built 2026-11-12 as MB-8 to MB-10)

Build ideas 1 to 3 together as "Study loop": ask your notes, then test, then retest what you missed, with spaced repetition in between. They share the excerpt picker and report code, need only the existing tutor and test endpoints, and turn a one-off test into a daily habit.
