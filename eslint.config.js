import { createRequire } from "node:module";
import tseslint from "typescript-eslint";

const require = createRequire(import.meta.url);

// eslint-config-next v15+ exports a flat config array natively via CommonJS.
const nextConfig = require("eslint-config-next");

export default [
  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: [
      ".next/**",
      ".antigravity/**",
      ".gemini/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "build/**",
      "public/**",
      "*.config.*",
      "next-env.d.ts",
      "scripts/**",
      "scratch/**",
    ],
  },

  // ── Next.js recommended flat config (includes react, react-hooks, a11y …) ─
  ...nextConfig,

  // ── TypeScript-ESLint plugin (provides @typescript-eslint/* rules) ─────────
  ...tseslint.configs.recommended,

  // ── Project-level rule overrides ───────────────────────────────────────────
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    settings: {
      react: {
        version: "19.0.0",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/incompatible-library": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
