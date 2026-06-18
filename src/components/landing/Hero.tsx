'use client'

import ConnectWalletButton from "./ConnectWalletButton"

export default function Hero() {
    return (
        <section
            data-testid="landing-hero"
            className="flex flex-col items-center text-center gap-6 py-16 md:py-24 px-6"
        >
            <h1 className="text-4xl md:text-5xl font-bold">Token Sender</h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                Send ERC-20 tokens to many addresses in a single transaction.
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                A batch airdrop tool powered by the TSender contract. Paste your
                token, your recipients, and your amounts — we handle the
                approval and the dispatch.
            </p>
            <ConnectWalletButton />
        </section>
    )
}
