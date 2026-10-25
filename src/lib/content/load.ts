// Reads content/ from disk and checks each file against its schema.
// Node only. Never throws for bad content: problems come back as issues so the
// validator can list all of them at once.
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { z } from "zod";
import {
  Book,
  GlossaryTerm,
  CheckQuestion,
  Goal,
  InterviewQuestion,
  LevelsFile,
  PlacementQuestion,
  Resource,
  StopFrontmatter,
} from "./schema";
import { type Bundle, type Entry, type Issue, emptyBundle } from "./types";

const RULE_PREFIX = /^([A-Z]{2}-\d+):\s*/;

export function zodToIssues(file: string, error: z.ZodError): Issue[] {
  return error.issues.map((i) => {
    const where = i.path.length ? `${i.path.join(".")}: ` : "";
    const rule = RULE_PREFIX.exec(i.message)?.[1];
    return {
      severity: "error" as const,
      file,
      rule,
      message: `${where}${i.message.replace(RULE_PREFIX, "")}`,
    };
  });
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return (fs.readdirSync(dir, { recursive: true }) as string[])
    .filter((rel) => {
      const base = path.basename(rel);
      if (base.startsWith(".") || base.toLowerCase() === "readme.md") return false;
      return fs.statSync(path.join(dir, rel)).isFile();
    })
    .sort();
}

function readYaml(abs: string, rel: string, issues: Issue[]): unknown | undefined {
  try {
    return parseYaml(fs.readFileSync(abs, "utf8"));
  } catch (e) {
    issues.push({ severity: "error", file: rel, message: `YAML could not be read: ${(e as Error).message.split("\n")[0]}` });
    return undefined;
  }
}

function loadYamlDir<S extends z.ZodType<{ id: string }>>(
  root: string,
  sub: string,
  schema: S,
  issues: Issue[],
): Entry<z.output<S>>[] {
  const out: Entry<z.output<S>>[] = [];
  for (const rel of listFiles(path.join(root, sub))) {
    const file = `${sub}/${rel}`;
    if (!/\.ya?ml$/.test(rel)) {
      issues.push({ severity: "error", file, message: "unexpected file type here; use a .yaml file" });
      continue;
    }
    const raw = readYaml(path.join(root, file), file, issues);
    if (raw === undefined) continue;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      issues.push(...zodToIssues(file, parsed.error));
      continue;
    }
    const stem = path.basename(rel).replace(/\.ya?ml$/, "");
    if (parsed.data.id !== stem) {
      issues.push({ severity: "error", file, message: `id "${parsed.data.id}" must match the file name "${stem}"` });
    }
    out.push({ file, data: parsed.data });
  }
  return out;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/;

function loadStops(root: string, issues: Issue[]): Bundle["stops"] {
  const out: Bundle["stops"] = [];
  for (const rel of listFiles(path.join(root, "stops"))) {
    const file = `stops/${rel}`;
    if (!rel.endsWith(".mdx")) {
      issues.push({ severity: "error", file, message: "unexpected file type here; use a .mdx file" });
      continue;
    }
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const match = FRONTMATTER.exec(text);
    if (!match) {
      issues.push({ severity: "error", file, message: "no frontmatter found; the file must start with a --- block" });
      continue;
    }
    let raw: unknown;
    try {
      raw = parseYaml(match[1]);
    } catch (e) {
      issues.push({ severity: "error", file, message: `frontmatter YAML could not be read: ${(e as Error).message.split("\n")[0]}` });
      continue;
    }
    const parsed = StopFrontmatter.safeParse(raw);
    if (!parsed.success) {
      issues.push(...zodToIssues(file, parsed.error));
      continue;
    }
    const [dirLevel, ...restParts] = rel.split(/[\\/]/);
    const stem = path.basename(rel, ".mdx");
    if (restParts.length !== 1 || dirLevel !== parsed.data.level) {
      issues.push({ severity: "error", file, message: `a ${parsed.data.level} stop belongs at stops/${parsed.data.level}/${parsed.data.id}.mdx` });
    } else if (stem !== parsed.data.id) {
      issues.push({ severity: "error", file, message: `id "${parsed.data.id}" must match the file name "${stem}"` });
    }
    out.push({ file, data: { ...parsed.data, body: (match[2] ?? "").trim() } });
  }
  return out;
}

function loadLevels(root: string, issues: Issue[]): Bundle["levels"] {
  const file = "levels/levels.yaml";
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    issues.push({ severity: "error", file, message: "file is missing" });
    return [];
  }
  const raw = readYaml(abs, file, issues);
  if (raw === undefined) return [];
  const parsed = LevelsFile.safeParse(raw);
  if (!parsed.success) {
    issues.push(...zodToIssues(file, parsed.error));
    return [];
  }
  return parsed.data.levels.map((data) => ({ file, data }));
}

export function loadContent(root: string): { bundle: Bundle; issues: Issue[] } {
  const issues: Issue[] = [];
  const bundle = emptyBundle();
  if (!fs.existsSync(root)) {
    issues.push({ severity: "error", file: root, message: "content folder not found" });
    return { bundle, issues };
  }
  bundle.goals = loadYamlDir(root, "goals", Goal, issues);
  bundle.levels = loadLevels(root, issues);
  bundle.stops = loadStops(root, issues);
  bundle.resources = loadYamlDir(root, "resources", Resource, issues);
  bundle.placement = loadYamlDir(root, "questions/placement", PlacementQuestion, issues);
  bundle.checks = loadYamlDir(root, "questions/checks", CheckQuestion, issues);
  bundle.interview = loadYamlDir(root, "questions/interview", InterviewQuestion, issues);
  bundle.books = loadYamlDir(root, "books", Book, issues);
  bundle.glossary = loadYamlDir(root, "glossary", GlossaryTerm, issues);
  return { bundle, issues };
}
