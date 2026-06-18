"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/aleixRabassa/ts-tsender-ui-cu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-2xl hover:text-gray-600 transition-colors"
          aria-label="GitHub"
        >
          <FaGithub />
        </a>
        <h1 className="text-2xl font-bold">Token Sender</h1>
      </div>
      <div>
        <ConnectButton />
      </div>
    </header>
  );
}
