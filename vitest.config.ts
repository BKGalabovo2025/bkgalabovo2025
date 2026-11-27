import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    maxWorkers: 3,
    setupFiles:
      process.env.TEST_ENV === "integration" ? [] : ["./vitest.setup.ts"],
    exclude: [
      "node_modules",
      "e2e",
      ".gemini",
      ".antigravity",
      "bkgalabovo2025",
      "tmp",
      "scratch",
      // Requires Firebase Emulator — run separately with: npm run test:rules
      ...(process.env.TEST_ENV === "rules"
        ? []
        : ["src/__tests__/firestore.rules.test.ts"]),
      ...(process.env.TEST_ENV === "integration"
        ? []
        : ["src/integration-tests"]),
    ],
    server: {
      deps: {
        // Mock server-only so Server Action tests can run in vitest
        inline: [/server-only/],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/services/**", "src/app/api/**"],
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 20,
        statements: 25,
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
