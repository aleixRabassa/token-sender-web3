import { describe, it, expect } from "vitest";
import { parseList } from "./parseList";

describe("parseList", () => {
  it("splits on commas, newlines, spaces, tabs and mixed separators", () => {
    expect(parseList("a,b,c")).toEqual(["a", "b", "c"]);
    expect(parseList("a\nb\nc")).toEqual(["a", "b", "c"]);
    expect(parseList("a b c")).toEqual(["a", "b", "c"]);
    expect(parseList("a\tb\tc")).toEqual(["a", "b", "c"]);
    expect(parseList("a, b\nc d\r\ne")).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("trims entries and drops empties (leading/trailing/consecutive separators, empty string)", () => {
    expect(parseList("  a  ,  b  ")).toEqual(["a", "b"]);
    expect(parseList(",\na,,\n\n b ,")).toEqual(["a", "b"]);
    expect(parseList("")).toEqual([]);
    expect(parseList(" \n\t, ")).toEqual([]);
  });
});
