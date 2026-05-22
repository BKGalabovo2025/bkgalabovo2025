const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found. Create it locally with your secrets.');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/).filter(Boolean);

console.log('# GitHub CLI commands to set secrets (example)');
lines.forEach(line => {
  const [key,val] = line.split('=');
  if (!key || !val) return;
  const safeVal = val.replace(/^\"|\"$/g, '');
  console.log(`gh secret set ${key} --body "${safeVal}"`);
});

console.log('\n# Vercel CLI commands to set environment variables (example)');
lines.forEach(line => {
  const [key,val] = line.split('=');
  if (!key || !val) return;
  const safeVal = val.replace(/^\"|\"$/g, '');
  console.log(`vercel env add ${key} ${safeVal} production`);
});

console.log('\n# Review and run the appropriate commands locally (requires gh and vercel CLIs).');
