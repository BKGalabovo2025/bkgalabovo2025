/*
 * FINAL SCRIPT: Set explicit prices in EUR.
 * This script overwrites existing prices with the hardcoded correct values in EUR.
 * It does not perform any calculation.
 */

import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

import { getAdminDb } from '../src/lib/firebase-admin';

// The ground truth for service prices, as provided by the client.
const CORRECT_PRICES_EUR = new Map<string, number>([
  ['Месечен абонамент - Дете', 20.00],
  ['Семеен абонамент - 2 деца', 30.00],
  ['Семеен абонамент ( 2+ деца ) ', 40.00], // Note the trailing space
  ['Персонална тренировка ', 15.00], // Note the trailing space
  ['Индивидуално посещение за деца ', 3.00], // Note the trailing space
  ['Месечен членски внос - ЛЮБИТЕЛИ ', 5.00], // Note the trailing space
  ['Годишен членски внос - ЛЮБИТЕЛИ', 60.00],
  ['Единично посещение - ЛЮБИТЕЛИ ', 2.00] // Note the trailing space
]);

async function setCorrectPrices() {
  console.log('Starting to set the correct, hardcoded prices in EUR...');

  const adminDb = getAdminDb();
  const servicesRef = adminDb.collection('clubServices');
  const snapshot = await servicesRef.get();

  if (snapshot.empty) {
    console.log('No services found. Nothing to set.');
    return;
  }

  const batch = adminDb.batch();
  let updateCount = 0;

  snapshot.forEach(doc => {
    const service = doc.data();
    const serviceName = service.name;

    if (CORRECT_PRICES_EUR.has(serviceName)) {
      const correctPrice = CORRECT_PRICES_EUR.get(serviceName)!;
      const currentPrice = service.price;

      const serviceDocRef = servicesRef.doc(doc.id);
      batch.update(serviceDocRef, { 
        price: correctPrice,
        currency: 'EUR'
      });

      updateCount++;
      console.log(`  -> SETTING price for '${serviceName}': From ${currentPrice.toFixed(2)} EUR to ${correctPrice.toFixed(2)} EUR`);
    } else {
        console.log(`  - SKIPPING service '${serviceName}' as it was not in the provided list.`);
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(`\nSuccessfully set correct prices for ${updateCount} service(s).`);
    console.log('All prices are now correct and in EUR. Please check the application.');
  } else {
    console.log('\nNo services were updated. Ensure names in the script match the database.');
  }
}

setCorrectPrices().catch(error => {
  console.error('\nSetting prices failed:', error);
});
