import { parseList } from "../parseList/parseList"

export interface ParsedAmounts {
    values: bigint[]
    invalid: string[]
}

// Amounts are non-negative integers in the token's smallest unit (digits only).
export function parseAmounts(input: string): ParsedAmounts {
    const values: bigint[] = []
    const invalid: string[] = []
    for (const token of parseList(input)) {
        if (/^\d+$/.test(token)) {
            values.push(BigInt(token))
        } else {
            invalid.push(token)
        }
    }
    return { values, invalid }
}
