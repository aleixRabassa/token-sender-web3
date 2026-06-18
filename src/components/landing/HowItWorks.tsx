const steps = [
    {
        title: "Connect your wallet",
        description:
            "Use the button above to connect MetaMask or any WalletConnect-compatible wallet.",
    },
    {
        title: "Paste your airdrop details",
        description:
            "Enter the ERC-20 token address, your recipients, and the amount per recipient.",
    },
    {
        title: "Send",
        description:
            "Approve the token and dispatch the airdrop in a single batched transaction.",
    },
]

export default function HowItWorks() {
    return (
        <section className="max-w-5xl mx-auto px-6 py-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
                How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className="flex flex-col items-center text-center gap-3"
                    >
                        <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
                            {index + 1}
                        </div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
