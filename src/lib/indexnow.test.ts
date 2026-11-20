import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INDEXNOW_BATCH, INDEXNOW_HOST, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, batches, indexNowBody, sitemapUrls } from "./indexnow";

const xml = `<?xml version="1.0"?><urlset>
<url><loc>https://xplaind.in/</loc></url>
<url><loc> https://xplaind.in/about </loc></url>
<url><loc>https://xplaind.in/library?topic=a&amp;level=b</loc></url>
<url><loc>https://xplaind.in/about</loc></url>
<url><loc>https://other.example/page</loc></url>
<url><loc>not a url</loc></url>
</urlset>`;

describe("IndexNow (IX-1)", () => {
  it("serves the key as a text file at the address it announces", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{8,128}$/);
    const file = path.join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
    expect(fs.readFileSync(file, "utf8").trim()).toBe(INDEXNOW_KEY);
    expect(INDEXNOW_KEY_LOCATION).toBe(`https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`);
  });

  it("reads page addresses from a sitemap: this host only, no repeats, entities decoded", () => {
    expect(sitemapUrls(xml)).toEqual(["https://xplaind.in/", "https://xplaind.in/about", "https://xplaind.in/library?topic=a&level=b"]);
  });

  it("splits long lists into requests of at most 10,000 pages", () => {
    const urls = Array.from({ length: 25_000 }, (_, i) => `https://xplaind.in/p/${i}`);
    expect(batches(urls).map((b) => b.length)).toEqual([INDEXNOW_BATCH, INDEXNOW_BATCH, 5000]);
    expect(batches([])).toEqual([]);
  });

  it("builds the request body IndexNow expects", () => {
    expect(indexNowBody(["https://xplaind.in/"])).toEqual({ host: "xplaind.in", key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList: ["https://xplaind.in/"] });
  });
});
