Developer setup

- Node: use Node 25.x (match CI). Use nvm or nvm-windows to pin.
- Install dependencies: `npm ci`
- Local env: create `.env.local` and set required vars; do NOT commit it.
  - Example vars: `FIREBASE_SERVICE_ACCOUNT_JSON`, `RECOVERY_ZONE_PRIVATE_KEY`, `EMAIL_PASS`
- Pre-commit: husky + lint-staged run `eslint`, `prettier`, `stylelint` and `npm run typecheck`.
  - If pre-commit blocks and you need to bypass temporarily: `git commit --no-verify` (use sparingly).
- CI: Pull Requests run full `npm run check-all` (typecheck, lint, test).

Secrets

- Move service account JSON and passwords to GitHub Secrets / Vercel / Secret Manager.
- Rotate any keys/secrets if they were ever committed.

Quick commands

```bash
# install
npm ci
# run typecheck
npm run typecheck
# run tests
npm run test
# run dev
npm run dev
```
