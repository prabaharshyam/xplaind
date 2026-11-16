import { describe, expect, it } from "vitest";
import { SPEECH_LANG, pickVoice } from "./speech";

const v = (lang: string, localService = true) => ({ lang, localService, name: lang });

describe("speech for Indian English (VI-2)", () => {
  it("listens in Indian English", () => {
    expect(SPEECH_LANG).toBe("en-IN");
  });

  it("reads questions in an Indian English voice when the device has one, local voices first", () => {
    expect(pickVoice([v("en-US"), v("en-IN", false), v("en-IN"), v("hi-IN")])).toEqual(v("en-IN"));
    expect(pickVoice([v("en_IN")])?.lang).toBe("en_IN");
  });

  it("falls back to British, then any English voice, and never to another language", () => {
    expect(pickVoice([v("en-US"), v("en-GB")])?.lang).toBe("en-GB");
    expect(pickVoice([v("fr-FR"), v("en-AU")])?.lang).toBe("en-AU");
    expect(pickVoice([v("ta-IN"), v("hi-IN")])).toBeNull();
  });
});
