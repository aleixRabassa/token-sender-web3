# Plan: sepolia-deployment — Make the Vercel deployment transactable on Sepolia with working default test values

> **Jira:** sepolia-deployment  
> **Date:** 2026-09-24  
> **Author:** aleix.rabassa (planned with Claude Code)

---

## Overview

The app is published on Vercel, but its only test chain is a local Anvil node (chain 31337 at 127.0.0.1:8545) that the public site cannot reach, so no transaction works for visitors. Instead of hosting Anvil, the app will target the public **Sepolia** testnet, where Cyfrin's official TSender contract is already deployed at `0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a` (already present in `chainsToTSender[11155111]` and verified on-chain: code exists, `airdropERC20` selector present, `areListsValid` returns true). Sepolia is simply missing from the wagmi/RainbowKit chain list.

In addition, the airdrop form must open with **working test values per chain** (a mintable test token, recipients and amounts), visitors must be able to obtain test tokens from the UI via the Aave v3 Sepolia faucet ("Mint test USDC" button), and three correctness bugs in the tx flow are fixed: inconsistent amount/recipient splitting, float-based total (precision loss above 2^53), and reporting success before the airdrop receipt is confirmed.

The whole solution is free: no contract deployment, public Sepolia RPC, free Sepolia ETH from faucets, Vercel Hobby plan.

---

## Scope & Affected Areas

| Area | Type | Notes |
|------|------|-------|
| `src/rainbowKitConfig.tsx` | Modified | Add `sepolia` as the first entry of `chains` (keep `anvil`, `zksync`, `mainnet` after it); public RPC only |
| `src/app/providers.tsx` | Modified | Pass `initialChain` = Sepolia to `RainbowKitProvider` |
| `src/constants.ts` | Modified | New `chainsToFaucet` map and `aaveFaucetAbi`; new `defaultTestValues` data (or kept in the testValues util — see step 2) |
| `src/utils/parseList/parseList.ts` (+ `.test.ts`) | New | Single tokenizer for recipients and amounts |
| `src/utils/parseAmounts/parseAmounts.ts` (+ `.test.ts`) | New | BigInt amount parsing with invalid-token reporting |
| `src/utils/calculateTotal/calculateTotal.ts` (+ `.test.ts`) | Modified | Return `bigint`; tests rewritten |
| `src/utils/testValues/getDefaultTestValues.ts` (+ `.test.ts`) | New | Per-chain defaults lookup, `isEmptyFields`, `resolveFieldsOnChainChange` |
| `src/utils/index.ts` | Modified | Re-export the new utils |
| `src/hooks/useAirdropFormState.ts` | New | Owns form fields, localStorage persistence and chain-aware defaults |
| `src/components/ui/FaucetButton.tsx` | New | "Mint test USDC" button, rendered only on chains with a faucet config |
| `src/components/ui/TxDetails.tsx` | Modified | `total` prop becomes `bigint`; token amount via `formatUnits` |
| `src/components/AirdropForm.tsx` | Modified | Uses the hook, the FaucetButton, a "Load test values" button, and a corrected tx flow |
| `AGENTS.md`, `README.md` | Modified | Chains, new folders/utils, defaults behaviour, amount rules, Vercel notes |

---

## Chosen Approach

**Option B — Extract hook + dedicated components.** All parsing and default-value decisions move into pure, unit-tested functions in `src/utils/`; a `useAirdropFormState(chainId)` hook owns the three form fields, their existing localStorage keys, and chain-aware defaults (filled when storage is empty, swapped on chain change only if the fields are still untouched defaults, re-loadable through a "Load test values" button); a self-contained `FaucetButton` in `src/components/ui/` mints Aave test USDC on Sepolia. `AirdropForm` becomes a thin orchestrator with a corrected BigInt tx flow. This was chosen over Option A (keep everything inline in `AirdropForm.tsx`) because the error-prone logic (tokenizing, BigInt sums, default selection, chain-switch rule) becomes testable with the existing vitest setup and without React Testing Library, adding a chain's test values or faucet is a data-only change, and the recipients/amounts/total parsing mismatch becomes structurally impossible.

---

## Implementation Steps

- [x] **1. Register Sepolia as a supported wallet chain** — the TSender address already exists; wagmi just doesn't know the chain.
  - [x] In `src/rainbowKitConfig.tsx`, import `sepolia` from `wagmi/chains` and add it as the **first** entry of the `chains` array, followed by `anvil`, `zksync`, `mainnet` (wagmi uses `chains[0]` as the fallback chainId when no wallet is connected). Do not add custom transports or env vars: `getDefaultConfig` builds default http transports that use viem's public Sepolia RPC.
  - [x] In `src/app/providers.tsx`, pass the `initialChain` prop set to Sepolia on `RainbowKitProvider`, so visitors without a connected wallet (and the connect flow) default to Sepolia rather than Anvil.
  - [x] Verify that `useChainId()` for a disconnected visitor resolves to 11155111. The Playwright spec explicitly adds and switches to Anvil, so it is unaffected; local dev without a connected wallet will now show Sepolia defaults.

- [x] **2. Add faucet and test-value data** — addresses must live only in `src/constants.ts` (AGENTS.md convention).
  - [x] Add `aaveFaucetAbi` containing only the `mint(address token, address to, uint256 amount)` nonpayable function (returns uint256) and the `isPermissioned()` view.
  - [x] Add `chainsToFaucet`, keyed by chainId, with a single entry for 11155111: faucet `0xC959483DBa39aa9E78757139af0e9a2EDEb3f42D`, token `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` (Aave test USDC), decimals 6, label "USDC", and the per-mint amount of 1000 whole tokens (1000 USDC, below the faucet cap of 10000).
  - [x] Add `defaultTestValues`, keyed by chainId, in the exact text format the inputs use:
    - 11155111: token = the same Aave USDC address as the faucet entry; recipients = `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` and `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (newline-joined); amounts = `1000000` and `2000000` (1 and 2 USDC in base units, newline-joined).
    - 31337: token = mock token `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` (from `tsender-deployed.json`, anvil account #0 holds 100e18); recipient = `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`; amount = `1000000000000000000`.
  - [x] Ensure the Sepolia default token and the faucet token reference the same constant so they cannot drift (Circle's Sepolia USDC is a different contract and must not be used).

- [x] **3. Create the shared tokenizer `parseList`** — `src/utils/parseList/parseList.ts`: split the input on newlines, commas and any whitespace, trim, drop empty entries, return an array of strings. Used for recipients, amounts and the total, which fixes the current mismatch (tx args split on comma/newline only, total also on spaces).

- [x] **4. Create `parseAmounts`** — `src/utils/parseAmounts/parseAmounts.ts`: tokenize with `parseList`; each token must be a non-negative integer in base units (digits only); return an object with the valid values as a `bigint` array and the list of invalid tokens (decimals, negatives, garbage) so the UI can block sending and show them.

- [x] **5. Rewrite `calculateTotal` to BigInt** — in `src/utils/calculateTotal/calculateTotal.ts`, return the `bigint` sum of `parseAmounts(input).values`. Keep the function name and path so existing imports keep working.

- [x] **6. Create the test-values utilities** — `src/utils/testValues/getDefaultTestValues.ts`:
  - [x] `getDefaultTestValues(chainId)`: returns the `{ tokenAddress, recipients, amounts }` entry from `defaultTestValues`, or null for chains without test values (mainnet, zkSync, etc.).
  - [x] `isEmptyFields(fields)`: true when all three fields are empty or whitespace.
  - [x] `resolveFieldsOnChainChange(current, prevChainId, nextChainId)`: if `current` is empty or exactly equals the previous chain's defaults, return the next chain's defaults (or empty fields if the next chain has none); otherwise return `current` unchanged (user edits are preserved).

- [x] **7. Re-export utilities** — add `parseList`, `parseAmounts` and the test-values functions to `src/utils/index.ts`.

- [x] **8. Create the `useAirdropFormState` hook** — new folder `src/hooks/`, file `useAirdropFormState.ts` with the "use client" directive.
  - [x] Hold `tokenAddress`, `recipients`, `amounts` in state; expose setters that also write the existing keys `airdrop_tokenAddress`, `airdrop_recipients`, `airdrop_amounts`.
  - [x] Handle initial load and chain changes in a single effect keyed on chainId, so ordering is deterministic: on first run read localStorage; if all three are empty, apply `getDefaultTestValues(chainId)`; on later chainId changes apply `resolveFieldsOnChainChange` with a ref holding the chain whose values are currently applied. Touch localStorage only inside effects (static-export safety).
  - [x] Write applied defaults to localStorage too (the "equals previous chain's defaults" check still distinguishes them from user edits after a reload).
  - [x] Expose `loadTestValues()` (overwrite the fields with the current chain's defaults) and `hasTestValues` (whether the current chain has any).
  - [x] This handles the reconnect flicker: if chainId briefly reports another chain before settling on the wallet's, untouched defaults are swapped to the correct chain.

- [x] **9. Create `FaucetButton`** — `src/components/ui/FaucetButton.tsx` with "use client".
  - [x] Read the connected account and its chain; look up `chainsToFaucet`; render nothing if there is no entry or no connected account.
  - [x] On click, call the faucet `mint` for the configured token, to the connected address, amount = configured whole tokens multiplied by 10 to the power of decimals; await the receipt and check `status === "success"`.
  - [x] Own loading, success and error text; surface the revert reason (e.g. faucet permissioned or over the cap) instead of a generic error. Accept an optional `onMinted` callback. Match `SendButton` styling.
  - [x] Optionally read `isPermissioned()` and disable the button with an explanatory message when true.
  - [x] Import the core actions from `wagmi/actions` (same @wagmi/core version as the wagmi v2 config) rather than the top-level `@wagmi/core` v3 package.

- [x] **10. Update `TxDetails`** — in `src/components/ui/TxDetails.tsx`, change the `total` prop type to `bigint`, compare against zero as a bigint, render it with `toString`, and receive the token-unit amount already formatted by the parent.

- [x] **11. Refactor `AirdropForm` to use the new pieces** — `src/components/AirdropForm.tsx`.
  - [x] Replace its field `useState`s, localStorage effect and persisting setters with `useAirdropFormState(chainId)`.
  - [x] Compute `total` with the bigint `calculateTotal`, and the token amount with viem `formatUnits(total, decimals)` instead of the float division; treat decimals as unknown only when undefined, not when zero.
  - [x] Render `FaucetButton` above the inputs, and a small "Load test values" text button when `hasTestValues` is true.
  - [x] Add a short helper text under the Amounts field: amounts are in the token's smallest unit (e.g. 1000000 = 1 USDC).
  - [x] Show invalid amount tokens from `parseAmounts` inline and disable the send action while any exist.

- [x] **12. Fix the tx flow in `handleSendTokens`** — same file.
  - [x] Guard a missing `chainsToTSender[chainId]` entry and set an "Unsupported chain" error result instead of throwing a TypeError.
  - [x] Make `getApprovedAmount` return a `bigint` (remove the `as number` cast); compare allowance with the bigint total, approve exactly the total, and check the approval receipt status.
  - [x] Build args with `parseList(recipients)` and `parseAmounts(amounts).values`; validate there is at least one recipient, the counts match and there are no invalid tokens before sending.
  - [x] Keep the hash returned by the airdrop `writeContractAsync` (drop the stale `useWriteContract().data` usage), await `waitForTransactionReceipt`, and set success only if the receipt status is "success"; otherwise set an error result with the hash.
  - [x] Switch `readContract` / `waitForTransactionReceipt` imports to `wagmi/actions`.

- [ ] **13. Vercel configuration check** — confirm `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in the Vercel project for Production and Preview (it is read with a non-null assertion); no new env vars are introduced. Redeploy after merging.

- [ ] **14. Verify** — run `pnpm lint`, `pnpm test` and `pnpm build`; then perform the manual Sepolia checks in the Testing Strategy.

---

## Unit Tests

- [x] `parseList: splits on commas, newlines, spaces, tabs and mixed separators` — `src/utils/parseList/parseList.test.ts`
- [x] `parseList: trims entries and drops empties (leading/trailing/consecutive separators, empty string)` — same file
- [x] `parseAmounts: returns bigint values for valid integer tokens` — `src/utils/parseAmounts/parseAmounts.test.ts`
- [x] `parseAmounts: reports decimals, negatives and non-numeric tokens as invalid and excludes them from values` — same file
- [x] `parseAmounts: handles values above 2^53 exactly (e.g. 1e18 amounts)` — same file
- [x] `calculateTotal: sums comma/space/newline/mixed separated amounts as bigint` — `src/utils/calculateTotal/calculateTotal.test.ts` (rewrite: remove the decimal, negative, NaN and "123invalid → 123" parseFloat cases)
- [x] `calculateTotal: returns 0n for empty or whitespace input` — same file
- [x] `calculateTotal: precise sum of large values (two 1e18 amounts plus 1 wei)` — same file
- [x] `getDefaultTestValues: returns Sepolia values for 11155111 and Anvil values for 31337` — `src/utils/testValues/getDefaultTestValues.test.ts`
- [x] `getDefaultTestValues: returns null for chains without test values (1, 324)` — same file
- [x] `getDefaultTestValues: Sepolia default token equals the chainsToFaucet token` — same file (guards against drift)
- [x] `getDefaultTestValues: default recipients and amounts have matching counts and all amounts parse as valid` — same file
- [x] `isEmptyFields: true for empty/whitespace-only fields, false otherwise` — same file
- [x] `resolveFieldsOnChainChange: untouched Anvil defaults are swapped for Sepolia defaults` — same file
- [x] `resolveFieldsOnChainChange: empty fields are filled with the next chain's defaults` — same file
- [x] `resolveFieldsOnChainChange: user-edited fields are preserved` — same file
- [x] `resolveFieldsOnChainChange: untouched defaults are cleared when switching to a chain without test values` — same file

---

## Documentation Updates

- [x] `AGENTS.md` — update the architecture tree (`src/hooks/useAirdropFormState.ts`, `src/components/ui/FaucetButton.tsx`, `src/utils/parseList`, `src/utils/parseAmounts`, `src/utils/testValues`); update the `rainbowKitConfig.tsx` supported-chains note to anvil, zksync, mainnet, sepolia and mention `initialChain` = Sepolia.
- [x] `AGENTS.md` Conventions — document default test values (per chain, applied when storage is empty, swapped only while untouched, "Load test values" button); amounts are integers in base units, invalid tokens block sending; all splitting goes through `parseList`; add `chainsToFaucet` / `defaultTestValues` to the list of things that live in `constants.ts`; the tx flow calls `airdropERC20` and waits for the receipt (fix the current "call `airdrop`" wording).
- [x] `AGENTS.md` Pitfalls — when adding a chain, also consider `defaultTestValues` and `chainsToFaucet`; import core actions from `wagmi/actions`.
- [x] `README.md` — add a "Trying the live demo on Sepolia" section: switch the wallet to Sepolia, get Sepolia ETH from a faucet (Google Cloud, sepolia-faucet.pk910.de, Alchemy), click "Mint test USDC", send with the prefilled values; correct the "Supported Chains" table to reflect which chains the wallet config actually offers.
- [x] Inline comments — brief comments on `resolveFieldsOnChainChange` (why "equals previous defaults" means untouched) and on the faucet amount/cap in `chainsToFaucet`.

---

## Testing Strategy

- **Unit tests:** all pure logic in `src/utils/` (tokenizing, BigInt parsing and totals, default selection, chain-switch rule) via `pnpm test`.
- **Integration tests:** none added. The existing Playwright spec (`test/playwright/basic.spec.ts`) only covers connect and render and switches to Anvil explicitly; run `pnpm e2e` to confirm nothing regressed.
- **Manual verification (Vercel Preview):**
  1. Open the preview URL with an empty localStorage: the form shows the Sepolia defaults.
  2. Connect MetaMask on Sepolia with a little Sepolia ETH; click "Mint test USDC" and confirm the receipt succeeds.
  3. Click Send: approve tx, then airdrop tx; the success modal appears only after the airdrop confirms; check recipient balances on sepolia.etherscan.io.
  4. Switch to Anvil locally (`pnpm anvil` + `pnpm dev`): untouched defaults swap to the mock token values and the airdrop succeeds from anvil account #0.
  5. Edit a field, switch chains: the edited values stay. Click "Load test values": defaults are restored.
  6. Type `1.5` or `-3` as an amount: the invalid tokens are shown and Send is blocked.
  7. Switch the wallet to an unsupported chain: an "Unsupported chain" message appears instead of a crash.

---

## Assumptions & Decisions

| # | Assumption / Decision | Rationale |
|---|-----------------------|-----------|
| 1 | Use the public Sepolia testnet instead of hosting Anvil (Railway/Fly/VPS) or Tenderly/BuildBear | Free and permanent, no server to run, MetaMask knows Sepolia already, TSender is already deployed there. Hosted Anvil needs HTTPS, exposes public keys, loses state and collides with chain 31337; Tenderly Virtual TestNets are now paid. |
| 2 | Option B (hook + components) chosen over Option A (minimal inline) | Unit-testable decision logic, data-only extension for new chains, no parsing mismatch; accepted cost is more files and a new `src/hooks/` folder. |
| 3 | Test token on Sepolia: Aave v3 faucet USDC (6 decimals), minted via the open faucet contract | Anyone can mint without leaving the app; `isPermissioned()` returned false when checked during research. |
| 4 | Keep existing chains (anvil, zksync, mainnet) and add sepolia | Developer choice; local Anvil workflow and e2e remain intact. |
| 5 | Public RPC only, no env var | Developer choice; acceptable rate limits for a demo. A `transports` override can be added later without an env var. |
| 6 | Sepolia is first in `chains` and is the `initialChain` | Vercel visitors see working Sepolia defaults before/without connecting; `initialChain` alone does not change wagmi's `chains[0]` fallback for `useChainId()`. |
| 7 | Amounts are integers in base units; invalid tokens block sending | Keeps current wei semantics, avoids silent mismatch between displayed total and tx args. |
| 8 | On chain switch, swap only untouched defaults; provide a "Load test values" button | Test values follow the chain without clobbering user edits; returning users with stored values can still load defaults. |
| 9 | Fix amount splitting, BigInt total and await airdrop receipt in this task | Developer choice; required for the default values to actually work end-to-end. |
| 10 | Import core actions from `wagmi/actions` in touched code | The top-level `@wagmi/core` ^3 differs from the version bundled with wagmi v2; aligning avoids a latent incompatibility without changing dependencies. |
| 11 | "Mint test USDC" mints 1000 USDC per click | Developer decision; enough for many test airdrops while staying well below the faucet cap. |

---

## Open Questions

- [x] Confirm on-chain, right before implementation, that the Aave faucet `0xC959…f42D` is still unpermissioned and that its cap is 10000 whole tokens per mint (Aave has rotated testnet deployments in the past). — Verified 2026-09-24: `isPermissioned()` = false, `MAX_MINT_AMOUNT()` = 10000, token decimals = 6.

---

## Out of Scope

- Hosting a public Anvil node or using Tenderly/BuildBear virtual testnets.
- Deploying our own TSender or mock ERC-20 contract on any chain.
- Adding Optimism, Arbitrum or Base to the wallet config (they are in `chainsToTSender` but not in `chains`).
- Accepting decimal amounts in token units (`parseUnits`).
- Handling USDT-style tokens that require resetting the allowance to 0 before approving.
- Aligning the `@wagmi/core` dependency version in `package.json`.
- Removing the tracked `.env.local` from git.
- New Playwright specs for the send or faucet flows.
