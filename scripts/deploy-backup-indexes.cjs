const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getBackupServiceAccount() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const match = envContent.match(/FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON=(.+)/);
  if (!match) {
    throw new Error('FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON not found in .env.local');
  }
  let raw = match[1].trim();
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    raw = raw.slice(1, -1);
  }
  return JSON.parse(raw);
}

async function main() {
  try {
    const sa = getBackupServiceAccount();
    console.log('Found service account for project:', sa.project_id);

    const tempKeyPath = path.join(__dirname, '..', 'temp-backup-sa.json');
    fs.writeFileSync(tempKeyPath, JSON.stringify(sa, null, 2), { encoding: 'utf8' });

    console.log('Deploying Firestore indexes to project:', sa.project_id);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;

    try {
      console.log('Deploying Firestore indexes & rules to project:', sa.project_id);
      execSync(
        `npx firebase deploy --only firestore --project ${sa.project_id}`,
        {
          cwd: path.join(__dirname, '..'),
          env: process.env,
          encoding: 'utf8',
          stdio: 'inherit',
        }
      );
      console.log('✅ Firestore indexes & rules successfully deployed to backup DB!');
    } finally {
      if (fs.existsSync(tempKeyPath)) {
        fs.unlinkSync(tempKeyPath);
      }
    }
  } catch (err) {
    console.error('Error deploying backup indexes:', err);
    process.exit(1);
  }
}

main();
