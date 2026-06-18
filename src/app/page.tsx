'use client'

import HomeContent from "@/components/HomeContent";
import LandingPage from "@/components/landing/LandingPage";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  return isConnected ? <HomeContent /> : <LandingPage />;
}
