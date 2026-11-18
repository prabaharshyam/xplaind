// npm run links:check [-- --limit 50]
// ED-5: the weekly link check. Opens every outside link in content/ (courses, books, certifications,
// papers, YouTube videos, sources) and writes data/link-status.json, which the resource cards read for
// "Link checked" (RM-4), and link-report.md, the text of the GitHub issue (empty when nothing needs
// fixing). Run by .github/workflows/link-check.yml every Monday morning India time. Exit code 0 even when
// links are broken: the issue is the signal, not a failed job.
import fs from "node:fs";
import path from "node:path";
import { todayInIST } from "@/lib/dates";
import { classify, linksIn, nextStreak, report, type LinkRecord } from "@/lib/links/check";
import { checkUrl } from "@/lib/links/fetch";
import { loadContent } from "@/lib/content/load";

const args = process.argv.slice(2);
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const ROOT = path.resolve("content");
const OUT = path.resolve("data", "link-status.json");
// The issue text, read by the workflow and not committed.
const REPORT = path.resolve("link-report.md");
const CONCURRENCY = 8;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(ya?ml|mdx?)$/.test(e.name) ? [p] : [];
  });
}

type Previous = { results?: Record<string, LinkRecord>; links?: Record<string, LinkRecord> };

async function main() {
  const today = todayInIST();
  // Every link, and the files it is in.
  const where = new Map<string, Set<string>>();
  for (const f of files(ROOT)) {
    const text = fs.readFileSync(f, "utf8");
    // Video lessons may name a YouTube video by its id alone.
    const videos = [...text.matchAll(/youtube_id:\s*["']?([A-Za-z0-9_-]{11})/g)].map((m) => `https://www.youtube.com/watch?v=${m[1]}`);
    for (const url of [...linksIn(text), ...videos]) {
      if (!where.has(url)) where.set(url, new Set());
      where.get(url)!.add(path.relative(process.cwd(), f));
    }
  }
  const before: Previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const urls = [...where.keys()].slice(0, limit);
  console.log(`Checking ${urls.length} links…`);

  const links: Record<string, LinkRecord> = {};
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        const code = await checkUrl(url);
        const status = classify(code);
        links[url] = {
          status,
          checked_on: today,
          code,
          unknown_streak: nextStreak(status, before.links?.[url]?.unknown_streak),
          files: [...where.get(url)!].sort(),
        };
        if (status !== "ok") console.log(`${status.padEnd(7)} ${code ?? "no answer"} ${url}`);
      }
    }),
  );

  // The resource cards look a link up by the resource's id.
  const { bundle } = loadContent(ROOT);
  const results: Record<string, { status: LinkRecord["status"]; checked_on: string }> = {};
  for (const { data: r } of bundle.resources) {
    const hit = links[r.url];
    if (hit) results[r.id] = { status: hit.status, checked_on: hit.checked_on };
  }

  const sorted = Object.fromEntries(Object.entries(links).sort(([a], [b]) => a.localeCompare(b)));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify({ checked_on: today, results, links: sorted }, null, 1)}\n`);
  fs.writeFileSync(REPORT, report(sorted, today));
  const count = (s: string) => Object.values(links).filter((l) => l.status === s).length;
  console.log(`\n${urls.length} links: ${count("ok")} ok, ${count("broken")} broken, ${count("unknown")} unknown.`);
}

void main();
