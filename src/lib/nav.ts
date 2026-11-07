// NV-1 and NV-2: the main menu's groups and "you are here". No imports, so it is safe anywhere.

type Item = { href: string; label: string; note: string };
type Group = { id: string; label: string; items: Item[] };

/** NV-1: the main menu, grouped by what the visitor wants to do. */
export const NAV_GROUPS: Group[] = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { href: "/paths", label: "Roadmaps", note: "A step-by-step path for each AI role" },
      { href: "/library", label: "Library", note: "Every lesson, video and skill" },
      { href: "/topics", label: "Topics", note: "Lessons grouped by subject" },
      { href: "/videos", label: "Videos", note: "Filter by topic" },
      { href: "/projects", label: "Projects", note: "Guided builds for your portfolio" },
      { href: "/glossary", label: "Glossary", note: "AI words in plain English" },
      { href: "/papers", label: "Papers and free books", note: "Landmark research and free AI books" },
    ],
  },
  {
    id: "practice",
    label: "Practice",
    items: [
      { href: "/practice", label: "Practice cards", note: "Flashcards for interview questions" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser" },
      { href: "/plan", label: "Weekly plan", note: "This week's lessons for your hours" },
    ],
  },
  {
    // IP-3, 7 Nov 2026: interview prep gets its own menu, the AlgoMaster-style spine of the site.
    id: "interview",
    label: "Interview",
    items: [
      { href: "/interview/patterns", label: "Interview patterns", note: "The ideas AI interviews are built on" },
      { href: "/interview/design", label: "System design answers", note: "Worked LLM designs, step by step" },
      { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report" },
      { href: "/interview/answers", label: "Interview Q&A", note: "Every question and answer, by role" },
      { href: "/interview", label: "Question bank", note: "Every question, by topic and role" },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      { href: "/jobs", label: "Jobs and salaries", note: "Pay by role, skills and live openings" },
      { href: "/ai/resume", label: "Resume review", note: "Fixes that get you shortlisted" },
    ],
  },
  {
    // 2026-11-06, owner request: each AI tool in a dropdown, straight to its own page.
    id: "ai",
    label: "AI tools",
    items: [
      { href: "/ai/book", label: "Study from my notes & books", note: "Turn a PDF into a test and flashcards" },
      { href: "/ai/tutor", label: "AI tutor", note: "Ask anything about AI, in plain English" },
      { href: "/ai/roadmap", label: "AI roadmap generator", note: "A plan for your goal and hours" },
      { href: "/ai", label: "All AI tools and guides", note: "Every tool, plus guides to AI at work" },
    ],
  },
];
export const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Which group the current page belongs to, so the menu can say "you are here". Pure, for tests. */
export function activeGroup(path: string): string | null {
  if (under(path, "/ai/resume")) return "career";
  if (under(path, "/ai")) return "ai";
  if (under(path, "/roadmap") || under(path, "/stop") || under(path, "/start") || under(path, "/resources")) return "learn";
  if (under(path, "/interview")) return "interview";
  for (const g of NAV_GROUPS) if (g.items.some((i) => under(path, i.href))) return g.id;
  return null;
}

