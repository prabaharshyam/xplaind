"use client";

import { useEffect } from "react";
import { isStaleDeployError, reloadOnce } from "@/lib/browser/chunk-error";

/**
 * UX-1: the last safety net, when even the site's frame fails. It has no site styles, so it carries
 * its own; it follows the system light or dark setting.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    if (isStaleDeployError(error)) reloadOnce();
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
          padding: "24px",
        }}
      >
        <title>Something went wrong | Xplaind</title>
        <main style={{ maxWidth: 520 }}>
          <p style={{ color: "#6d28d9", fontWeight: 600, margin: 0 }}>Xplaind</p>
          <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: "8px 0 12px" }}>This page did not load properly</h1>
          <p style={{ lineHeight: 1.6, margin: "0 0 20px" }}>It is usually a weak connection or a short hiccup on our side. Your progress is safe.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ background: "#6d28d9", color: "#fff", border: 0, borderRadius: 999, padding: "12px 22px", fontSize: 16, fontWeight: 600, cursor: "pointer", marginRight: 12 }}
          >
            Try again
          </button>
          {/* A full page load on purpose: the app itself failed, so client navigation cannot be trusted. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#6d28d9", fontWeight: 600 }}>
            Go to the home page
          </a>
        </main>
      </body>
    </html>
  );
}
