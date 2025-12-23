
import { collection, getDocs, addDoc, doc, query, where, writeBatch, getDoc, updateDoc, deleteDoc, DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MemberSubscription, ClubService } from '@/types';
import servicesData from '@/lib/data/services.json';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';

// =============================================================================
// SERVICE (CRUD) OPERATIONS
// =============================================================================

export const getAllClubServices = async (): Promise<ClubService[]> => {
    const servicesCollection = collection(db, SERVICES_COLLECTION);
    const querySnapshot = await getDocs(servicesCollection);

    if (querySnapshot.empty) {
        console.warn("Club services collection is empty!");
        return [];
    }

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }) as ClubService);
}

export const getClubServiceById = async (id: string): Promise<ClubService | null> => {
    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    const serviceDoc = await getDoc(serviceRef);
    if (serviceDoc.exists()) {
        return { id: serviceDoc.id, ...serviceDoc.data() } as ClubService;
    }
    return null;
};

export const createClubService = async (service: Omit<ClubService, 'id'>): Promise<DocumentReference<DocumentData>> => {
    return await addDoc(collection(db, SERVICES_COLLECTION), service);
};

export const updateClubService = async (id: string, service: Partial<ClubService>): Promise<void> => {
    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    return await updateDoc(serviceRef, service);
};

export const deleteClubService = async (id: string): Promise<void> => {
    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    await deleteDoc(serviceRef);
};


// =============================================================================
// MEMBER SUBSCRIPTION OPERATIONS
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

export const assignSubscriptionToMember = async (memberId: string, serviceId: string, startDate: Date): Promise<string> => {
  const serviceRef = doc(db, SERVICES_COLLECTION, serviceId);
  const serviceDoc = await getDoc(serviceRef);

  if (!serviceDoc.exists()) {
      throw new Error("Service not found in the database!");
  }
  const service = serviceDoc.data() as ClubService;
  
  let endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999); // Default end of day

  if (service.billingPeriod === "Месечен") {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    endDate = new Date(year, month + 1, 0); 
    endDate.setHours(23, 59, 59, 999);

  } else if (service.billingPeriod === "Годишен") {
    const year = startDate.getFullYear();
    endDate = new Date(year, 11, 31); // Month 11 is December, Day 31.
    endDate.setHours(23, 59, 59, 999);

  } else {
    if (service.durationMinutes) {
        endDate.setMinutes(startDate.getMinutes() + service.durationMinutes);
    } 
  }

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

// =============================================================================
// DATABASE SEEDING (ONE-TIME OPERATION)
// =============================================================================

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
