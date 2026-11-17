import { describe, expect, it } from "vitest";
import { STT_MODEL, audioType, hearToken, hearTokenValid, sttForm } from "./stt";
import { signLine } from "./tts";
import { keytermsFor } from "./voice-interview";

const settings = { apiKey: "secret", voice: "zarina_en_conversation" };

describe("Sarvam speech-to-text for spoken answers (VI-9)", () => {
  it("accepts the audio types browsers record, and nothing else", () => {
    expect(audioType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(audioType("audio/mp4")).toBe("audio/mp4");
    expect(audioType("text/plain")).toBeNull();
    expect(audioType(null)).toBeNull();
  });

  it("sends Indian English to Saaras v4 with the hint terms as one JSON list (as Sarvam requires)", async () => {
    const form = sttForm(new Blob(["x"], { type: "audio/webm" }), "audio/webm", ["RAG", "vector database"]);
    expect(form.get("model")).toBe(STT_MODEL);
    expect(form.get("language_code")).toBe("en-IN");
    expect(JSON.parse(String(form.get("keyterms")))).toEqual(["RAG", "vector database"]);
    expect((form.get("file") as File).name).toBe("answer.webm");
    expect(sttForm(new Blob(["x"]), "audio/mp4", []).get("keyterms")).toBeNull();
  });

  it("lets only this interview send audio: a voice line's token is not a listening token", () => {
    const token = hearToken(settings)!;
    expect(hearTokenValid(token, settings)).toBe(true);
    expect(hearTokenValid(token, { ...settings, apiKey: "other" })).toBe(false);
    expect(hearTokenValid(signLine("What is RAG?", "secret"), settings)).toBe(false);
    expect(hearToken(null)).toBeNull();
  });

  it("hints the question's own terms first, then common AI terms, at most 50 and no repeats", () => {
    const terms = keytermsFor({ rubric: [{ keywords: ["retrieval", "chunk overlap"] }, { keywords: ["Retrieval", "grounding"] }] });
    expect(terms.slice(0, 3)).toEqual(["retrieval", "chunk overlap", "grounding"]);
    expect(terms).toContain("RAG");
    expect(new Set(terms.map((t) => t.toLowerCase())).size).toBe(terms.length);
    const many = keytermsFor({ rubric: [{ keywords: Array.from({ length: 80 }, (_, i) => `term ${i}`) }] });
    expect(many).toHaveLength(50);
  });
});
