"use client"

import { useState } from "react"
import { useAccount, useConfig, useReadContract, useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from "wagmi/actions"
import { parseUnits } from "viem"
import { aaveFaucetAbi, chainsToFaucet } from "@/constants"
import { getErrorMessage } from "@/utils"

interface FaucetButtonProps {
    onMinted?: () => void
}

export default function FaucetButton({ onMinted }: FaucetButtonProps) {
    const { address, chainId } = useAccount()
    const config = useConfig()
    const { writeContractAsync } = useWriteContract()
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
    const faucet = chainId !== undefined ? chainsToFaucet[chainId] : undefined
    const { data: isPermissioned } = useReadContract({
        abi: aaveFaucetAbi,
        address: faucet?.faucet,
        functionName: "isPermissioned",
        chainId,
        query: { enabled: !!faucet },
    })

    if (!faucet || !address) return null

    async function handleMint() {
        if (!faucet || !address) return
        setIsLoading(true)
        setStatus(null)
        try {
            const hash = await writeContractAsync({
                abi: aaveFaucetAbi,
                address: faucet.faucet,
                functionName: "mint",
                args: [faucet.token, address, parseUnits(String(faucet.mintAmount), faucet.decimals)],
                chainId,
            })
            const receipt = await waitForTransactionReceipt(config, { hash, chainId })
            if (receipt.status !== "success") {
                setStatus({ success: false, message: `Mint transaction reverted (${hash})` })
                return
            }
            setStatus({ success: true, message: `Minted ${faucet.mintAmount} ${faucet.label}` })
            onMinted?.()
        } catch (error) {
            const message = getErrorMessage(error)
            setStatus({ success: false, message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={handleMint}
                disabled={isLoading || isPermissioned === true}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {isLoading ? "Minting..." : `Mint test ${faucet.label}`}
            </button>
            {isPermissioned === true && (
                <p className="text-xs text-gray-500">The faucet is currently permissioned; minting is disabled.</p>
            )}
            {status && (
                <p className={`text-xs ${status.success ? "text-green-600" : "text-red-600"}`}>{status.message}</p>
            )}
        </div>
    )
}
