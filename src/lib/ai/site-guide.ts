// FOCUS-2 (2026-11-12): how to use the site, for the AI tutor, which took over X Bot's job of
// helping learners find their way. Interface help, not editorial content: each entry names a page.

export type GuideEntry = { t: string; a: string; h: string };

export const SITE_GUIDE: GuideEntry[] = [
  {
    t: "Where should I start?",
    a: "Pick the job you want on the Roadmaps page and open its roadmap. If you already know some AI, take the 10-minute level test first: it skips what you know and gives you the next five steps.",
    h: "/paths",
  },
  {
    t: "Find my level with the placement test",
    a: "The level test takes about 10 minutes, needs no sign-up, and places you on a roadmap so you skip topics you already know.",
    h: "/start",
  },
  {
    t: "How do I mark a topic done, learning or skipped?",
    a: "On a roadmap, tap Mark on a topic card and choose Learning, Done or Skip. You can also do it at the top of every lesson. Tap the active choice again to put it back to to do.",
    h: "/paths",
  },
  {
    t: "Where do I see my progress and streak?",
    a: "Your dashboard shows your streak and what you have finished. It is saved in this browser; sign in to keep it across devices.",
    h: "/dashboard",
  },
  {
    t: "Practice a mock interview out loud",
    a: "The mock interview asks real AI interview questions against the clock. Answer out loud or type, then get a report on what you covered, what you missed and how well you know each concept.",
    h: "/interview/simulator",
  },
  {
    t: "Browse interview questions with model answers",
    a: "The interview question bank has questions by topic and role, each with a short answer, a deeper answer and the lesson to revise.",
    h: "/interview",
  },
  {
    t: "Revise with interview flashcards",
    a: "Practice turns interview questions into flashcards. Questions you miss come back first.",
    h: "/practice",
  },
  {
    t: "Build a portfolio project",
    a: "Every roadmap stage ends in a guided project: step-by-step instructions, hints and a rubric to check your work before you share it.",
    h: "/projects",
  },
  {
    t: "Find the best course for a topic",
    a: "Each lesson names the one course we think teaches it best, with why. The Courses page lists them all. Paid ones show the price and the date we checked it.",
    h: "/resources",
  },
  {
    t: "Earn an AI certification",
    a: "The Certifications page lists AI certifications worth having, what each costs and how to prepare.",
    h: "/certifications",
  },
  {
    t: "Look up an AI word in the glossary",
    a: "The glossary explains every AI term on the site in plain English, with the lessons that use it.",
    h: "/glossary",
  },
  {
    t: "Browse lessons by topic",
    a: "Topics groups every lesson by subject, such as RAG, agents, evals or Python, whichever roadmap it belongs to.",
    h: "/topics",
  },
  {
    t: "Test yourself on your own book",
    a: "Study from my notes & books turns your PDF, Word file or notes into a timed MCQ test or a deck of flashcards. Choose chapters, difficulty, number of questions and time; the report quotes the page for each answer and says what to reread.",
    h: "/ai/book",
  },
  {
    t: "Use the AI tools",
    a: "Anyone can generate a personal roadmap, ask the AI tutor (on its own page or inside every lesson), and get AI feedback on interview answers, within a small daily allowance. No account needed.",
    h: "/ai",
  },
  {
    t: "Do I need an account?",
    a: "Lessons, topics, practice and guides work without an account, and progress is saved in your browser. Sign up to see the full roadmaps, keep progress across devices and use the AI tools. Learners under 18 use the lessons without an account.",
    h: "/signin",
  },
  {
    t: "How do you choose which courses to recommend?",
    a: "We rank courses on how well they teach the topic, never on commission, and we show every price with the date we checked it.",
    h: "/how-we-rank",
  },
  {
    t: "Read guides and articles",
    a: "The blog has longer guides on careers in AI, how to choose a path and how to prepare for interviews.",
    h: "/blog",
  },
  {
    t: "Change settings or delete my data",
    a: "Settings lets you manage your account and export or delete what is stored.",
    h: "/settings",
  },
  {
    t: "Stay on track each week",
    a: "Stay on track gives you this week's lessons for your hours, a Monday calendar reminder, and, with an account, one progress email every Monday for 13 weeks.",
    h: "/plan",
  },
];

/** One line per page for the tutor's prompt: "path | what it is for". */
export const siteGuideText = (guide: GuideEntry[] = SITE_GUIDE) => guide.map((g) => `${g.h} | ${g.t}`).join("\n");
