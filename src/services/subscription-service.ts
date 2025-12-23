
import { collection, getDocs, addDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MemberSubscription, ClubService } from '@/types';
import servicesData from '@/lib/data/services.json';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';

// =============================================================================
// READ OPERATIONS
// =============================================================================

export const getSubscriptionsByMemberId = async (memberId: string): Promise<MemberSubscription[]> => {
  const subscriptionsCollection = collection(db, SUBSCRIPTIONS_COLLECTION);
  const q = query(subscriptionsCollection, where("memberId", "==", memberId));
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }) as MemberSubscription);
};

// This function now reads services from the Firestore collection
export const getAllClubServices = async (): Promise<ClubService[]> => {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);

    if (querySnapshot.empty) {
        console.warn("Club services collection is empty! Please seed the database.");
        return []; // Return empty array if no services are in the DB
    }

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }) as ClubService);
}

// =============================================================================
// WRITE OPERATIONS
// =============================================================================

export const assignSubscriptionToMember = async (memberId: string, serviceId: string, startDate: Date): Promise<string> => {
  // We need to get the service details from the database now
  const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
  const serviceDoc = await getDoc(serviceRef);

  if (!serviceDoc.exists()) {
      throw new Error("Service not found in the database!");
  }
  const service = serviceDoc.data() as ClubService;
  
  let endDate = new Date(startDate);
  if (service.billingPeriod === "Месечен") {
      endDate.setMonth(startDate.getMonth() + 1);
  } else if (service.billingPeriod === "Годишен") {
      endDate.setFullYear(startDate.getFullYear() + 1);
  } else {
      // For single payments or other types, calculate based on duration if available
      if (service.durationMinutes) {
          endDate.setMinutes(startDate.getMinutes() + service.durationMinutes);
      } 
  }

  const newSubscription: Omit<MemberSubscription, 'id'> = {
    memberId,
    serviceId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'pending_payment',
    pricePaid: 0,
    currency: service.currency,
    paymentHistory: [],
    paymentsMadeCount: 0,
    licenseGranted: service.grantsLicense && (service.licenseCondition === null || service.licensePaymentCount === 0),
    apparelGranted: service.grantsApparel && (service.apparelCondition === null || service.apparelPaymentCount === 0),
  };

  const subscriptionsCollection = collection(db, SUBSCRIPTIONS_COLLECTION);
  const docRef = await addDoc(subscriptionsCollection, newSubscription);
  
  return docRef.id;
};

/**
 * Seeds the `clubServices` collection from the local `src/lib/data/services.json` file.
 * This is a one-time, safe operation. It will NOT run if the collection is already populated.
 */
export const seedClubServices = async (): Promise<{count: number, status: string}> => {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);

    if (querySnapshot.empty) {
        console.log("Seeding club services from src/lib/data/services.json...");
        const batch = writeBatch(db);
        
        servicesData.forEach((service) => {
            // Use the service's own ID for the document ID
            const docRef = doc(db, SERVICES_COLLECTION, service.id);
            batch.set(docRef, service);
        });
        
        await batch.commit();
        console.log(`Seeding complete! ${servicesData.length} services added.`);
        return { count: servicesData.length, status: "success" };
    } else {
        console.log("Club services collection is not empty. Skipping seed operation.");
        return { count: querySnapshot.size, status: "skipped" };
    }
}
