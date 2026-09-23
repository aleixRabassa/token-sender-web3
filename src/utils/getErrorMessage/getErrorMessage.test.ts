import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./getErrorMessage";

describe("getErrorMessage", () => {
  it("prefers shortMessage (viem/wagmi errors), falls back to message and String()", () => {
    const withShort = Object.assign(new Error("long\n\nDetails: ..."), { shortMessage: "User rejected the request." });
    expect(getErrorMessage(withShort)).toBe("User rejected the request.");
    expect(getErrorMessage(new Error("plain"))).toBe("plain");
    expect(getErrorMessage("oops")).toBe("oops");
  });
});
