// AN-2 (2026-11-16, owner request): visitor analytics with PostHog in cookieless mode. No cookies,
// no browser storage, no user or device identifier (PV-2): PostHog counts visitors with a hash on
// its own servers that changes every day. Nothing is sent until NEXT_PUBLIC_POSTHOG_KEY is set.
// Returning learners are measured from activity_days for signed-in learners, not from here.

export const ANALYTICS_EVENTS = ["quiz_started", "quiz_completed", "stop_done"] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
type Props = Record<string, string | number | boolean>;

type Capture = (event: string, props?: Props) => void;
let capture: Capture | null = null;
const queue: [AnalyticsEvent, Props | undefined][] = [];

/** Records a product event. Safe to call before PostHog loads (queued) and when analytics is off (dropped). */
export function track(event: AnalyticsEvent, props?: Props): void {
  if (!analyticsKey()) return;
  if (capture) capture(event, props);
  else if (queue.length < 50) queue.push([event, props]);
}

/** Called once PostHog has loaded; sends anything recorded before then. */
export function setCapture(fn: Capture): void {
  capture = fn;
  for (const [event, props] of queue.splice(0)) fn(event, props);
}

export const analyticsKey = (): string | null => process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null;
export const analyticsHost = (): string => process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

/**
 * Keeps only the path and campaign tags (utm_*) of a URL, so a token, email or code that ever lands in a
 * query string or hash never reaches analytics. Other sites' addresses keep only their host. Pure, for tests.
 */
export function cleanUrl(value: unknown, ownHost: string): unknown {
  if (typeof value !== "string" || !value) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value.split(/[?#]/)[0];
  }
  if (url.host !== ownHost) return `${url.protocol}//${url.host}/`;
  const kept = [...url.searchParams].filter(([k]) => k.startsWith("utm_"));
  const query = kept.length ? `?${new URLSearchParams(kept)}` : "";
  return `${url.origin}${url.pathname}${query}`;
}

const URL_PROPS = ["$current_url", "$referrer", "$initial_referrer", "$prev_pageview_url"] as const;
const DROPPED_PROPS = ["ph_keyword", "$search_engine_keyword"] as const;

/** Applies cleanUrl to every URL property of an event before it leaves the browser. Pure, for tests. */
export function cleanEvent<T extends { properties: Record<string, unknown> }>(event: T, ownHost: string): T {
  const properties = { ...event.properties };
  for (const key of URL_PROPS) if (key in properties) properties[key] = cleanUrl(properties[key], ownHost);
  // PostHog reads search words out of a search engine's referrer (ph_keyword); they can be personal.
  for (const key of DROPPED_PROPS) delete properties[key];
  return { ...event, properties };
}

/** The PostHog settings: cookieless, no profiles, nothing beyond page views and our own events. */
export function posthogOptions(ownHost: string) {
  return {
    api_host: analyticsHost(),
    cookieless_mode: "always" as const,
    person_profiles: "never" as const,
    capture_pageview: "history_change" as const,
    capture_pageleave: false,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    disable_external_dependency_loading: true,
    advanced_disable_flags: true,
    mask_personal_data_properties: true,
    before_send: <E extends { properties: Record<string, unknown> }>(event: E | null) => (event ? cleanEvent(event, ownHost) : null),
  };
}
