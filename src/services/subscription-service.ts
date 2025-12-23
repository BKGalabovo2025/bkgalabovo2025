
import { collection, getDocs, addDoc, doc, query, where, writeBatch, getDoc } from 'firebase/firestore';
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

export const getAllClubServices = async (): Promise<ClubService[]> => {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);

    if (querySnapshot.empty) {
        console.warn("Club services collection is empty! Please seed the database.");
        return [];
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
  const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
  const serviceDoc = await getDoc(serviceRef);

  if (!serviceDoc.exists()) {
      throw new Error("Service not found in the database!");
  }
  const service = serviceDoc.data() as ClubService;
  
  let endDate = new Date(startDate);
  // Set time to the end of the day for consistency
  endDate.setHours(23, 59, 59, 999);

  if (service.billingPeriod === "Месечен") {
    // Correct Logic: End date is the last day of the same month as the start date.
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    endDate = new Date(year, month + 1, 0); // Day 0 of next month gives last day of current month
    endDate.setHours(23, 59, 59, 999); // Ensure it's the end of the day

  } else if (service.billingPeriod === "Годишен") {
    endDate.setFullYear(startDate.getFullYear() + 1);

  } else {
    if (service.durationMinutes) {
        endDate.setMinutes(startDate.getMinutes() + service.durationMinutes);
    } 
  }

  // Ensure startDate is also set to the beginning of the day for consistency
  const finalStartDate = new Date(startDate);
  finalStartDate.setHours(0, 0, 0, 0);

  const newSubscription: Omit<MemberSubscription, 'id'> = {
    memberId,
    serviceId,
    startDate: finalStartDate.toISOString(),
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
 */
export const seedClubServices = async (): Promise<{count: number, status: string}> => {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);

    if (querySnapshot.empty) {
        console.log("Seeding club services from src/lib/data/services.json...");
        const batch = writeBatch(db);
        
        servicesData.forEach((service) => {
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
