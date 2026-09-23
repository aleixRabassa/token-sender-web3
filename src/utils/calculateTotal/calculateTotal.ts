import { parseAmounts } from "../parseAmounts/parseAmounts"

export function calculateTotal(amounts: string): bigint {
    return parseAmounts(amounts).values.reduce((acc, n) => acc + n, BigInt(0))
}
