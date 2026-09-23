// viem and wagmi throw separate BaseError classes; both carry a concise shortMessage (e.g. the revert reason).
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return "shortMessage" in error && typeof error.shortMessage === "string" ? error.shortMessage : error.message
    }
    return String(error)
}
