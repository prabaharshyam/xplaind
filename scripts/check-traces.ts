// Run after `next build`. On Vercel each route runs with only the files in its trace, and the site
// reads content/, data/ and the share-image logo from disk while a visitor waits. If a route ships
// without them it crashes ("This page couldn't load"), which happened on 2026-11-03 once accounts
// were on. This fails the build check instead. See outputFileTracingIncludes in next.config.ts.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const needed = new Set<string>(["public/brand/xplaind-wordmark.png"]);
for (const dir of ["content", "data"]) {
  if (!fs.existsSync(path.join(root, dir))) continue; // data/ is optional (link-status.json)
  for (const f of fs.readdirSync(path.join(root, dir), { recursive: true }) as string[]) {
    const rel = path.join(dir, f);
    if (fs.statSync(path.join(root, rel)).isFile()) needed.add(path.normalize(rel));
  }
}

const traces = (fs.readdirSync(path.join(root, ".next/server/app"), { recursive: true }) as string[])
  .filter((f) => f.endsWith(".nft.json"))
  .map((f) => path.join(root, ".next/server/app", f));
if (traces.length === 0) throw new Error("No route traces found. Run `npm run build` first.");

let failed = 0;
for (const trace of traces) {
  const { files } = JSON.parse(fs.readFileSync(trace, "utf8")) as { files: string[] };
  const have = new Set(files.map((f) => path.normalize(path.relative(root, path.resolve(path.dirname(trace), f)))));
  const missing = [...needed].filter((f) => !have.has(f));
  if (missing.length) {
    failed++;
    console.error(`${path.relative(root, trace)}: ${missing.length} needed files not shipped, e.g. ${missing.slice(0, 3).join(", ")}`);
  }
}
if (failed) {
  console.error(`${failed} of ${traces.length} routes would crash on Vercel. Add the files to outputFileTracingIncludes.`);
  process.exit(1);
}
console.log(`OK: all ${traces.length} routes ship content/, data/ and the logo.`);
