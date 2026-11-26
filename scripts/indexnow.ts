// IX-1: tell IndexNow (Bing and the engines that share it) about every page in the live sitemap.
// Run it after a deploy that adds or changes pages: `npm run indexnow`, or the "IndexNow" workflow on
// GitHub (Actions, Run workflow). `npm run indexnow -- --dry-run` shows what it would send and sends nothing.
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, batches, indexNowBody, sitemapUrls } from "../src/lib/indexnow";

const dry = process.argv.includes("--dry-run");
const site = (process.env.INDEXNOW_SITE || "https://xplaind.in").replace(/\/$/, "");

async function main() {
  // The key file must be live first, or IndexNow rejects every request.
  const keyRes = await fetch(INDEXNOW_KEY_LOCATION).catch(() => null);
  const keyText = keyRes?.ok ? (await keyRes.text()).trim() : "";
  if (keyText !== INDEXNOW_KEY) {
    console.error(`The key file at ${INDEXNOW_KEY_LOCATION} is not live yet (got ${keyRes?.status ?? "no answer"}). Deploy first, then run this again.`);
    process.exit(1);
  }
  const sitemap = await fetch(`${site}/sitemap.xml`);
  if (!sitemap.ok) throw new Error(`Could not read ${site}/sitemap.xml (${sitemap.status}).`);
  const urls = sitemapUrls(await sitemap.text());
  console.log(`${urls.length} pages in the sitemap.`);
  if (dry) {
    console.log(urls.slice(0, 5).join("\n"), "\n...");
    return;
  }
  for (const [i, list] of batches(urls).entries()) {
    const res = await fetch(INDEXNOW_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(indexNowBody(list)) });
    // 200 and 202 both mean accepted; 202 means the key check is still pending.
    console.log(`Batch ${i + 1}: ${list.length} pages, answer ${res.status}`);
    if (res.status !== 200 && res.status !== 202) {
      console.error(await res.text().catch(() => ""));
      process.exit(1);
    }
  }
}

void main();
