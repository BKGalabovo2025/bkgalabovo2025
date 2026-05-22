const fs = require('fs');
const path = require('path');

function findFiles(dir, ext = '.ts') {
  const res = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) res.push(...findFiles(p, ext));
    else if (p.endsWith(ext) || p.endsWith('.tsx') || p.endsWith('.js')) res.push(p);
  }
  return res;
}

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const isApi = /export async function (GET|POST|PUT|DELETE|PATCH)\(/.test(content);
  const isAction = /"use server"|export async function .*Action\(/.test(content);
  if (!isApi && !isAction) return null;
  const hasEnsureAdmin = /ensureAdmin\(/.test(content) || /ensureAdminFromSession\(/.test(content);
  return { file, isApi, isAction, hasEnsureAdmin };
}

const root = path.resolve(process.cwd(), 'src');
const files = findFiles(root);
const results = files.map(checkFile).filter(Boolean);

const missing = results.filter(r => !r.hasEnsureAdmin);

console.log('Scanned files count:', results.length);
if (missing.length === 0) {
  console.log('No server entrypoints missing ensureAdmin checks.');
  process.exit(0);
}

console.log('Endpoints/actions missing admin checks:');
missing.forEach(m => console.log('-', m.file));
process.exit(0);
