// Builds the data a resource card shows (RM-4) from content files. Node only.
import type { ResourceCardData } from "@/components/resource-card";
import { getResource, getStops } from "./index";
import { getLinkStatus } from "./link-status";
import { kindLabel, youtubeEmbed } from "./media";
import { isHumanName } from "./review";

export function resourceCard(id: string): ResourceCardData {
  const r = getResource(id);
  if (!r) throw new Error(`resource "${id}" does not exist`);
  return {
    id: r.id,
    title: r.title,
    provider: r.provider,
    type: r.type,
    level: r.level,
    cost: r.cost,
    price_inr: r.price_inr,
    price_checked_on: r.price_checked_on,
    hours: r.hours,
    language: r.language,
    certificate: r.certificate,
    affiliate: r.affiliate,
    why_picked: r.why_picked,
    kindLabel: kindLabel(r),
    embed: youtubeEmbed(r.url),
    ...(r.notice ? { notice: r.notice } : {}),
    // A draft written from memory is not a verification, so it shows no date.
    verifiedOn: isHumanName(r.verified_by) ? r.last_verified : null,
    linkCheckedOn: getLinkStatus()[r.id]?.checked_on ?? null,
    theme: getStops().find((s) => s.primary_resource === id || s.alternates.includes(id) || s.more.includes(id))?.theme,
  };
}
