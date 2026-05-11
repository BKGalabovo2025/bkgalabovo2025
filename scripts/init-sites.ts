import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccountPath = './bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
}, 'init-sites');

const db = getFirestore(app);

async function initSites() {
  console.log('Initializing sites collection...');
  
  const sites = [
    {
      id: 'bkgalabovo',
      name: 'БК Гълъбово',
      address: 'гр. Гълъбово, Спортна зала',
      isActive: true,
      recoveryEnabled: false,
      recoveryInventory: {
        attachments: { arms: 0, hips: 0, legs: 0 },
        compressors: 0
      },
      operatingHours: { start: 8, end: 22 }
    },
    {
      id: 'recoveryzone',
      name: 'Recovery Zone',
      address: 'гр. Гълъбово, Сектор Възстановяване',
      isActive: true,
      recoveryEnabled: true,
      recoveryInventory: {
        attachments: { arms: 2, hips: 2, legs: 4 },
        compressors: 3
      },
      operatingHours: { start: 9, end: 21 }
    }
  ];

  for (const site of sites) {
    const { id, ...data } = site;
    await db.collection('sites').doc(id).set(data);
    console.log(`✅ Site initialized: ${id} (${site.name})`);
  }

  console.log('Done!');
}

initSites().catch(console.error);
