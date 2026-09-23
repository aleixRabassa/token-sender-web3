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

## Trying the live demo on Sepolia

The deployed app targets the public Sepolia testnet, where the TSender contract is already deployed. The form opens prefilled with working test values.

1. Connect your wallet and switch it to **Sepolia**.
2. Get some Sepolia ETH for gas from a faucet (e.g. [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [sepolia-faucet.pk910.de](https://sepolia-faucet.pk910.de), [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia)).
3. Click **Mint test USDC** to mint 1000 Aave test USDC to your address.
4. Click **Send Tokens** with the prefilled values: approve, then airdrop. Check the recipients on [sepolia.etherscan.io](https://sepolia.etherscan.io).

Amounts are entered in the token's smallest unit (`1000000` = 1 USDC). Use **Load test values** to restore the defaults.

## Local Development with Anvil

`pnpm anvil` loads a pre-deployed contract state from `tsender-deployed.json`. Do **not** run a plain `anvil` — the contracts won't exist.

## Testing

- **Unit tests** (vitest): `pnpm test` — tests live alongside source in `src/utils/**/`
- **E2E tests** (Playwright + Synpress): `pnpm e2e` — requires the dev server running on port 3000 and a MetaMask wallet configured via `test/wallet-setup/basic.setup.ts`

## Supported Chains

Chains offered by the wallet config (`src/rainbowKitConfig.tsx`):

| Chain | ID | Notes |
|---|---|---|
| Sepolia | 11155111 | Default chain; test values + "Mint test USDC" faucet |
| Anvil (local) | 31337 | Test values for the mock token in `tsender-deployed.json` |
| zkSync | 324 | |
| Mainnet | 1 | |

TSender addresses for Optimism (10), Arbitrum (42161) and Base (8453) exist in `src/constants.ts` but those chains are not in the wallet config.

## Architecture

See [AGENTS.md](AGENTS.md) for a full breakdown of the project structure and conventions.
