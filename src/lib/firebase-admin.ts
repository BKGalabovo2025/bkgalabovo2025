
import * as admin from 'firebase-admin';

console.log('Firebase Admin SDK initializing...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID ? 'Loaded' : 'MISSING');
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL ? 'Loaded' : 'MISSING');
console.log('Private Key:', process.env.FIREBASE_PRIVATE_KEY ? 'Loaded' : 'MISSING');

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } else {
        console.log('Firebase Admin SDK already initialized.');
    }
} catch (error) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed!', error);
    throw error; // Stop execution if Firebase Admin fails to initialize
}

const dbAdmin = admin.firestore();

export { dbAdmin };
