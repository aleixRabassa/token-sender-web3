# TSender UI

A Next.js 15 + wagmi v2 + RainbowKit v2 frontend for airdropping ERC-20 tokens to multiple recipients across EVM chains.

## Requirements

- Node ≥ 20 (`nvm use 20`)
- pnpm
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable set

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm e2e` |
| Local chain | `pnpm anvil` |
| Lint | `pnpm lint` |

## Local Development with Anvil

`pnpm anvil` loads a pre-deployed contract state from `tsender-deployed.json`. Do **not** run a plain `anvil` — the contracts won't exist.

## Testing

- **Unit tests** (vitest): `pnpm test` — tests live alongside source in `src/utils/**/`
- **E2E tests** (Playwright + Synpress): `pnpm e2e` — requires the dev server running on port 3000 and a MetaMask wallet configured via `test/wallet-setup/basic.setup.ts`

## Supported Chains

| Chain | ID |
|---|---|
| Mainnet | 1 |
| Optimism | 10 |
| Arbitrum | 42161 |
| Base | 8453 |
| zkSync | 324 |
| Sepolia | 11155111 |
| Anvil (local) | 31337 |

## Architecture

See [AGENTS.md](AGENTS.md) for a full breakdown of the project structure and conventions.
