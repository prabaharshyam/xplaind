// SE-1: search engines and AI answer engines may index the live site. Vercel marks the
// production deployment with VERCEL_ENV=production, so xplaind.in is indexed and preview
// links stay hidden. ALLOW_INDEXING=1 forces indexing elsewhere; DISALLOW_INDEXING=1 is
// the off switch for production.
export const allowIndexing = (): boolean => {
  if (process.env.DISALLOW_INDEXING === "1") return false;
  return process.env.ALLOW_INDEXING === "1" || process.env.VERCEL_ENV === "production";
};

/** Crawlers that feed AI answers, named so a later blanket rule cannot shut them out by accident. */
export const AI_CRAWLERS = ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "Google-Extended", "Applebot-Extended", "Bingbot"] as const;
