import { describe, expect, it } from "vitest";
import { parseHighlights } from "./highlights";

describe("APP-4 note highlights", () => {
  it("keeps valid points and colours only", () => {
    expect(parseHighlights('{"n1":{"0-1":"amber","2-0":"pink","x":"sky"},"n2":"bad"}')).toEqual({ n1: { "0-1": "amber" } });
    expect(parseHighlights("not json")).toEqual({});
    expect(parseHighlights(null)).toEqual({});
  });
});
