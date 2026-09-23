import { describe, it, expect } from "vitest";
import { chainsToFaucet, defaultTestValues } from "@/constants";
import { parseAmounts } from "../parseAmounts/parseAmounts";
import { parseList } from "../parseList/parseList";
import { getDefaultTestValues, isEmptyFields, resolveFieldsOnChainChange } from "./getDefaultTestValues";

const SEPOLIA = 11155111;
const ANVIL = 31337;
const EMPTY = { tokenAddress: "", recipients: "", amounts: "" };

describe("getDefaultTestValues", () => {
  it("returns Sepolia values for 11155111 and Anvil values for 31337", () => {
    expect(getDefaultTestValues(SEPOLIA)).toEqual(defaultTestValues[SEPOLIA]);
    expect(getDefaultTestValues(SEPOLIA)?.tokenAddress).toBe("0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8");
    expect(getDefaultTestValues(ANVIL)?.tokenAddress).toBe("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  });

  it("returns null for chains without test values (1, 324)", () => {
    expect(getDefaultTestValues(1)).toBeNull();
    expect(getDefaultTestValues(324)).toBeNull();
  });

  it("Sepolia default token equals the chainsToFaucet token", () => {
    expect(getDefaultTestValues(SEPOLIA)?.tokenAddress).toBe(chainsToFaucet[SEPOLIA].token);
  });

  it("default recipients and amounts have matching counts and all amounts parse as valid", () => {
    for (const fields of Object.values(defaultTestValues)) {
      const recipients = parseList(fields.recipients);
      const { values, invalid } = parseAmounts(fields.amounts);
      expect(invalid).toEqual([]);
      expect(recipients.length).toBeGreaterThan(0);
      expect(values.length).toBe(recipients.length);
    }
  });
});

describe("isEmptyFields", () => {
  it("true for empty/whitespace-only fields, false otherwise", () => {
    expect(isEmptyFields(EMPTY)).toBe(true);
    expect(isEmptyFields({ tokenAddress: "  ", recipients: "\n", amounts: "\t" })).toBe(true);
    expect(isEmptyFields({ ...EMPTY, amounts: "1" })).toBe(false);
    expect(isEmptyFields({ ...EMPTY, tokenAddress: "0x1" })).toBe(false);
  });
});

describe("resolveFieldsOnChainChange", () => {
  it("untouched Anvil defaults are swapped for Sepolia defaults", () => {
    expect(resolveFieldsOnChainChange(defaultTestValues[ANVIL], SEPOLIA)).toEqual(defaultTestValues[SEPOLIA]);
  });

  it("empty fields are filled with the next chain's defaults", () => {
    expect(resolveFieldsOnChainChange(EMPTY, SEPOLIA)).toEqual(defaultTestValues[SEPOLIA]);
  });

  it("user-edited fields are preserved", () => {
    const edited = { ...defaultTestValues[ANVIL], amounts: "5" };
    expect(resolveFieldsOnChainChange(edited, SEPOLIA)).toBe(edited);
  });

  it("untouched defaults are cleared when switching to a chain without test values", () => {
    expect(resolveFieldsOnChainChange(defaultTestValues[SEPOLIA], 1)).toEqual(EMPTY);
  });

  it("stored untouched defaults of another chain follow the current chain on load", () => {
    // Sepolia defaults stored, page reloaded with the wallet on Anvil.
    expect(resolveFieldsOnChainChange(defaultTestValues[SEPOLIA], ANVIL)).toEqual(defaultTestValues[ANVIL]);
    // Reloaded on a chain without defaults: untouched defaults are cleared, not shown for the wrong chain.
    expect(resolveFieldsOnChainChange(defaultTestValues[SEPOLIA], 1)).toEqual(EMPTY);
  });

  it("untouched defaults of another chain still follow the chain after a reload (stored values, different applied chain)", () => {
    // Sepolia defaults stored, page reloaded on mainnet (no defaults), then switched to Anvil.
    expect(resolveFieldsOnChainChange(defaultTestValues[SEPOLIA], ANVIL)).toEqual(defaultTestValues[ANVIL]);
  });
});
