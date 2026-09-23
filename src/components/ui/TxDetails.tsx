interface TxDetailsProps {
    tokenName: string | undefined
    total: bigint
    amountInTokens: string | null
}

export default function TxDetails({ tokenName, total, amountInTokens }: TxDetailsProps) {
    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm flex flex-col gap-2">
            <h3 className="font-semibold text-base mb-1">Transaction Details</h3>
            <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Token Name</span>
                <span className="font-medium">{tokenName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Amount (base units)</span>
                <span className="font-medium font-mono">{total > BigInt(0) ? total.toString() : "—"}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Amount (tokens)</span>
                <span className="font-medium font-mono">{amountInTokens ?? "—"}</span>
            </div>
        </div>
    )
}
