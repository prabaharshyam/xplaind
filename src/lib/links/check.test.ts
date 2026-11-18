import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { classify, linksIn, nextStreak, report, youtubeId } from "./check";
import { checkUrl } from "./fetch";

describe("the weekly link check (ED-5)", () => {
  it("calls 2xx and 3xx ok, 404 and 410 broken, and everything else unknown", () => {
    expect([200, 204, 301, 308].map(classify)).toEqual(["ok", "ok", "ok", "ok"]);
    expect([404, 410].map(classify)).toEqual(["broken", "broken"]);
    expect([403, 429, 500, 503, 401, null].map(classify)).toEqual(Array(6).fill("unknown"));
  });

  it("counts unknown results in a row, and resets on any clear answer", () => {
    expect(nextStreak("unknown", undefined)).toBe(1);
    expect(nextStreak("unknown", 2)).toBe(3);
    expect(nextStreak("ok", 5)).toBe(0);
  });

  it("finds outside links in content text and leaves out our own", () => {
    const text = 'url: https://www.coursera.org/learn/x\nsee [this](https://arxiv.org/abs/1706.03762). and https://xplaind.in/stop/a, "https://cs50.harvard.edu/python/".';
    expect(linksIn(text)).toEqual(["https://www.coursera.org/learn/x", "https://arxiv.org/abs/1706.03762", "https://cs50.harvard.edu/python/"]);
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("writes an issue only when something is broken or needs a look", () => {
    expect(report({ "https://a.org": { status: "ok", checked_on: "2026-11-23" } }, "2026-11-23")).toBe("");
    const text = report(
      {
        "https://a.org/gone": { status: "broken", checked_on: "2026-11-23", code: 404, files: ["content/resources/a.yaml"] },
        "https://b.org": { status: "unknown", checked_on: "2026-11-23", code: 403, unknown_streak: 3, files: ["content/resources/b.yaml"] },
      },
      "2026-11-23",
    );
    expect(text).toMatch(/## Broken[\s\S]*a\.org\/gone \(404\) in `content\/resources\/a\.yaml`/);
    expect(text).toMatch(/## Review queue[\s\S]*b\.org \(403\)/);
  });
});

describe("one 404 and one 403 from a real server (the ED-5 acceptance test)", () => {
  let server: Server;
  let base = "";
  beforeAll(async () => {
    server = createServer((req, res) => {
      res.statusCode = req.url === "/missing" ? 404 : req.url === "/blocked" ? 403 : 200;
      res.end();
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const a = server.address();
    base = `http://127.0.0.1:${typeof a === "object" && a ? a.port : 0}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("reports broken 1 and unknown 1", async () => {
    const statuses = await Promise.all(["/missing", "/blocked"].map(async (p) => classify(await checkUrl(base + p, 5000))));
    expect(statuses.filter((s) => s === "broken")).toHaveLength(1);
    expect(statuses.filter((s) => s === "unknown")).toHaveLength(1);
  });
});
