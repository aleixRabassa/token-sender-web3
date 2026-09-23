import { defaultTestValues, type AirdropFields } from "@/constants"

const EMPTY_FIELDS: AirdropFields = { tokenAddress: "", recipients: "", amounts: "" }

export function getDefaultTestValues(chainId: number): AirdropFields | null {
    return defaultTestValues[chainId] ?? null
}

export function isEmptyFields(fields: AirdropFields): boolean {
    return fields.tokenAddress.trim() === "" && fields.recipients.trim() === "" && fields.amounts.trim() === ""
}

function equalsFields(a: AirdropFields, b: AirdropFields): boolean {
    return a.tokenAddress === b.tokenAddress && a.recipients === b.recipients && a.amounts === b.amounts
}

// Fields that exactly equal some chain's defaults were never edited by the user (any keystroke
// makes them differ), so they can safely follow the chain; anything else is preserved. Matching any
// chain's defaults, not only the previous chain's, keeps this working after a reload on another chain.
export function resolveFieldsOnChainChange(current: AirdropFields, nextChainId: number): AirdropFields {
    const untouched = isEmptyFields(current) || Object.values(defaultTestValues).some(d => equalsFields(current, d))
    if (!untouched) return current
    return getDefaultTestValues(nextChainId) ?? EMPTY_FIELDS
}
