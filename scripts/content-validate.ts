// npm run content:validate [-- --launch] [-- --root content] [-- --json] [-- --verbose]
// Checks every file in content/ and how the files fit together (ED-8).
// Exit code 1 when there is any error. --launch also turns coverage gaps and
// missing human sign-off into errors; use it for production builds.
import path from "node:path";
import { todayInIST } from "@/lib/dates";
import { loadContent } from "@/lib/content/load";
import { coverage, validateBundle } from "@/lib/content/validate";
import type { Issue } from "@/lib/content/types";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const rootArg = args.indexOf("--root");
const root = path.resolve(rootArg >= 0 ? args[rootArg + 1] : "content");
const launch = flag("--launch") || process.env.CONTENT_LAUNCH === "1";

const { bundle, issues: loadIssues } = loadContent(root);
const issues: Issue[] = [...loadIssues, ...validateBundle(bundle, { today: todayInIST(), launch })];
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

if (flag("--json")) {
  console.log(JSON.stringify({ launch, errors, warnings, coverage: coverage(bundle) }, null, 2));
  process.exit(errors.length ? 1 : 0);
}

const line = (i: Issue) => `  ${i.file}${i.rule ? ` [${i.rule}]` : ""}\n    ${i.message}`;

if (errors.length) console.log(`\nERRORS (${errors.length})\n${errors.map(line).join("\n")}`);
if (warnings.length) {
  console.log(`\nTO DO BEFORE LAUNCH (${warnings.length}). In launch mode these are errors.`);
  if (flag("--verbose")) {
    console.log(warnings.map(line).join("\n"));
  } else {
    const groups = new Map<string, Issue[]>();
    for (const w of warnings) groups.set(w.rule ?? "other", [...(groups.get(w.rule ?? "other") ?? []), w]);
    for (const [rule, items] of groups) {
      console.log(`  ${rule}: ${items.length}. e.g. ${items[0].file}: ${items[0].message}`);
    }
    console.log("  (add --verbose to list every item)");
  }
}

const pad = (v: string | number, n: number) => String(v).padStart(n);
console.log("\nCOVERAGE        stops  hours/draft  resources  placement  checks");
for (const c of coverage(bundle)) {
  console.log(
    `  ${c.level}            ${pad(c.stops, 5)}  ${pad(c.stopHours, 5)}/${pad(c.draftHours ?? "-", 5)}  ${pad(c.resources, 9)}  ${pad(c.placement, 9)}  ${pad(c.checks, 6)}`,
  );
}

console.log(
  `\n${bundle.stops.length} stops, ${bundle.resources.length} resources, ${bundle.placement.length} placement, ${bundle.checks.length} checks, ${bundle.interview.length} interview, ${bundle.books.length} books. Mode: ${launch ? "launch" : "development"}.`,
);
console.log(errors.length ? `FAILED with ${errors.length} error(s).` : "OK: no errors.");
process.exit(errors.length ? 1 : 0);
