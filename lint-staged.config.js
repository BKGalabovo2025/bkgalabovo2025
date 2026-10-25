export default {
  // 1. Форматираме и проверяваме с разделяне на порции и кавички за пътища с интервали ("FIREBASE STUDIO")
  "*.{js,jsx,ts,tsx}": (filenames) => {
    const chunkSize = 15;
    const commands = [];
    for (let i = 0; i < filenames.length; i += chunkSize) {
      const chunk = filenames.slice(i, i + chunkSize).map((f) => `"${f}"`);
      commands.push(`eslint --fix --no-warn-ignored ${chunk.join(" ")}`);
      commands.push(`prettier --write ${chunk.join(" ")}`);
    }
    return commands;
  },
  "*.css": (filenames) => {
    const quoted = filenames.map((f) => `"${f}"`).join(" ");
    return [`stylelint --fix ${quoted}`, `prettier --write ${quoted}`];
  },
  "*.json": (filenames) => {
    const chunkSize = 15;
    const commands = [];
    for (let i = 0; i < filenames.length; i += chunkSize) {
      const chunk = filenames.slice(i, i + chunkSize).map((f) => `"${f}"`);
      commands.push(`prettier --write ${chunk.join(" ")}`);
    }
    return commands;
  },

  // 2. След това изпълняваме проверка на типовете (typecheck)
  "**/*": () => "npm run typecheck",
};
