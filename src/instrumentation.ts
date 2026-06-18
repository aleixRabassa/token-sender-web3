export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (typeof globalThis.indexedDB === "undefined") {
      // Stub browser-only APIs that WalletConnect accesses during SSR
      globalThis.indexedDB = {
        open: () => ({ result: null, onupgradeneeded: null, onsuccess: null, onerror: null }),
      } as unknown as IDBFactory;
    }
  }
}
