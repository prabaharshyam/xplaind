// IX-1: IndexNow tells Bing (and so Copilot, DuckDuckGo and others that read Bing's index) about pages
// as soon as they change, instead of waiting for a crawler to find them. The key is public by design:
// it only proves that this site's owner sent the request, and the same text is served at
// https://xplaind.in/<key>.txt (public/<key>.txt). Pure helpers, with no network.

export const INDEXNOW_KEY = "233bcf46ae758db760c28c1d2459db38";
export const INDEXNOW_HOST = "xplaind.in";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
/** IndexNow accepts at most 10,000 URLs in one request. */
export const INDEXNOW_BATCH = 10_000;

/** The page addresses in a sitemap, in order, on this host only and without repeats. */
export function sitemapUrls(xml: string, host = INDEXNOW_HOST): string[] {
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  return [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
}

export const batches = <T,>(items: readonly T[], size = INDEXNOW_BATCH): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** The body of one IndexNow request. */
export const indexNowBody = (urlList: readonly string[]) => ({
  host: INDEXNOW_HOST,
  key: INDEXNOW_KEY,
  keyLocation: INDEXNOW_KEY_LOCATION,
  urlList,
});
