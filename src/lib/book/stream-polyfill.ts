// Safari (iPhone and Mac) cannot loop over a ReadableStream with `for await`, and PDF.js
// does exactly that when it reads a page's text, so a PDF failed with
// "undefined is not a function (near '...t of e...')" (MB-11). This adds the missing
// async iterator, built on the reader every browser has. It changes nothing where the
// browser already supports it.

type IterableStream = ReadableStream & { [Symbol.asyncIterator]?: unknown; values?: unknown };

export function streamValues<T>(stream: ReadableStream<T>): AsyncIterableIterator<T> {
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const { done, value } = await reader.read();
        if (done) reader.releaseLock();
        return done ? { done: true, value: undefined } : { done: false, value: value as T };
      } catch (error) {
        reader.releaseLock();
        throw error;
      }
    },
    async return() {
      // Leaving the loop early cancels the stream, as the built-in iterator does.
      const cancelled = reader.cancel();
      reader.releaseLock();
      await cancelled;
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

/** Adds `ReadableStream.prototype[Symbol.asyncIterator]` when the browser lacks it. Returns true if it did. */
export function ensureStreamAsyncIterator(proto: IterableStream | undefined = globalThis.ReadableStream?.prototype): boolean {
  if (!proto || typeof proto[Symbol.asyncIterator] === "function") return false;
  const values = function (this: ReadableStream) {
    return streamValues(this);
  };
  Object.defineProperty(proto, Symbol.asyncIterator, { value: values, writable: true, configurable: true });
  if (typeof proto.values !== "function") Object.defineProperty(proto, "values", { value: values, writable: true, configurable: true });
  return true;
}
