// FT-1: every page worth linking, in one list. The footer is short; the All pages page (/explore) shows all of this.
export const SITE_MAP: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { href: "/paths", label: "Roadmaps" },
      { href: "/library", label: "Library" },
      { href: "/videos", label: "Videos" },
      { href: "/glossary", label: "Glossary" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Practice",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/practice", label: "Practice cards" },
      { href: "/playground", label: "Code playground" },
      { href: "/interview", label: "Interview questions" },
      { href: "/interview/simulator", label: "Mock interview" },
      { href: "/interview/prep", label: "Interview prep plan" },
      { href: "/ai", label: "AI Studio" },
    ],
  },
  {
    title: "Courses and books",
    links: [
      { href: "/resources", label: "Courses" },
      { href: "/certifications", label: "Certifications" },
      { href: "/books", label: "Books" },
      { href: "/papers", label: "Research papers" },
      { href: "/how-we-rank", label: "How we rank" },
      { href: "/disclosure", label: "Affiliate disclosure" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/dashboard", label: "Your dashboard" },
      { href: "/plan", label: "Stay on track" },
      { href: "/jobs", label: "Jobs and salaries" },
      { href: "/about", label: "About Xplaind" },
      { href: "/about#founder", label: "Meet the founder" },
    ],
  },
  {
    title: "More",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/colleges", label: "For colleges" },
      { href: "/stories", label: "Learner stories" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refunds", label: "Refunds and cancellations" },
    ],
  },
];
