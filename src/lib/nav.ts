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
      { href: "/paths", label: "Roadmaps", note: "A step-by-step path per AI role", icon: "map", tone: "teal" },
      // LY-2: Library and Topics are one page; "By topic" is a view inside it.
      { href: "/library", label: "Library", note: "Every lesson, video and skill", icon: "table", tone: "sky" },
      { href: "/videos", label: "Videos", note: "The best AI videos, by topic", icon: "play", tone: "rose" },
      { href: "/projects", label: "Projects", note: "Guided builds for your portfolio", icon: "rocket", tone: "amber" },
      { href: "/glossary", label: "Glossary", note: "AI words in plain English", icon: "chat", tone: "emerald" },
      { href: "/papers", label: "Papers and free books", note: "Key research and free AI books", icon: "book", tone: "sky" },
      // NV-10 (2026-11-27, owner: "fix/do the 4-12", item 12): four groups, not five. Practice held two entries;
      // the weekly plan is part of learning, and the code playground is a tool.
      { href: "/plan", label: "Stay on track", note: "Your weekly plan and reminders", icon: "target", tone: "amber" },
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
      { href: "/interview/prep", label: "Prep plan", note: "A daily plan until your interview", icon: "map", tone: "emerald" },
      { href: "/interview", label: "Questions", note: "500 questions, patterns, designs", icon: "search", tone: "sky" },
    ],
  },
  {
    id: "career",
    label: "Career",
    items: [
      { href: "/jobs", label: "Jobs and salaries", note: "Pay, skills and live openings", icon: "star", tone: "amber" },
      { href: "/ai/resume", label: "Resume review", note: "Fixes that get you shortlisted", icon: "cert", tone: "emerald" },
    ],
  },
  {
    // 2026-11-06, owner request: each AI tool in a dropdown, straight to its own page.
    id: "ai",
    // NV-7 (owner request, 2026-11-13): the AI tools are part of Pro, so the group reads as a studio.
    label: "AI Studio",
    items: [
      { href: "/ai/book", label: "Study from my notes & books", note: "Tests and flashcards from a PDF", icon: "book", tone: "amber" },
      { href: "/ai/tutor", label: "AI tutor", note: "Ask anything about AI", icon: "robot", tone: "teal" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser", icon: "code", tone: "sky" },
      { href: "/ai", label: "All AI tools and guides", note: "Every tool and guide", icon: "sparkles", tone: "teal" },
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
 * NV-11: the phone tab bar for signed-in learners. APP-1 (2026-11-27): five places, matching the app rail; the menu
 * keeps the rest. Icons use the menu's own set.
 */
export const TABS = [
  { id: "home", href: "/dashboard", label: "Home", icon: "compass" },
  { id: "learn", href: "/paths", label: "Learn", icon: "map" },
  { id: "practice", href: "/practice", label: "Practice", icon: "check" },
  { id: "interview", href: "/interview/simulator", label: "Interview", icon: "mic" },
  { id: "ai", href: "/ai", label: "AI", icon: "sparkles" },
] as const satisfies readonly { id: string; href: string; label: string; icon: IconName }[];

/** Which tab the page belongs to, or null; and whether the bar stays out of the way on this page. Pure, for tests. */
export function activeTab(path: string): (typeof TABS)[number]["id"] | null {
  if (under(path, "/dashboard") || under(path, "/settings")) return "home";
  if (under(path, "/practice")) return "practice";
  const g = activeGroup(path);
  return g === "learn" || g === "interview" || g === "ai" ? g : null;
}

/**
 * APP-1: the app rail (signed in, from 640 px). Each place opens its page; on hover or focus it also shows the
 * place's pages, taken from the menu so the two never disagree.
 */
type RailItem = { id: string; href: string; label: string; icon: IconName; tone: Tone; items: { href: string; label: string; note: string }[] };
const groupItems = (id: string) => (NAV_GROUPS.find((g) => g.id === id)?.items ?? []).map(({ href, label, note }) => ({ href, label, note }));
export const RAIL: RailItem[] = [
  { id: "home", href: "/dashboard", label: "Home", icon: "compass", tone: "teal", items: [] },
  { id: "learn", href: "/paths", label: "Learn", icon: "map", tone: "teal", items: groupItems("learn") },
  {
    id: "practice",
    href: "/practice",
    label: "Practice",
    icon: "check",
    tone: "emerald",
    items: [
      { href: "/practice", label: "Flashcards and quizzes", note: "Answer, check yourself, rate it" },
      { href: "/interview", label: "Questions", note: "500 questions with answers" },
      { href: "/playground", label: "Code playground", note: "Run Python in your browser" },
    ],
  },
  { id: "interview", href: "/interview/simulator", label: "Interview", icon: "mic", tone: "rose", items: groupItems("interview") },
  { id: "ai", href: "/ai", label: "AI Studio", icon: "sparkles", tone: "sky", items: groupItems("ai") },
  { id: "career", href: "/jobs", label: "Career", icon: "star", tone: "amber", items: groupItems("career") },
];

/** Which rail place the page belongs to. Pure, for tests. */
export function activeRail(path: string): string | null {
  if (under(path, "/dashboard") || under(path, "/settings")) return "home";
  if (under(path, "/practice") || under(path, "/playground")) return "practice";
  return activeGroup(path);
}

/** The mock interview has its own controls at the bottom of a phone, and a lesson its Track bar (RM-7). */
export const tabBarHidden = (path: string) => under(path, "/interview/simulator") || under(path, "/stop");
