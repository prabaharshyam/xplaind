// CM-1: the community page's settings, read from content/community/community.yaml. Node only.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { Community } from "./schema";

export function getCommunity(): Community {
  const file = path.join(/* turbopackIgnore: true */ process.cwd(), "content", "community", "community.yaml");
  return Community.parse(parse(fs.readFileSync(file, "utf8")));
}
