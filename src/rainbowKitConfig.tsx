"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { anvil, zksync, mainnet } from "wagmi/chains";

export default getDefaultConfig({
    appName: "TSender",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [anvil, zksync, mainnet ],
    wallets: [
        {
            groupName: "Popular",
            wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
        },
    ],
    ssr: false
})