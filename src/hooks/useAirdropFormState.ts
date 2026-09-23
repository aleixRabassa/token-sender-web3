"use client"

import { useEffect, useState } from "react"
import type { AirdropFields } from "@/constants"
import { getDefaultTestValues, resolveFieldsOnChainChange } from "@/utils"

const STORAGE_KEYS: Record<keyof AirdropFields, string> = {
    tokenAddress: "airdrop_tokenAddress",
    recipients: "airdrop_recipients",
    amounts: "airdrop_amounts",
}

function readStoredFields(): AirdropFields {
    // Providers only render children after mount, but guard anyway for static export safety.
    if (typeof window === "undefined") return { tokenAddress: "", recipients: "", amounts: "" }
    return {
        tokenAddress: localStorage.getItem(STORAGE_KEYS.tokenAddress) ?? "",
        recipients: localStorage.getItem(STORAGE_KEYS.recipients) ?? "",
        amounts: localStorage.getItem(STORAGE_KEYS.amounts) ?? "",
    }
}

// Empty storage gets the chain's defaults; stored untouched defaults of another chain follow the current chain.
function getInitialFields(chainId: number): AirdropFields {
    return resolveFieldsOnChainChange(readStoredFields(), chainId)
}

export function useAirdropFormState(chainId: number) {
    const [fields, setFields] = useState<AirdropFields>(() => getInitialFields(chainId))
    // Chain whose values are currently applied; untouched defaults follow a change of chain.
    const [appliedChainId, setAppliedChainId] = useState(chainId)

    if (appliedChainId !== chainId) {
        setAppliedChainId(chainId)
        setFields(f => resolveFieldsOnChainChange(f, chainId))
    }

    // Persist every change, including applied defaults (they are still recognised as untouched after a reload).
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.tokenAddress, fields.tokenAddress)
        localStorage.setItem(STORAGE_KEYS.recipients, fields.recipients)
        localStorage.setItem(STORAGE_KEYS.amounts, fields.amounts)
    }, [fields])

    const testValues = getDefaultTestValues(chainId)

    return {
        ...fields,
        setTokenAddress: (value: string) => setFields(f => ({ ...f, tokenAddress: value })),
        setRecipients: (value: string) => setFields(f => ({ ...f, recipients: value })),
        setAmounts: (value: string) => setFields(f => ({ ...f, amounts: value })),
        loadTestValues: () => {
            if (testValues) setFields(testValues)
        },
        hasTestValues: testValues !== null,
    }
}
