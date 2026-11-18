import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE, LINE_TTL_MS, MAX_TTS_CHARS, SARVAM_STREAM_URL, lineUrl, signLine, speakable, streamSpeech, ttsBody, ttsSettings, verifyLine } from "./tts";
import { ACK_LINES, CLOSING_LINE, pauseToSend, questionLine } from "./voice-interview";

describe("the interviewer's voice (VI-6)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is off without a key, and uses the owner's chosen voice by default", () => {
    expect(ttsSettings({})).toBeNull();
    expect(ttsSettings({ SARVAM_API_KEY: "  " })).toBeNull();
    expect(ttsSettings({ SARVAM_API_KEY: "k" })).toEqual({ apiKey: "k", voice: DEFAULT_VOICE });
    expect(DEFAULT_VOICE).toBe("zarina_en_conversation");
  });

  it("asks Sarvam for Indian English MP3 from Bulbul v4 Flash", () => {
    expect(ttsBody("Hello there.", DEFAULT_VOICE)).toMatchObject({ text: "Hello there.", language_code: "en-IN", model: "bulbul:v4-flash", speaker: DEFAULT_VOICE, output_audio_codec: "mp3" });
  });

  it("cleans text so symbols are not read out, writes big numbers with commas, and caps the length", () => {
    expect(speakable("Use `top_k` *carefully*\n\n# now")).toBe("Use top k carefully now");
    expect(speakable("About 100000 tokens")).toBe("About 1,00,000 tokens");
    expect(speakable("x".repeat(2000))).toHaveLength(MAX_TTS_CHARS);
  });
});

describe("streamed, signed lines (VI-8)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("only plays lines our server signed, and only for one interview's time", () => {
    const now = 1_000_000;
    const token = signLine("What is RAG?", "secret", now);
    expect(verifyLine(token, "secret", now + 1000)).toBe("What is RAG?");
    expect(verifyLine(token, "other-secret", now)).toBeNull();
    expect(verifyLine(token, "secret", now + LINE_TTL_MS + 1)).toBeNull();
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ t: "Say anything I like", e: now + 9e9 })).toString("base64url");
    expect(verifyLine(`${forged}.${sig}`, "secret", now)).toBeNull();
    expect(verifyLine(payload, "secret", now)).toBeNull();
    expect(verifyLine("", "secret", now)).toBeNull();
  });

  it("gives a voice URL only when the voice service is on", () => {
    expect(lineUrl("Hi.", null)).toBeNull();
    expect(lineUrl("Hi.", { apiKey: "k", voice: DEFAULT_VOICE })).toMatch(/^\/api\/ai\/voice\/say\?t=[\w-]+\.[\w-]+$/);
  });

  it("streams from Sarvam's stream endpoint and returns null when it fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("mp3 bytes"));
    vi.stubGlobal("fetch", fetchMock);
    const res = await streamSpeech("Hi.", { apiKey: "k", voice: DEFAULT_VOICE });
    expect(await res?.text()).toBe("mp3 bytes");
    expect(fetchMock.mock.calls[0][0]).toBe(SARVAM_STREAM_URL);
    expect(fetchMock.mock.calls[0][1].headers["api-subscription-key"]).toBe("k");
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 429 }));
    expect(await streamSpeech("Hi.", { apiKey: "k", voice: DEFAULT_VOICE })).toBeNull();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect(await streamSpeech("Hi.", { apiKey: "k", voice: DEFAULT_VOICE })).toBeNull();
    expect(await streamSpeech("Hi.", null)).toBeNull();
  });
});

describe("what the interviewer says, and when it answers (VI-7, VI-8)", () => {
  it("welcomes the learner before the first question and leads into the others naturally", () => {
    expect(questionLine(0, 3, "What is RAG?")).toMatch(/^Hi, I'm your AI interviewer.*3 questions.*Let's begin\. What is RAG\?$/);
    // VI-18: she asks for a quiet place before the first question.
    expect(questionLine(0, 3, "What is RAG?")).toContain("Please be somewhere quiet, with no other voices or noise around you");
    expect(questionLine(1, 3, "Q2?")).toBe("Thanks. Let's move on to the next one. Q2?");
    expect(questionLine(2, 3, "Q3?")).toBe("Thanks. And now the last question. Q3?");
    expect(CLOSING_LINE).toMatch(/end of the interview/);
  });

  it("reacts at once with short, neutral words, never judging the answer", () => {
    for (const a of ACK_LINES) expect(a).not.toMatch(/great|good|excellent|correct|wrong/i);
  });

  it("waits 5 seconds of silence, and 7 when the learner trails off mid-thought (VI-9)", () => {
    expect(pauseToSend("")).toBe(Infinity);
    expect(pauseToSend("RAG retrieves relevant passages and adds them to the prompt")).toBe(5000);
    expect(pauseToSend("RAG means retrieval")).toBe(5000);
    expect(pauseToSend("We split the documents and")).toBe(7000);
    expect(pauseToSend("I would use chunking because")).toBe(7000);
    expect(pauseToSend("so the idea is, um")).toBe(7000);
    expect(pauseToSend("first we embed the text,")).toBe(7000);
  });
});
