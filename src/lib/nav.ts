// NV-1 and NV-2: the main menu's groups and "you are here". Type-only imports, so it is safe anywhere.
import type { IconName } from "@/lib/themes";

/** UX-3: each menu item has an icon on a soft tile in one of these tones. */
export type NavTone = "violet" | "indigo" | "sky" | "teal" | "emerald" | "amber" | "rose";
type Item = { href: string; label: string; note: string; icon: IconName; tone: NavTone };
type Group = { id: string; label: string; items: Item[] };

/** NV-1: the main menu, grouped by what the visitor wants to do. */
export const NAV_GROUPS: Group[] = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { href: "/paths", label: "Roadmaps", note: "A step-by-step path for each AI role", icon: "map", tone: "violet" },
      { href: "/library", label: "Library", note: "Every lesson, video and skill", icon: "table", tone: "indigo" },
      { href: "/topics", label: "Topics", note: "Lessons grouped by subject", icon: "flow", tone: "sky" },
      { href: "/videos", label: "Videos", note: "Filter by topic", icon: "play", tone: "rose" },
      { href: "/projects", label: "Projects", note: "Guided builds for your portfolio", icon: "rocket", tone: "amber" },
      { href: "/glossary", label: "Glossary", note: "AI words in plain English", icon: "chat", tone: "teal" },
      { href: "/papers", label: "Papers and free books", note: "Landmark research and free AI books", icon: "book", tone: "emerald" },
    ],
  },
  {
    id: "practice",
    label: "Practice",
    items: [
      { href: "/practice", label: "Practice cards", note: "Flashcards for interview questions", icon: "check", tone: "emerald" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser", icon: "code", tone: "sky" },
      { href: "/plan", label: "Stay on track", note: "This week's plan, reminders and Monday emails", icon: "target", tone: "amber" },
    ],
  },
  {
    // IP-3, 7 Nov 2026: interview prep gets its own menu, the AlgoMaster-style spine of the site.
    id: "interview",
    label: "Interview",
    items: [
      { href: "/interview/patterns", label: "Interview patterns", note: "The ideas AI interviews are built on", icon: "flow", tone: "violet" },
      { href: "/interview/design", label: "System design answers", note: "Worked LLM designs, step by step", icon: "server", tone: "indigo" },
      { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report", icon: "mic", tone: "rose" },
      { href: "/interview/answers", label: "Interview Q&A", note: "Every question and answer, by role", icon: "chat", tone: "teal" },
      { href: "/interview", label: "Question bank", note: "Every question, by topic and role", icon: "search", tone: "amber" },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      { href: "/jobs", label: "Jobs and salaries", note: "Pay by role, skills and live openings", icon: "star", tone: "amber" },
      { href: "/ai/resume", label: "Resume review", note: "Fixes that get you shortlisted", icon: "cert", tone: "emerald" },
    ],
  },
  {
    // 2026-11-06, owner request: each AI tool in a dropdown, straight to its own page.
    id: "ai",
    label: "AI tools",
    items: [
      { href: "/ai/book", label: "Study from my notes & books", note: "Turn a PDF into a test and flashcards", icon: "book", tone: "violet" },
      { href: "/ai/tutor", label: "AI tutor", note: "Ask anything about AI, in plain English", icon: "robot", tone: "teal" },
      { href: "/ai", label: "All AI tools and guides", note: "Every tool, plus guides to AI at work", icon: "sparkles", tone: "amber" },
      ...(process.env.NEXT_PUBLIC_PRO_OPEN === "1" ? [{ href: "/pricing", label: "Pro and pricing", note: "More AI help each day, from ₹249", icon: "star", tone: "rose" } as Item] : []),
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

