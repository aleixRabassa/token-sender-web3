'use client'

import { useConnectModal } from "@rainbow-me/rainbowkit"

export default function ConnectWalletButton() {
    const { openConnectModal } = useConnectModal()
    return (
        <button
            data-testid="landing-connect-wallet"
            onClick={() => openConnectModal?.()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium"
        >
            Connect Wallet
        </button>
    )
}
