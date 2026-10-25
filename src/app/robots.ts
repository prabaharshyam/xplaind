import type { MetadataRoute } from "next";
import { allowIndexing } from "@/lib/indexing";

export default function robots(): MetadataRoute.Robots {
  return allowIndexing()
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/go/", "/result"] } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
