import { describe, expect, it } from "vitest";
import { ensureStreamAsyncIterator, streamValues } from "./stream-polyfill";

const make = (items: number[]) =>
  new ReadableStream<number>({
    start(c) {
      items.forEach((i) => c.enqueue(i));
      c.close();
    },
  });

describe("ReadableStream async iterator polyfill (MB-11)", () => {
  it("reads every chunk in order, as PDF.js getTextContent does", async () => {
    const out: number[] = [];
    for await (const v of streamValues(make([1, 2, 3]))) out.push(v);
    expect(out).toEqual([1, 2, 3]);
  });

  it("cancels the stream when the loop stops early", async () => {
    let cancelled = false;
    const stream = new ReadableStream<number>({
      pull(c) {
        c.enqueue(1);
      },
      cancel() {
        cancelled = true;
      },
    });
    for await (const v of streamValues(stream)) if (v === 1) break;
    expect(cancelled).toBe(true);
  });

  it("adds the iterator to a prototype that lacks it (Safari) and leaves a native one alone", async () => {
    // A stand-in for Safari's ReadableStream: same reader, no async iterator.
    class SafariStream extends ReadableStream<number> {}
    Object.defineProperty(SafariStream.prototype, Symbol.asyncIterator, { value: undefined, configurable: true });
    Object.defineProperty(SafariStream.prototype, "values", { value: undefined, configurable: true });
    expect(ensureStreamAsyncIterator(SafariStream.prototype)).toBe(true);
    const stream = new SafariStream({
      start(c) {
        c.enqueue(7);
        c.enqueue(8);
        c.close();
      },
    });
    const out: number[] = [];
    for await (const v of stream as unknown as AsyncIterable<number>) out.push(v);
    expect(out).toEqual([7, 8]);
    expect(ensureStreamAsyncIterator(ReadableStream.prototype)).toBe(false);
  });
});
