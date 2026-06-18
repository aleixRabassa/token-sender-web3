"use client"

import { ReactNode, useState, useSyncExternalStore } from "react"
import config from "@/rainbowKitConfig"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@rainbow-me/rainbowkit/styles.css"

// Track whether the component is rendering on the client.
// `useSyncExternalStore` lets us read different values during SSR vs.
// after hydration without triggering a cascading render via setState in useEffect.
const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function Providers(props: {children: ReactNode}) {
    const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
    const [queryClient] = useState(() => new QueryClient())

    if (!mounted) {
        return null
    }

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {props.children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}