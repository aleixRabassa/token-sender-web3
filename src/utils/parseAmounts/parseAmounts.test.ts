import { describe, it, expect } from "vitest";
import { parseAmounts } from "./parseAmounts";

describe("parseAmounts", () => {
  it("returns bigint values for valid integer tokens", () => {
    expect(parseAmounts("100, 200\n0 300")).toEqual({
      values: [BigInt(100), BigInt(200), BigInt(0), BigInt(300)],
      invalid: [],
    });
  });

  it("reports decimals, negatives and non-numeric tokens as invalid and excludes them from values", () => {
    expect(parseAmounts("10 1.5 -3 abc 123invalid 1e18 NaN 20")).toEqual({
      values: [BigInt(10), BigInt(20)],
      invalid: ["1.5", "-3", "abc", "123invalid", "1e18", "NaN"],
    });
  });

  it("handles values above 2^53 exactly (e.g. 1e18 amounts)", () => {
    const { values, invalid } = parseAmounts("1000000000000000000\n9007199254740993");
    expect(invalid).toEqual([]);
    expect(values).toEqual([BigInt("1000000000000000000"), BigInt("9007199254740993")]);
  });
});
