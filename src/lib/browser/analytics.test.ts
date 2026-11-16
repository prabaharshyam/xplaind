import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanEvent, cleanUrl, posthogOptions, setCapture, track } from "./analytics";

const HOST = "xplaind.in";

describe("analytics privacy (AN-2, PV-2)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("runs cookieless, with no profiles, recordings, autocapture or extra scripts", () => {
    const o = posthogOptions(HOST);
    expect(o.cookieless_mode).toBe("always");
    expect(o.person_profiles).toBe("never");
    expect(o.autocapture).toBe(false);
    expect(o.disable_session_recording).toBe(true);
    expect(o.disable_external_dependency_loading).toBe(true);
    expect(o.capture_pageview).toBe("history_change");
  });

  it("keeps only the path and utm tags of our own URLs", () => {
    expect(cleanUrl("https://xplaind.in/auth/callback?token_hash=abc&next=/x#frag", HOST)).toBe("https://xplaind.in/auth/callback");
    expect(cleanUrl("https://xplaind.in/stop/rag?utm_source=linkedin&email=a%40b.com", HOST)).toBe("https://xplaind.in/stop/rag?utm_source=linkedin");
  });

  it("keeps only the host of other sites", () => {
    expect(cleanUrl("https://www.google.com/search?q=my+name", HOST)).toBe("https://www.google.com/");
    expect(cleanUrl("$direct", HOST)).toBe("$direct");
  });

  it("cleans every URL property of an event and leaves the rest", () => {
    const e = cleanEvent({ properties: { $current_url: "https://xplaind.in/signin?error=x", $referrer: "https://t.co/abc?x=1", ph_keyword: "my name", goal: "ai-engineer" } }, HOST);
    expect(e.properties).toEqual({ $current_url: "https://xplaind.in/signin", $referrer: "https://t.co/", goal: "ai-engineer" });
  });

  it("sends nothing while analytics is off, and queues events until PostHog loads when it is on", () => {
    const sent: string[] = [];
    track("quiz_started");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    track("quiz_completed", { questions: 10 });
    setCapture((event) => sent.push(event));
    track("stop_done", { stop_id: "rag" });
    expect(sent).toEqual(["quiz_completed", "stop_done"]);
  });
});
