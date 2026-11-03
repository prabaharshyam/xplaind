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
      { href: "/videos", label: "Videos", note: "Hand-picked AI channels" },
      { href: "/projects", label: "Projects", note: "Guided builds for your portfolio" },
      { href: "/glossary", label: "Glossary", note: "AI words in plain English" },
    ],
  },
  {
    id: "practise",
    label: "Practise",
    items: [
      { href: "/practice", label: "Practice cards", note: "Flashcards for interview questions" },
      { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report" },
      { href: "/interview/answers", label: "Interview Q&A", note: "Every question and answer, by role" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser" },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      { href: "/jobs", label: "Jobs and salaries", note: "Pay by role, skills and live openings" },
      { href: "/ai/resume", label: "Resume review", note: "Fixes that get you shortlisted" },
      { href: "/plan", label: "Weekly plan", note: "This week's lessons for your hours" },
    ],
  },
];
export const AI_TOOLS = { href: "/ai", label: "AI tools" };

export const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Which group the current page belongs to, so the menu can say "you are here". Pure, for tests. */
export function activeGroup(path: string): string | null {
  if (under(path, "/ai/resume")) return "career";
  if (under(path, "/ai")) return "ai";
  if (under(path, "/roadmap") || under(path, "/stop") || under(path, "/start") || under(path, "/resources")) return "learn";
  if (under(path, "/interview")) return "practise";
  for (const g of NAV_GROUPS) if (g.items.some((i) => under(path, i.href))) return g.id;
  return null;
}

