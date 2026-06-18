/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const data = fs.readFileSync('eslint-report.json', 'utf8');
// remove BOM if present
const content = data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data;
const results = JSON.parse(content);

const targetRules = [
  "sonarjs/prefer-single-boolean-return",
  "sonarjs/no-gratuitous-expressions",
  "@typescript-eslint/ban-ts-comment",
  "sonarjs/no-identical-expressions",
  "sonarjs/no-identical-functions",
  "sonarjs/use-type-alias",
  "sonarjs/no-ignored-exceptions",
  "@typescript-eslint/no-unused-vars",
  "react-hooks/exhaustive-deps"
];

for (const res of results) {
  for (const msg of res.messages) {
    if (targetRules.includes(msg.ruleId)) {
      console.log(`${res.filePath}:${msg.line}:${msg.column} - ${msg.ruleId}`);
    }
  }
}
