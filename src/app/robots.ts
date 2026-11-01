import type { MetadataRoute } from "next";
import { AI_CRAWLERS, allowIndexing } from "@/lib/indexing";
import { siteUrl } from "@/lib/site";

// Personal pages, sign-in and redirects add nothing to search results.
const PRIVATE = ["/go/", "/result", "/api/", "/dashboard", "/settings", "/signin", "/auth/", "/card/"];

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
