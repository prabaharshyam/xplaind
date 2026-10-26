// AC-7: read a shared level card by its unguessable id. Node only. Uses the
// service role and returns only the fields the card shows.
import { z } from "zod";
import { getLevel } from "@/lib/content";
import { isLevelId } from "@/lib/levels";
import { siteUrl } from "@/lib/site";
import { adminClient } from "@/lib/supabase/server";

export type PublicCard = { level: string; levelName: string; goal: string; weeksActive: number; name: string | null; site: string };

export async function getPublicCard(id: string): Promise<PublicCard | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const admin = adminClient();
  if (!admin) return null;
  const { data } = await admin.from("level_cards").select("level,goal_id,weeks_active,display_name").eq("id", id).maybeSingle();
  if (!data || !isLevelId(data.level)) return null;
  return {
    level: data.level,
    levelName: getLevel(data.level)?.name ?? "",
    goal: data.goal_id === "genai-engineer" ? "GenAI Engineer" : data.goal_id,
    weeksActive: data.weeks_active,
    name: data.display_name,
    site: new URL(siteUrl()).host,
  };
}
