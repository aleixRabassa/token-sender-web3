import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: "jsdom",
        exclude: ["**/node_modules/**", "**/test/**", 'playwright-report/**', 'test-results/**'],
        deps: {}
    }
})