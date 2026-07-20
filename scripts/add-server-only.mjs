import fs from 'fs';
import path from 'path';

const filesToProtect = [
  "src/services/member-service.server.ts",
  "src/services/ranking-service.server.ts",
  "src/services/reminder-service.server.ts",
  "src/services/tournament-service.server.ts"
];

const actionsDir = "src/lib/actions";
let actionsFiles = [];
if (fs.existsSync(actionsDir)) {
  actionsFiles = fs.readdirSync(actionsDir)
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(actionsDir, f));
}

const allFiles = [...filesToProtect, ...actionsFiles];

for (const file of allFiles) {
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already protected
  if (content.includes('server-only')) continue;

  const lines = content.split('\n');
  const firstLine = lines[0].trim();
  
  if (firstLine === '"use server";' || firstLine === "'use server';" || firstLine === '"use server"' || firstLine === "'use server'") {
    // Insert on second line
    lines.splice(1, 0, 'import "server-only";');
  } else {
    // Insert on first line
    lines.unshift('import "server-only";');
  }
  
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`Protected: ${file}`);
}
