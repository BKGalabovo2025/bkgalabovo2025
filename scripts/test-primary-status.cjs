const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const envLines = envContent.split('\n');
const env = {};
for (const line of envLines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
}

async function testPrimary() {
  console.log('Testing primary Firestore connectivity...');
  try {
    let serviceAccount;
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      console.log('No FIREBASE_SERVICE_ACCOUNT_JSON found.');
      return;
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, 'primary-test');

    const db = app.firestore();
    const snapshot = await db.collection('members').limit(2).get();
    console.log('Primary DB read success! Retrieved members count:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Sample doc id:', doc.id);
    });
  } catch (err) {
    console.error('Primary DB error:', err.message, err.code);
  }
}

testPrimary();
