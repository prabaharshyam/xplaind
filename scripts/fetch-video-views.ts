// npm run videos:views            reads every video
// npm run videos:views -- --missing  reads only videos with no count yet
// VD-1: reads each video's public view count from its YouTube page and writes
// content/video-views.yaml with today's date. Run it whenever you want fresh numbers.
// A video that cannot be read keeps its last count. Nothing here is used for ranking
// by affiliate or paid fields (ED-2); it only sorts the Videos page by views.
import fs from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { todayInIST } from "@/lib/dates";
import { loadContent } from "@/lib/content/load";
import { youtubeEmbed } from "@/lib/content/media";

const root = path.resolve("content");
const file = path.join(root, "video-views.yaml");
const { bundle } = loadContent(root);

const ids = new Set<string>();
for (const r of bundle.resources) {
  const e = youtubeEmbed(r.data.url);
  if (e?.kind === "video") ids.add(e.id);
}
for (const c of bundle.channels) for (const v of c.data.videos) ids.add(v.youtube_id);

const old: Record<string, number> = fs.existsSync(file) ? (parse(fs.readFileSync(file, "utf8")).views ?? {}) : {};
// Videos we skip this time keep the count they already have.
const views: Record<string, number> = process.argv.includes("--missing") ? Object.fromEntries(Object.entries(old).filter(([id]) => ids.has(id))) : {};

async function read(id: string): Promise<number | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${id}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" }, signal: AbortSignal.timeout(20_000) });
      if (res.ok) {
        const html = await res.text();
        const m = html.match(/videoViewCountRenderer":\{"viewCount":\{"simpleText":"([\d,]+) views?"/) ?? html.match(/"simpleText":"([\d,]+) views?"/);
        if (m) return Number(m[1].replace(/,/g, ""));
        if (/"simpleText":"No views"/.test(html)) return 0;
      }
    } catch {
      /* try again */
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return null;
}

async function main() {
  const onlyMissing = process.argv.includes("--missing");
  const queue = [...ids].filter((id) => !onlyMissing || old[id] === undefined);
  let failed = 0;
  let done = 0;
  async function worker() {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const n = await read(id);
      if (n === null) {
        failed++;
        if (old[id] !== undefined) views[id] = old[id];
      } else views[id] = n;
    done++;
    if (done % 50 === 0) console.log(`${done} of ${ids.size}`);
    await new Promise((r) => setTimeout(r, 600));
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));

  const sorted = Object.fromEntries(Object.entries(views).sort(([a], [b]) => a.localeCompare(b)));
  const header = "# VD-1: public YouTube view counts, written by `npm run videos:views`. Do not edit by hand.\n";
  fs.writeFileSync(file, header + stringify({ checked_on: todayInIST(), views: sorted }));
  console.log(`${Object.keys(sorted).length} of ${ids.size} videos read, ${failed} could not be read`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
