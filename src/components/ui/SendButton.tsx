interface SendButtonProps {
    isLoading: boolean
    disabled?: boolean
    onClick: () => void
}

export default function SendButton({ isLoading, disabled = false, onClick }: SendButtonProps) {
    return (
        <div className="flex justify-center mt-2">
            <button
                onClick={onClick}
                disabled={isLoading || disabled}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {isLoading ? "Processing..." : "Send Tokens"}
            </button>
        </div>
    )
}
