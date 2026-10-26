import type { MetadataRoute } from "next";
import { allowIndexing } from "@/lib/indexing";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return allowIndexing()
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/go/", "/result"] }, sitemap: `${siteUrl()}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
