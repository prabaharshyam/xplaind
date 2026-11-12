import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PAY-5: the menu shows Pricing only when Pro passes are switched on. Only this yes/no reaches the browser.
  env: { NEXT_PUBLIC_PRO_OPEN: ["sandbox", "production"].includes((process.env.PAYMENTS_MODE ?? "").trim().toLowerCase()) ? "1" : "" },
  /* config options here */
  cacheComponents: true,
  // RM-4: video thumbnails come through our image server, so browsers never call YouTube before play.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
  // getContent reads content/ with process.cwd(), which file tracing cannot follow, so ship the
  // content with every route. Not only API routes read it at run time: a partly dynamic page such as
  // /dashboard re-renders on each request once accounts are on, and an unknown lesson or post renders
  // its not-found page on demand. Without the files those pages crashed on Vercel (2026-11-03).
  outputFileTracingIncludes: {
    // Share images draw the logo from this file; the root share image belongs to every page.
    "/**": ["./content/**/*", "./data/**/*", "./public/brand/xplaind-wordmark.png"],
  },
  // The roles were reorganised on 2026-10-26: old links land on the closest new roadmap.
  async redirects() {
    const moved: [string, string][] = [
      ["llmops-engineer", "mlops-engineer"],
      ["rag-expert", "genai-engineer"],
      ["ai-for-beginners", "ai-engineer"],
    ];
    // 2026-11-02: the AI coach was merged into the AI tutor.
    // 2026-11-12 (FOCUS-2): the AI roadmap generator was removed; the hand-built roadmaps are the product.
    const merged = [
      { source: "/ai/coach", destination: "/ai/tutor", permanent: true },
      { source: "/ai/roadmap", destination: "/paths", permanent: true },
      // The Rust track was dropped as off-topic for AI careers; its pages go to the topic list and the blog.
      { source: "/topics/rust", destination: "/topics", permanent: true },
      ...["why-rust", "rust-basics", "rust-ownership-borrowing", "rust-structs-enums-matching", "rust-errors-traits-generics", "rust-concurrency-async", "rust-for-ai-and-python"].map(
        (id) => ({ source: `/stop/${id}`, destination: "/topics", permanent: true }),
      ),
      { source: "/blog/rust-programming-language-2026", destination: "/blog", permanent: true },
    ];
    // 2026-11-08: cheatsheets are paused for now; old links land on Practice. Temporary, since they come back.
    const paused = [
      { source: "/cheatsheets", destination: "/practice", permanent: false },
      { source: "/cheatsheets/:id", destination: "/practice", permanent: false },
    ];
    return [...merged, ...paused, ...moved.flatMap(([from, to]) => [
      { source: `/roadmap/${from}`, destination: `/roadmap/${to}`, permanent: true },
      { source: `/interview/for/${from}`, destination: `/interview/for/${to}`, permanent: true },
      { source: `/interview/top/${from}`, destination: `/interview/top/${to}`, permanent: true },
    ])];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
