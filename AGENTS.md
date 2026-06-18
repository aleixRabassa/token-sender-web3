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
  constants.ts      # Contract addresses (chainsToTSender) and ABIs (erc20Abi, tsenderAbi)
  rainbowKitConfig.tsx  # wagmi/RainbowKit config — supported chains: anvil, zksync, mainnet
  utils/
    index.ts        # Re-exports
    calculateTotal/ # Pure utility + vitest unit tests
test/
  wallet-setup/     # Synpress MetaMask wallet setup
  playwright/       # E2E specs using Synpress + MetaMask fixtures
```

## Conventions

- **"use client"** directive is required on any component that uses wagmi hooks or browser APIs.
- **Providers** (`src/app/providers.tsx`): WagmiProvider → QueryClientProvider → RainbowKitProvider. Mounting is guarded with `useState/useEffect` to avoid SSR hydration issues (`ssr: false` in rainbowKitConfig).
- **Contract addresses** live exclusively in `src/constants.ts` (`chainsToTSender`). Chain IDs used: 1 (mainnet), 10 (Optimism), 42161 (Arbitrum), 8453 (Base), 324 (zkSync), 31337 (Anvil), 11155111 (Sepolia).
- **Form state** is persisted to `localStorage` with keys `airdrop_tokenAddress`, `airdrop_recipients`, `airdrop_amounts`.
- **Amounts input** accepts newline-, comma-, or space-separated values. `calculateTotal` in `src/utils/calculateTotal/calculateTotal.ts` parses this format.
- **Tx flow** in `AirdropForm`: read allowance → approve if needed → call `airdrop` on TSender contract.
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
- When adding a new chain, update **both** `chainsToTSender` in `constants.ts` and the `chains` array in `rainbowKitConfig.tsx`.
