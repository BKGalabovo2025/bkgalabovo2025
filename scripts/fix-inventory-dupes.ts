import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAdminDb } from '../src/lib/firebase-admin';

async function run() {
  const db = getAdminDb();
  const snapshot = await db.collection('inventory').get();
  const seen = new Set();
  let deleted = 0;
  
  const batch = db.batch();
  for (const d of snapshot.docs) {
    const data = d.data();
    console.log(`- ${data.name} (siteId: ${data.siteId}, id: ${d.id})`);
    const key = data.name + '_' + data.siteId;
    if (seen.has(key)) {
      batch.delete(d.ref);
      deleted++;
    } else {
      seen.add(key);
    }
  }
  
  if (deleted > 0) {
    await batch.commit();
  }
  
  console.log('Deleted duplicates: ' + deleted);
}

run().catch(console.error);
