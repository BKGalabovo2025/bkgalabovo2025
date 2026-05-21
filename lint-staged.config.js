export default {
  // 1. Първо форматираме и оправяме автоматично всички променени файлове
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.css": ["stylelint --fix", "prettier --write"],
  "*.json": ["prettier --write"],

  // 2. След това изпълняваме по-лека глобална проверка (typecheck).
  // Пълното `check-all` (tests + lint + typecheck) е по-добре да се пуска в CI.
  "**/*": () => "npm run typecheck",
};
