const fs = require('fs');
const { execSync } = require('child_process');

function run() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const lines = envFile.split('\n');

  for (const line of lines) {
    if (!line || !line.includes('=')) continue;

    const firstEq = line.indexOf('=');
    const key = line.substring(0, firstEq).trim();
    let value = line.substring(firstEq + 1).trim();

    // Skip the path-based credential
    if (key === 'GOOGLE_APPLICATION_CREDENTIALS') continue;

    // Handle string stripping
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    console.log(`Adding ${key}...`);
    try {
      // vercel env add requires piping the value to stdin
      // for Windows we can use node's child_process.execSync with input
      execSync(`npx vercel env add ${key} production,preview,development`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    } catch (e) {
      console.error(`Failed to add ${key}`);
    }
  }
}

run();
