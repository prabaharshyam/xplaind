// LB-1: research papers and free books, read from content/library/papers.yaml. Node only.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { Library, type LibraryItem } from "./schema";

export function getLibrary(root = path.join(/* turbopackIgnore: true */ process.cwd(), "content")): LibraryItem[] {
  return Library.parse(parse(fs.readFileSync(path.join(root, "library", "papers.yaml"), "utf8"))).items;
}
