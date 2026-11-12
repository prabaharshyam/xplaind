"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * MO-2: the reading-progress line under the top bar. It is placed on <body>, outside the page's
 * entrance animation: a transformed parent makes a fixed element scroll with the content, which
 * on phones put the line in the middle of the lesson.
 */
export function ReadingProgress() {
  // True only in the browser, after hydration, so server and client render the same first frame.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return mounted ? createPortal(<div aria-hidden="true" className="lx-progress" />, document.body) : null;
}
