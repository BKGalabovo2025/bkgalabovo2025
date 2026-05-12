import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

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

  // ── Next.js recommended flat config ────────────────────────────────────────
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // ── Explicit Next.js Plugin for Flat Config (silences warnings) ───────────
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

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
