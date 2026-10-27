import { describe, expect, it } from "vitest";
import { embedSrc, kindLabel, openLabel, youtubeEmbed } from "./media";

describe("resource media and labels (RM-4)", () => {
  it("finds YouTube videos and playlists that can play on the page", () => {
    expect(youtubeEmbed("https://www.youtube.com/watch?v=zjkBMFhNj_g")).toEqual({ kind: "video", id: "zjkBMFhNj_g" });
    expect(youtubeEmbed("https://youtu.be/zjkBMFhNj_g")).toEqual({ kind: "video", id: "zjkBMFhNj_g" });
    expect(youtubeEmbed("https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr")).toEqual({ kind: "playlist", id: "PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr" });
  });

  it("leaves channels, other sites and odd ids as links", () => {
    expect(youtubeEmbed("https://www.youtube.com/@statquest")).toBeNull();
    expect(youtubeEmbed("https://www.coursera.org/learn/x")).toBeNull();
    expect(youtubeEmbed("https://www.youtube.com/watch?v=<script>")).toBeNull();
    expect(youtubeEmbed("not a url")).toBeNull();
  });

  it("plays through the privacy-enhanced domain", () => {
    expect(embedSrc({ kind: "video", id: "abcdef" })).toBe("https://www.youtube-nocookie.com/embed/abcdef?autoplay=1&rel=0");
    expect(embedSrc({ kind: "playlist", id: "PLabc123" })).toContain("youtube-nocookie.com/embed/videoseries?list=PLabc123");
  });

  it("calls YouTube a video lesson, Google Skills Google's video lessons, and other short videos short video lessons", () => {
    const base = { type: "course", provider: "X", certificate: false, url: "https://example.com" };
    expect(kindLabel({ ...base, type: "video", url: "https://www.youtube.com/@statquest" })).toBe("Video lesson");
    expect(kindLabel({ ...base, provider: "Google Skills", certificate: true })).toBe("Google's video lessons");
    expect(kindLabel({ ...base, type: "video" })).toBe("Short video lesson");
    expect(kindLabel({ ...base, type: "video", certificate: true })).toBe("Video");
    expect(kindLabel(base)).toBe("Course");
    expect(openLabel("Video lesson")).toBe("Watch the video lesson");
    expect(openLabel("Course")).toBe("Open the course");
  });
});
