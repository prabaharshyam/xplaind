import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // API routes read content/ at run time (getContent uses process.cwd(), which file tracing
  // cannot follow), so ship those files with every route; pages are prerendered at build.
  outputFileTracingIncludes: {
    "/api/**": ["./content/**/*", "./data/**/*"],
  },
  // The roles were reorganised on 2026-10-26: old links land on the closest new roadmap.
  async redirects() {
    const moved: [string, string][] = [
      ["llmops-engineer", "mlops-engineer"],
      ["rag-expert", "genai-engineer"],
      ["ai-for-beginners", "ai-engineer"],
    ];
    return moved.flatMap(([from, to]) => [
      { source: `/roadmap/${from}`, destination: `/roadmap/${to}`, permanent: true },
      { source: `/interview/for/${from}`, destination: `/interview/for/${to}`, permanent: true },
      { source: `/interview/top/${from}`, destination: `/interview/top/${to}`, permanent: true },
    ]);
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
