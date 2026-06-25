import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
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
      "e2e/**",
      "playwright.config.ts",
      "bkgalabovo2025/**",
      "sync-attendance-payments.js",
      "sync-attendance-payments.cjs",
      "test_sale.ts",
    ],
  },
  ...nextConfig,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
      ],
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-nested-functions": "off",
    },
    settings: {
      react: {
        version: "19.2.6",
      },
    },
  }
);
