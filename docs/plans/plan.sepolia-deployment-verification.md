# Plan: sepolia-deployment-verification — Vercel configuration and final verification of the Sepolia deployment

> **Jira:** sepolia-deployment (follow-up)  
> **Date:** 2026-09-24  
> **Author:** aleix.rabassa (planned with Claude Code)

---

## Overview

Pending steps 13 and 14 carried over from [plan.sepolia-deployment.md](plan.sepolia-deployment.md). The code changes for Steps 1–12 are done, and review [review.sepolia-deployment.md](../reviews/review.sepolia-deployment.md) has no open blockers or warnings. What remains is configuring the Vercel project and verifying the app by hand on Sepolia.

---

## Scope & Affected Areas

| Area | Type | Notes |
|------|------|-------|
| Vercel project settings | Config | Environment variable for Production and Preview |
| Vercel Preview deployment | Verification | Manual Sepolia checks |
| Local dev (`pnpm anvil` + `pnpm dev`) | Verification | Anvil checks and e2e |

No code changes are expected. If a check fails, fix it under the original task.

---

## Implementation Steps

- [ ] **13. Vercel configuration**
  - [ ] Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in the Vercel project for **Production** and **Preview** (as of 2026-09-24 it was **not set**). `rainbowKitConfig.tsx` reads it with a non-null assertion, so it is required. No other env vars are needed.
  - [ ] Redeploy after merging, because `NEXT_PUBLIC_*` values are inlined at build time.

- [ ] **14. Verify**
  - [ ] Automated gates: `eslint src`, `npx vitest run` and `pnpm build`. They passed on 2026-09-24 with 20 tests; run them again after merging.
    - Note: `pnpm lint` lints the whole repo and fails on the vendored `.cache-synpress/` MetaMask bundle and `xvfb-test.js`. This is a pre-existing problem and unrelated to this task.
  - [ ] `pnpm e2e` (dev server on :3000 plus Synpress MetaMask) to confirm the connect and render spec still passes.
  - [ ] Manual checks on the Vercel Preview URL:
    - [ ] 1. With empty localStorage (also clear `wagmi.store`), connect a wallet: the form shows the Sepolia defaults. The form only appears **after** connecting, because `page.tsx` shows the landing page until then (see review S13).
    - [ ] 2. Connect MetaMask on Sepolia with a little Sepolia ETH (Google Cloud, sepolia-faucet.pk910.de or Alchemy faucets). Click "Mint test USDC" and confirm the success message.
    - [ ] 3. Click Send: the approve tx runs, then the airdrop tx. The success modal appears only after the airdrop confirms. Check recipient balances on sepolia.etherscan.io.
    - [ ] 4. Locally, with `pnpm anvil` + `pnpm dev`, switch to Anvil: untouched defaults swap to the mock token values and the airdrop succeeds from anvil account #0.
    - [ ] 5. Edit a field, then switch chains: the edited values stay. Click "Load test values": the defaults are restored.
    - [ ] 6. Enter `1.5` or `-3` as an amount: the invalid tokens are listed and Send is disabled.
    - [ ] 7. Switch the wallet to an unsupported chain (e.g. Polygon) and click Send: an "Unsupported chain" message appears and nothing crashes.
    - [ ] 8. Reload with the wallet on a different chain than the stored defaults: the untouched defaults follow the current chain (review W8).

---

## Out of Scope

- Any code change not needed to fix a failed check.
- Findings justified in `review.sepolia-deployment.md` (S1, S2, S3, S7, S9, S11, S13).
