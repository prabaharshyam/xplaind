// NV-1 and NV-2: the main menu's groups and "you are here". Type-only imports, so it is safe anywhere.
import type { IconName } from "@/lib/themes";
import type { Tone } from "@/lib/tones";

/** UX-3, UX-13: each menu item has an icon on a soft tile in its tool's colour (src/lib/tones.ts). */
export type NavTone = Tone;
type Item = { href: string; label: string; note: string; icon: IconName; tone: NavTone };
type Group = { id: string; label: string; items: Item[] };

/** NV-1: the main menu, grouped by what the visitor wants to do. */
export const NAV_GROUPS: Group[] = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { href: "/paths", label: "Roadmaps", note: "A step-by-step path for each AI role", icon: "map", tone: "teal" },
      // LY-2: Library and Topics are one page; "By topic" is a view inside it.
      { href: "/library", label: "Library", note: "Every lesson, video and skill, or browse by topic", icon: "table", tone: "sky" },
      { href: "/videos", label: "Videos", note: "Filter by topic", icon: "play", tone: "rose" },
      { href: "/projects", label: "Projects", note: "Guided builds for your portfolio", icon: "rocket", tone: "amber" },
      { href: "/glossary", label: "Glossary", note: "AI words in plain English", icon: "chat", tone: "emerald" },
      { href: "/papers", label: "Papers and free books", note: "Landmark research and free AI books", icon: "book", tone: "sky" },
      // NV-10 (2026-11-27, owner: "fix/do the 4-12", item 12): four groups, not five. Practice held two entries;
      // the weekly plan is part of learning, and the code playground is a tool.
      { href: "/plan", label: "Stay on track", note: "This week's plan, reminders and Monday emails", icon: "target", tone: "amber" },
    ],
  },
  {
    // IP-3, 7 Nov 2026: interview prep gets its own menu, the AlgoMaster-style spine of the site.
    id: "interview",
    label: "Interview",
    items: [
      // IP-6 (2026-11-27, owner request): three entries, not six. "Questions" holds the bank, the answers by
      // role, the flashcards, interview patterns and system design answers.
      { href: "/interview/simulator", label: "Mock interview", note: "Answer out loud, get a report", icon: "mic", tone: "rose" },
      { href: "/interview/prep", label: "Prep plan", note: "Questions for each day until your interview", icon: "map", tone: "emerald" },
      { href: "/interview", label: "Questions", note: "500 questions with answers, patterns and system design", icon: "search", tone: "sky" },
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
    // NV-7 (owner request, 2026-11-13): the AI tools are part of Pro, so the group reads as a studio.
    label: "AI Studio",
    items: [
      { href: "/ai/book", label: "Study from my notes & books", note: "Turn a PDF into a test and flashcards", icon: "book", tone: "amber" },
      { href: "/ai/tutor", label: "AI tutor", note: "Ask anything about AI, in plain English", icon: "robot", tone: "teal" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser", icon: "code", tone: "sky" },
      { href: "/ai", label: "All AI tools and guides", note: "Every tool, plus guides to AI at work", icon: "sparkles", tone: "teal" },
    ],
  },
];
/**
 * NV-7: Pro has its own place, not inside a group: a link in the desktop bar and a card at the foot
 * of the phone menu. NV-8 (owner request, 2026-11-16): it is called "Pricing", not "Pro", and has no
 * dot, because "Pro" with a dot made learners think they were already subscribed. BIZ-1: prices are always public, so gateways and visitors see what is sold.
 */
export const PRO_LINK = { href: "/pricing", label: "Pricing", title: "Plans and pricing", note: "Daily AI tutor, interview feedback and resume reviews, from ₹249" } as const;

/** UX-13: a tool's colour is the one its menu item has. */
export const toolTone = (href: string): Tone => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === href)?.tone ?? "teal";

export const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Which group the current page belongs to, so the menu can say "you are here". Pure, for tests. */
export function activeGroup(path: string): string | null {
  if (under(path, "/ai/resume")) return "career";
  if (under(path, "/ai")) return "ai";
  if (under(path, "/roadmap") || under(path, "/stop") || under(path, "/start") || under(path, "/resources")) return "learn";
  // IP-6: the flashcards and quick quiz are part of Interview → Questions now.
  if (under(path, "/interview") || under(path, "/practice")) return "interview";
  for (const g of NAV_GROUPS) if (g.items.some((i) => under(path, i.href))) return g.id;
  return null;
}


/**
 * NV-11: the phone tab bar for signed-in learners. Four places they come back to every day; the menu keeps the rest.
 * Icons use the menu's own set.
 */
export const TABS = [
  { id: "today", href: "/dashboard", label: "Today", icon: "target" },
  { id: "learn", href: "/paths", label: "Roadmaps", icon: "map" },
  { id: "interview", href: "/interview", label: "Interview", icon: "mic" },
  { id: "ai", href: "/ai", label: "Tools", icon: "sparkles" },
] as const satisfies readonly { id: string; href: string; label: string; icon: IconName }[];

/** Which tab the page belongs to, or null; and whether the bar stays out of the way on this page. Pure, for tests. */
export function activeTab(path: string): (typeof TABS)[number]["id"] | null {
  if (under(path, "/dashboard") || under(path, "/settings")) return "today";
  const g = activeGroup(path);
  return g === "learn" || g === "interview" || g === "ai" ? g : null;
}
/** The mock interview has its own controls at the bottom of a phone, and a lesson its Track bar (RM-7). */
export const tabBarHidden = (path: string) => under(path, "/interview/simulator") || under(path, "/stop");
