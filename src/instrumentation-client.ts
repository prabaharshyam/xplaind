// AN-2: starts cookieless PostHog once the page is idle, so it never delays the first paint or a tap.
// Does nothing until NEXT_PUBLIC_POSTHOG_KEY is set.
import { analyticsKey, posthogOptions, setCapture } from "@/lib/browser/analytics";

const key = analyticsKey();
if (key && typeof window !== "undefined") {
  const start = () => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, posthogOptions(window.location.host) as Parameters<typeof posthog.init>[1]);
        setCapture((event, props) => posthog.capture(event, props));
      })
      .catch(() => undefined); // Analytics must never break the site (an ad blocker, a network error).
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 1500);
}
