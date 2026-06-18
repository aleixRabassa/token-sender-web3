const features = [
    {
        title: "Batch Airdrops",
        description:
            "Send to hundreds of recipients in one transaction. No more looping through individual transfers.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
            >
                <path d="M16 3h5v5" />
                <path d="M21 3l-7 7" />
                <path d="M8 21H3v-5" />
                <path d="M3 21l7-7" />
            </svg>
        ),
    },
    {
        title: "Single Approval",
        description:
            "Approve the TSender contract once for the total amount, and let it handle the rest.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
            >
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.76 1.02 6.39 2.66" />
            </svg>
        ),
    },
    {
        title: "Multi-Chain",
        description:
            "Works on Anvil (local), zkSync, and Ethereum mainnet out of the box.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15 15 0 0 1 0 20" />
                <path d="M12 2a15 15 0 0 0 0 20" />
            </svg>
        ),
    },
]

export default function Features() {
    return (
        <section className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
                Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-3"
                    >
                        <div className="text-blue-600 dark:text-blue-400">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
