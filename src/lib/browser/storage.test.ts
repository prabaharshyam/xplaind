import { afterEach, describe, expect, it, vi } from "vitest";
import { read, write } from "./storage";

function fakeWindow(storage: Partial<Storage>) {
  vi.stubGlobal("window", { localStorage: storage, dispatchEvent: () => true });
}

afterEach(() => vi.unstubAllGlobals());

describe("storage helpers", () => {
  it("reads back what was written", () => {
    const data = new Map<string, string>();
    fakeWindow({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) });
    write("a", "1");
    expect(read("a")).toBe("1");
    write("a", null);
    expect(read("a")).toBeNull();
  });

  it("keeps values for the visit when storage is blocked", () => {
    const blocked = () => {
      throw new Error("SecurityError");
    };
    fakeWindow({ getItem: blocked, setItem: blocked, removeItem: blocked });
    write("cards", '["knew"]');
    expect(read("cards")).toBe('["knew"]');
    write("cards", null);
    expect(read("cards")).toBeNull();
  });
});
