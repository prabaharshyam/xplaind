// RM-5 and SC-4: where /go/[resource-id] sends a learner, and what it logs. Pure.
// The log has resource, stop, level, cost and the affiliate flag. Never an email,
// IP address, user agent or any other personal data.
import type { LevelId } from "@/lib/levels";

type GoResource = {
  id: string;
  url: string;
  level: LevelId;
  cost: string;
  affiliate: boolean;
  affiliate_url?: string;
};
type GoStop = {
  id: string;
  level: LevelId;
  primary_resource: string;
  alternates: readonly string[];
  more?: readonly string[];
};

export type Click = { resource_id: string; stop_id: string | null; level: LevelId; cost: string; affiliate: boolean };

export type GoDecision = { found: false } | { found: true; url: string; click: Click };

export function resolveGo(
  resourceId: string,
  stopParam: string | null,
  lookup: { resource: (id: string) => GoResource | undefined; stop: (id: string) => GoStop | undefined },
): GoDecision {
  const r = lookup.resource(resourceId);
  if (!r) return { found: false };

  // Trust the stop only if it really lists this resource; otherwise log no stop.
  const s = stopParam ? lookup.stop(stopParam) : undefined;
  const stop = s && (s.primary_resource === r.id || s.alternates.includes(r.id) || s.more?.includes(r.id)) ? s : undefined;

  // The URL always comes from the content file (SC-4), never from the request.
  const url = r.affiliate && r.affiliate_url ? r.affiliate_url : r.url;
  return {
    found: true,
    url,
    click: { resource_id: r.id, stop_id: stop?.id ?? null, level: stop?.level ?? r.level, cost: r.cost, affiliate: r.affiliate },
  };
}
