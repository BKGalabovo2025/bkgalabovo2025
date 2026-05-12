import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

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
    ],
  },
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
    settings: {
      react: {
        version: "19.2.6",
      },
    },
  }
);
