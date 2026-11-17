import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE, MAX_TTS_CHARS, SARVAM_TTS_URL, speakable, synthesize, ttsBody, ttsSettings } from "./tts";
import { CLOSING_LINE, cleanAck, followUpLine, questionLine } from "./voice-interview";

describe("the interviewer's voice (VI-6)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is off without a key, and uses the owner's chosen voice by default", () => {
    expect(ttsSettings({})).toBeNull();
    expect(ttsSettings({ SARVAM_API_KEY: "  " })).toBeNull();
    expect(ttsSettings({ SARVAM_API_KEY: "k" })).toEqual({ apiKey: "k", voice: DEFAULT_VOICE });
    expect(DEFAULT_VOICE).toBe("zarina_en_conversation");
    expect(ttsSettings({ SARVAM_API_KEY: "k", SARVAM_VOICE: "simran_en_conversation" })?.voice).toBe("simran_en_conversation");
  });

  it("asks Sarvam for Indian English MP3 from Bulbul v4 Flash", () => {
    expect(ttsBody("Hello there.", "zarina_en_conversation")).toMatchObject({
      text: "Hello there.",
      language_code: "en-IN",
      model: "bulbul:v4-flash",
      speaker: "zarina_en_conversation",
      output_audio_codec: "mp3",
    });
  });

  it("cleans text so symbols are not read out, writes big numbers with commas, and caps the length", () => {
    expect(speakable("Use `top_k` *carefully*\n\n# now")).toBe("Use top k carefully now");
    expect(speakable("About 100000 tokens")).toBe("About 1,00,000 tokens");
    expect(speakable("x".repeat(2000))).toHaveLength(MAX_TTS_CHARS);
  });

  it("returns MP3 bytes from the API, and null (the browser speaks instead) when it fails or no key is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ audios: [Buffer.from("mp3!").toString("base64")] })));
    vi.stubGlobal("fetch", fetchMock);
    const out = await synthesize("Hi.", { apiKey: "k", voice: DEFAULT_VOICE });
    expect(out?.toString()).toBe("mp3!");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(SARVAM_TTS_URL);
    expect(init.headers["api-subscription-key"]).toBe("k");
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    expect(await synthesize("Hi.", { apiKey: "k", voice: DEFAULT_VOICE })).toBeNull();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect(await synthesize("Hi.", { apiKey: "k", voice: DEFAULT_VOICE })).toBeNull();
    expect(await synthesize("Hi.", null)).toBeNull();
  });
});

describe("what the interviewer says (VI-7)", () => {
  it("welcomes the learner before the first question and leads into the others naturally", () => {
    expect(questionLine(0, 3, "What is RAG?")).toMatch(/^Hi, I'm your AI interviewer.*3 questions.*Let's begin\. What is RAG\?$/);
    expect(questionLine(0, 1, "What is RAG?")).toContain("one question");
    expect(questionLine(1, 3, "Q2?")).toBe("Thanks. Let's move on to the next one. Q2?");
    expect(questionLine(2, 3, "Q3?")).toBe("Thanks. And now the last question. Q3?");
    expect(CLOSING_LINE).toMatch(/end of the interview/);
  });

  it("reacts briefly before a follow-up, and never judges the answer", () => {
    expect(cleanAck("Right, thanks for that")).toBe("Right, thanks for that.");
    expect(cleanAck("Great answer!")).toBe("Okay.");
    expect(cleanAck("That is correct.")).toBe("Okay.");
    expect(cleanAck("")).toBe("Okay.");
    expect(cleanAck("word ".repeat(14))).toBe("Okay.");
    expect(followUpLine("I see.", "Why that size?")).toBe("I see. Why that size?");
  });
});
