import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// eslint-config-next v15+ exports a flat config array natively via CommonJS.
// We import it with createRequire to avoid the circular-JSON error that
// FlatCompat triggers when it tries to serialise the react plugin object.
const nextConfig = require("eslint-config-next");

export default [
  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "out/**",
      "build/**",
      "public/**",
      "*.config.*",
      "next-env.d.ts",
    ],
  },

  // ── Next.js recommended flat config (includes react, react-hooks, a11y …) ─
  ...nextConfig,

  // ── Project-level rule overrides ───────────────────────────────────────────
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
