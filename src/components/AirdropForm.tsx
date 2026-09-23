"use client"

import InputField from "@/components/ui/InputField"
import TxDetails from "@/components/ui/TxDetails"
import TxResultModal from "@/components/ui/TxResultModal"
import SendButton from "@/components/ui/SendButton"
import FaucetButton from "@/components/ui/FaucetButton"
import { useMemo, useState } from "react"
import { chainsToTSender, erc20Abi, tsenderAbi } from "@/constants"
import { useChainId, useConfig, useAccount, useWriteContract, useReadContracts } from "wagmi"
import { readContract, waitForTransactionReceipt } from "wagmi/actions"
import { formatUnits, isAddress } from "viem"
import { calculateTotal, getErrorMessage, parseAmounts, parseList } from "@/utils"
import { useAirdropFormState } from "@/hooks/useAirdropFormState"

export default function AirdropForm() {
    const chainId = useChainId()
    const {
        tokenAddress, recipients, amounts,
        setTokenAddress, setRecipients, setAmounts,
        loadTestValues, hasTestValues,
    } = useAirdropFormState(chainId)
    const [isLoading, setIsLoading] = useState(false)
    const [txResult, setTxResult] = useState<{ success: boolean; error?: string } | null>(null)
    const config = useConfig()
    const account = useAccount()
    const parsedAmounts = useMemo(() => parseAmounts(amounts), [amounts])
    const total: bigint = useMemo(() => calculateTotal(amounts), [amounts])
    const invalidAmounts = parsedAmounts.invalid
    const { writeContractAsync } = useWriteContract()
    const isValidAddress = isAddress(tokenAddress.trim())
    const { data: tokenData } = useReadContracts({
        contracts: [
            {
                abi: erc20Abi,
                address: tokenAddress.trim() as `0x${string}`,
                functionName: "name",
            },
            {
                abi: erc20Abi,
                address: tokenAddress.trim() as `0x${string}`,
                functionName: "decimals",
            },
        ],
        query: { enabled: isValidAddress },
    })
    const tokenName = tokenData?.[0]?.result
    const tokenDecimals = tokenData?.[1]?.result
    const amountInTokens = useMemo(() => {
        if (total === BigInt(0) || tokenDecimals === undefined) return null
        return formatUnits(total, Number(tokenDecimals))
    }, [total, tokenDecimals])

    async function getApprovedAmount(tSenderAddress: `0x${string}`): Promise<bigint> {
        console.log("[getApprovedAmount] Reading allowance for token:", tokenAddress, "from account:", account.address, "to tSender:", tSenderAddress)

        // read from the chain to see if we have approved enough token
        const response = await readContract(config, {
            abi: erc20Abi,
            address: tokenAddress.trim() as `0x${string}`,
            functionName: "allowance",
            args: [account.address, tSenderAddress],
            chainId,
        })

        console.log("[getApprovedAmount] Approved amount for tSender:", tSenderAddress, "is", response)

        return response as bigint
    }

    async function handleSendTokens() {
        setIsLoading(true)
        setTxResult(null)
        try {
            if (!account.address) {
                setTxResult({ success: false, error: "Connect your wallet first." })
                return
            }
            // useChainId() only reports configured chains, so compare with the wallet's real chain.
            const tSender = chainsToTSender[chainId]?.tsender
            if (!tSender || account.chainId !== chainId) {
                setTxResult({ success: false, error: "Unsupported chain: TSender is not deployed on this network." })
                return
            }
            const tSenderAddress = tSender.trim() as `0x${string}`

            if (!isValidAddress) {
                setTxResult({ success: false, error: "Invalid token address." })
                return
            }
            const recipientList = parseList(recipients)
            const { values: amountList, invalid } = parsedAmounts
            if (invalid.length > 0) {
                setTxResult({ success: false, error: `Invalid amounts: ${invalid.join(", ")}` })
                return
            }
            if (recipientList.length === 0) {
                setTxResult({ success: false, error: "Add at least one recipient." })
                return
            }
            const invalidRecipients = recipientList.filter(r => !isAddress(r))
            if (invalidRecipients.length > 0) {
                setTxResult({ success: false, error: `Invalid recipient addresses: ${invalidRecipients.join(", ")}` })
                return
            }
            if (total === BigInt(0)) {
                setTxResult({ success: false, error: "The total amount must be greater than zero." })
                return
            }
            if (recipientList.length !== amountList.length) {
                setTxResult({ success: false, error: `Recipients (${recipientList.length}) and amounts (${amountList.length}) must have the same count.` })
                return
            }

            const approvedAmount = await getApprovedAmount(tSenderAddress)

            console.log("[handleSendTokens] Total amount to send:", total, "Approved amount:", approvedAmount)

            if (approvedAmount < total) {
                console.log("[handleSendTokens] Not enough approved tokens, sending approval transaction...")

                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress.trim() as `0x${string}`,
                    functionName: "approve",
                    args: [tSenderAddress, total],
                    chainId,
                })

                const approvalReceipt = await waitForTransactionReceipt(config, { hash: approvalHash, chainId })

                console.log("[handleSendTokens] Approval transaction confirmed, receipt:", approvalReceipt)

                if (approvalReceipt.status !== "success") {
                    setTxResult({ success: false, error: `Approval transaction reverted (${approvalHash})` })
                    return
                }
            }

            const airdropHash = await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress,
                functionName: "airdropERC20",
                args: [
                    tokenAddress.trim() as `0x${string}`,
                    recipientList as `0x${string}`[],
                    amountList,
                    total
                ],
                chainId,
            })

            console.log("[handleSendTokens] Airdrop transaction sent, hash:", airdropHash)

            const airdropReceipt = await waitForTransactionReceipt(config, { hash: airdropHash, chainId })
            if (airdropReceipt.status !== "success") {
                setTxResult({ success: false, error: `Airdrop transaction reverted (${airdropHash})` })
                return
            }
            setTxResult({ success: true })
        } catch (error) {
            const message = getErrorMessage(error)
            setTxResult({ success: false, error: message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <FaucetButton />
            {hasTestValues && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={loadTestValues}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Load test values
                    </button>
                </div>
            )}
            <InputField
                label="Token Address"
                placeholder="0x..."
                value={tokenAddress}
                onChange={e => setTokenAddress(e.target.value)}
            />
            <InputField
                label="Recipients"
                placeholder="0x..., 0x..., 0x..."
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                multiline
            />
            <div className="flex flex-col gap-1">
                <InputField
                    label="Amounts"
                    placeholder="100, 200,300"
                    value={amounts}
                    onChange={e => setAmounts(e.target.value)}
                    multiline
                />
                <p className="text-xs text-gray-500">
                    Amounts are in the token&apos;s smallest unit (e.g. 1000000 = 1 USDC).
                </p>
                {invalidAmounts.length > 0 && (
                    <p className="text-xs text-red-600">
                        Invalid amounts (whole numbers only): {invalidAmounts.join(", ")}
                    </p>
                )}
            </div>
            <TxDetails
                tokenName={tokenName ? String(tokenName) : undefined}
                total={total}
                amountInTokens={amountInTokens}
            />
            <SendButton isLoading={isLoading} disabled={invalidAmounts.length > 0} onClick={handleSendTokens} />
            {txResult && (
                <TxResultModal
                    success={txResult.success}
                    error={txResult.error}
                    onClose={() => setTxResult(null)}
                />
            )}
        </div>
    );
}
