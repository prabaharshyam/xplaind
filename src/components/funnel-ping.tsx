"use client";

import { useEffect } from "react";

/** AN-1: tells the server a funnel step happened (no identifier sent). Fire-and-forget. */
export function sendFunnel(event: "first_lesson" | "pricing_view"): void {
  void fetch("/api/funnel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => undefined);
}

/** Counts one view of the page it sits on, once per page load. */
export function FunnelPing({ event }: { event: "pricing_view" }) {
  useEffect(() => sendFunnel(event), [event]);
  return null;
}
