# TSender UI — Agent Instructions

A Next.js 15 (App Router) + wagmi v2 + RainbowKit v2 frontend for airdropping ERC-20 tokens across multiple EVM chains.

## Key commands

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Unit tests (vitest) | `pnpm test` |
| E2E tests (Playwright + Synpress) | `pnpm e2e` (requires running dev server + MetaMask) |
| Local chain | `pnpm anvil` (loads pre-deployed state from `tsender-deployed.json`) |
| Lint | `pnpm lint` |
| Build | `pnpm build` |

> Node ≥ 20 is required. Use `nvm use 20` if you see version errors.

## Architecture

```
src/
  app/              # Next.js App Router (layout, page, providers, globals.css)
  components/       # React components
    AirdropForm.tsx # Main feature: token address, recipients, amounts → airdrop tx
    Header.tsx
    HomeContent.tsx # Renders AirdropForm or connect-wallet prompt
    ui/             # Presentational sub-components (InputField, SendButton, TxDetails, TxResultModal)
      FaucetButton.tsx # "Mint test USDC" button, rendered only on chains with a chainsToFaucet entry
  hooks/
    useAirdropFormState.ts # Form fields, localStorage persistence and chain-aware default test values
  constants.ts      # Contract addresses (chainsToTSender, chainsToFaucet), defaultTestValues and ABIs (erc20Abi, tsenderAbi, aaveFaucetAbi)
  rainbowKitConfig.tsx  # wagmi/RainbowKit config — supported chains: sepolia (first = fallback chain), anvil, zksync, mainnet
  utils/
    index.ts        # Re-exports
    parseList/      # Shared tokenizer for recipients and amounts (+ tests)
    parseAmounts/   # BigInt amount parsing with invalid-token reporting (+ tests)
    calculateTotal/ # BigInt total of the amounts input (+ tests)
    testValues/     # getDefaultTestValues, isEmptyFields, resolveFieldsOnChainChange (+ tests)
    getErrorMessage/ # Concise viem/wagmi error text (shortMessage) for the UI (+ tests)
test/
  wallet-setup/     # Synpress MetaMask wallet setup
  playwright/       # E2E specs using Synpress + MetaMask fixtures
```

## Conventions

- **"use client"** directive is required on any component that uses wagmi hooks or browser APIs.
- **Providers** (`src/app/providers.tsx`): WagmiProvider → QueryClientProvider → RainbowKitProvider (`initialChain` = Sepolia). Mounting is guarded with `useSyncExternalStore` to avoid SSR hydration issues (`ssr: false` in rainbowKitConfig).
- **Contract addresses and per-chain data** live exclusively in `src/constants.ts` (`chainsToTSender`, `chainsToFaucet`, `defaultTestValues`). Chain IDs used: 1 (mainnet), 10 (Optimism), 42161 (Arbitrum), 8453 (Base), 324 (zkSync), 31337 (Anvil), 11155111 (Sepolia).
- **Form state** is owned by `useAirdropFormState(chainId)` and persisted to `localStorage` with keys `airdrop_tokenAddress`, `airdrop_recipients`, `airdrop_amounts`.
- **Default test values** (`defaultTestValues`, per chain) are applied when storage is empty, swapped on chain change only while the fields are empty or exactly equal some chain's defaults (user edits are preserved), and can be restored with the "Load test values" button.
- **List parsing**: recipients, amounts and the total all go through `parseList` (newline-, comma- or whitespace-separated).
- **Amounts** are non-negative integers in the token's base units (e.g. `1000000` = 1 USDC). `parseAmounts` returns BigInt values plus invalid tokens; any invalid token blocks sending. `calculateTotal` returns a `bigint`.
- **Tx flow** in `AirdropForm`: read allowance → approve exactly the total if needed (and check the receipt) → call `airdropERC20` on TSender → wait for the receipt; success is shown only when the receipt status is `success`.
- Path alias `@/` maps to `src/` (configured in `tsconfig.json`).

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Required for RainbowKit WalletConnect modal |

## Testing

- **Unit tests**: vitest with jsdom. Tests live alongside source in `src/utils/**/`.  
  Run: `pnpm test`
- **E2E tests**: Playwright + Synpress (MetaMask automation). Tests are in `test/playwright/`. Requires the dev server running on `http://localhost:3000` and a pre-configured MetaMask wallet (see `test/wallet-setup/basic.setup.ts`).  
  Run: `pnpm e2e`

## Pitfalls

- The `pnpm anvil` command loads a pre-deployed state snapshot (`tsender-deployed.json`) — do not run a plain `anvil` or contracts won't exist.
- E2E tests are **not** parallelized (`workers: 1`, `fullyParallel: false`) because Synpress requires exclusive MetaMask access.
- When adding a new chain, update **both** `chainsToTSender` in `constants.ts` and the `chains` array in `rainbowKitConfig.tsx`; also consider adding `defaultTestValues` and `chainsToFaucet` entries.
- Import core actions (`readContract`, `waitForTransactionReceipt`, …) from `wagmi/actions`, not the top-level `@wagmi/core` package (it is v3 and differs from the version bundled with wagmi v2).
- wagmi persists the last chain in `localStorage["wagmi.store"]`; clear it to see the Sepolia fallback as a fresh visitor would.
