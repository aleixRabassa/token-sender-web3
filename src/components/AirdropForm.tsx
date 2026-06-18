"use client"

import InputField from "@/components/ui/InputField"
import TxDetails from "@/components/ui/TxDetails"
import TxResultModal from "@/components/ui/TxResultModal"
import SendButton from "@/components/ui/SendButton"
import { useMemo, useState, useEffect } from "react"
import { chainsToTSender, erc20Abi, tsenderAbi } from "@/constants"
import { useChainId, useConfig, useAccount, useWriteContract, useReadContracts } from "wagmi"
import { readContract, waitForTransactionReceipt } from "@wagmi/core"
import { calculateTotal } from "@/utils"

export default function AirdropForm() {
    const [tokenAddress, setTokenAddressState] = useState("")
    const [recipients, setRecipientsState] = useState("")
    const [amounts, setAmountsState] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [txResult, setTxResult] = useState<{ success: boolean; error?: string } | null>(null)
    const chainId = useChainId()
    const config = useConfig()
    const account = useAccount()
    const total: number = useMemo(() => calculateTotal(amounts), [amounts])
    const { data: hash, writeContractAsync } = useWriteContract()
    const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(tokenAddress.trim())
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
        if (!total || !tokenDecimals) return null
        return (total / Math.pow(10, Number(tokenDecimals))).toString()
    }, [total, tokenDecimals])

    useEffect(() => {
        setTokenAddressState(localStorage.getItem("airdrop_tokenAddress") ?? "")
        setRecipientsState(localStorage.getItem("airdrop_recipients") ?? "")
        setAmountsState(localStorage.getItem("airdrop_amounts") ?? "")
    }, [])

    function setTokenAddress(value: string) {
        setTokenAddressState(value)
        localStorage.setItem("airdrop_tokenAddress", value)
    }
    function setRecipients(value: string) {
        setRecipientsState(value)
        localStorage.setItem("airdrop_recipients", value)
    }
    function setAmounts(value: string) {
        setAmountsState(value)
        localStorage.setItem("airdrop_amounts", value)
    }

    async function getApprovedAmount(tSenderAddress: string | null): Promise<number> {

        console.log("[getApprovedAmount] Checking approved amount for tSender:", tSenderAddress)

        if (!tSenderAddress) {
            alert("No address found, please use a supported chain")
            return 0
        }

        console.log("[getApprovedAmount] Reading allowance for token:", tokenAddress, "from account:", account.address, "to tSender:", tSenderAddress)

        // read from the chain to see if we have approvetd enough token
        const response = await readContract(config, {
            abi: erc20Abi,
            address: tokenAddress.trim() as `0x${string}`,
            functionName: "allowance",
            args: [account.address, tSenderAddress.trim() as `0x${string}`]
        })        

        console.log("[getApprovedAmount] Approved amount for tSender:", tSenderAddress, "is", response)

        return response as number
    }

    async function handleSendTokens() {
        setIsLoading(true)
        setTxResult(null)
        try {
            const tSenderAddress = chainsToTSender[chainId]["tsender"]
            const approvedAmount = await getApprovedAmount(tSenderAddress)
            
            console.log("[handleSendTokens] Total amount to send:", total, "Approved amount:", approvedAmount)

            if (approvedAmount < total) {

                console.log("[handleSendTokens] Not enough approved tokens, sending approval transaction...")

                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress.trim() as `0x${string}`,
                    functionName: "approve",
                    args: [tSenderAddress.trim() as `0x${string}`, BigInt(total)]
                })

                console.log("[handleSendTokens] Approval transaction sent, hash:", approvalHash)

                const approvalReceipt = await waitForTransactionReceipt(config, {
                    hash: approvalHash,
                })

                console.log("[handleSendTokens] Approval transaction confirmed, receipt:", approvalReceipt)
            }
            
            console.log("[handleSendTokens] Sufficient tokens already approved, skipping approval transaction.")

            await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress.trim() as `0x${string}`,
                functionName: "airdropERC20",
                args: [
                    tokenAddress.trim() as `0x${string}`,
                    recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
                    amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== '').map(amt => BigInt(amt)),
                    BigInt(total)
                ]
            })

            console.log("[handleSendTokens] Airdrop transaction sent, hash:", hash)
            setTxResult({ success: true })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            setTxResult({ success: false, error: message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 p-6">
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
            <InputField 
                label="Amounts" 
                placeholder="100, 200,300" 
                value={amounts}
                onChange={e => setAmounts(e.target.value)} 
                multiline
            />
            <TxDetails
                tokenName={tokenName ? String(tokenName) : undefined}
                total={total}
                amountInTokens={amountInTokens}
            />
            <SendButton isLoading={isLoading} onClick={handleSendTokens} />
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
