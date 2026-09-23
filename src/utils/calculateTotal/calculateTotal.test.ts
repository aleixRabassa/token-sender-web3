import { describe, it, expect } from "vitest";
import { calculateTotal } from "./calculateTotal";

describe("calculateTotal", () => {
  it("sums comma/space/newline/mixed separated amounts as bigint", () => {
    expect(calculateTotal("100")).toBe(BigInt(100));
    expect(calculateTotal("10\n20\n30")).toBe(BigInt(60));
    expect(calculateTotal("10,20,30")).toBe(BigInt(60));
    expect(calculateTotal("10 20 30")).toBe(BigInt(60));
    expect(calculateTotal("10,20\n30 40")).toBe(BigInt(100));
    expect(calculateTotal("  10  , 20 \n\n 30  ")).toBe(BigInt(60));
    expect(calculateTotal("0\n10\n0")).toBe(BigInt(10));
  });

  it("returns 0n for empty or whitespace input", () => {
    expect(calculateTotal("")).toBe(BigInt(0));
    expect(calculateTotal("\n  \n\n")).toBe(BigInt(0));
  });

  it("precise sum of large values (two 1e18 amounts plus 1 wei)", () => {
    expect(calculateTotal("1000000000000000000\n1000000000000000000\n1")).toBe(BigInt("2000000000000000001"));
  });
});
