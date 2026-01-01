
// This script is designed to fetch and display all club services from Firestore.
import { getDb } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetches all documents from the 'club-services' collection in Firestore and prints them to the console.
 * This is a utility for verifying the current state of service data in the database.
 */
const verifyServices = async () => {
  console.log('Fetching all club services from Firestore for verification...');
  const db = getDb();
  // CORRECTED: The collection name is 'club-services'
  const servicesCollection = collection(db, 'club-services');

  try {
    const querySnapshot = await getDocs(servicesCollection);
    const services = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Output the services as a JSON string for clear inspection.
    console.log(JSON.stringify(services, null, 2));
    console.log('\nVerification complete. The data above reflects the current state in Firestore.');

  } catch (error) {
    console.error('Error fetching services for verification:', error);
  }
};

// Execute the verification function.
verifyServices();
