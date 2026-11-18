"use client";

import { useEffect } from "react";
import { rememberRoadmap, takeReturn } from "@/lib/browser/roadmap-return";

/** RM-16: notes this roadmap for the lesson pages, and puts the map back where the learner left it. */
export function RememberRoadmap({ pathId }: { pathId: string }) {
  useEffect(() => {
    rememberRoadmap(pathId);
    const y = takeReturn(pathId);
    if (y !== null && !location.hash) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [pathId]);
  return null;
}
