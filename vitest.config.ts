import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "node_modules",
      "e2e",
      ".gemini",
      ".antigravity",
      "bkgalabovo2025",
      "tmp",
      "scratch",
      // Requires Firebase Emulator — run separately with: npm run test:rules
      "src/__tests__/firestore.rules.test.ts",
    ],
    server: {
      deps: {
        // Mock server-only so Server Action tests can run in vitest
        inline: [/server-only/],
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
