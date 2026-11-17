import { describe, expect, it } from "vitest";
import { MAX_PIECE_MS, PIECE_GAP_MS, loudness, newVad, quietFor, speechThreshold, stepVad, type Vad } from "./vad";

/** Runs levels through the detector, one every 50 ms, and returns the final state and when it cut. */
function run(levels: number[], start = 0): { vad: Vad; cuts: number[] } {
  let vad = newVad(start);
  const cuts: number[] = [];
  levels.forEach((level, i) => {
    const now = start + i * 50;
    const out = stepVad(vad, level, now);
    vad = out.vad;
    if (out.cut) cuts.push(now);
  });
  return { vad, cuts };
}
const repeat = (level: number, ms: number) => Array.from({ length: ms / 50 }, () => level);

describe("hearing the learner from the microphone level (VI-9)", () => {
  it("measures loudness", () => {
    expect(loudness([])).toBe(0);
    expect(loudness([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
    expect(speechThreshold(0)).toBe(0.012);
    expect(speechThreshold(0.02)).toBeCloseTo(0.06);
  });

  it("cuts a piece after a short pause in speech, and never sends silence", () => {
    const { cuts } = run([...repeat(0.002, 1000), ...repeat(0.2, 1500), ...repeat(0.002, 1000)]);
    expect(cuts).toHaveLength(1);
    expect(cuts[0]).toBe(1000 + 1500 - 50 + PIECE_GAP_MS); // the gap after the last voiced frame
    expect(run(repeat(0.002, 5000)).cuts).toEqual([]);
  });

  it("never lets a piece run past the limit while the learner keeps talking", () => {
    const { cuts } = run(repeat(0.2, MAX_PIECE_MS + 2000));
    expect(cuts[0]).toBe(MAX_PIECE_MS);
  });

  it("knows how long the learner has been quiet, and that a thinking pause is not speech", () => {
    const { vad } = run([...repeat(0.2, 1000), ...repeat(0.003, 4000)]);
    expect(vad.voiced).toBe(false);
    expect(quietFor(vad, 5000)).toBeGreaterThanOrEqual(4000);
    expect(quietFor(newVad(0), 9000)).toBe(0); // before the first word, silence is not a finished answer
  });

  it("adapts to a noisy room: steady fan noise is not speech, a voice over it is", () => {
    // Measured before listening: the fan is the room's level.
    let vad = newVad(0, 0.02);
    for (let t = 0; t < 3000; t += 50) vad = stepVad(vad, 0.02, t).vad;
    expect(vad.voiced).toBe(false);
    expect(vad.lastVoiceAt).toBeNull();
    expect(stepVad(vad, 0.2, 3100).vad.voiced).toBe(true);
    // Not measured: a steady sound still stops counting as speech within a few seconds.
    let unmeasured = newVad(0);
    for (let t = 0; t < 8000; t += 50) unmeasured = stepVad(unmeasured, 0.02, t).vad;
    expect(unmeasured.voiced).toBe(false);
  });
});
