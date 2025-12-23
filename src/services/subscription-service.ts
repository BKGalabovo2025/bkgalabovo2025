
import { collection, getDocs, addDoc, doc, query, where, writeBatch, getDoc, updateDoc, deleteDoc, DocumentData, DocumentReference, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MemberSubscription, ClubService, ClubServiceHistory } from '@/types';
import { getAuth } from 'firebase/auth';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';
const SERVICE_HISTORY_COLLECTION = 'serviceHistory';

const generateChangeSummary = (oldData: Partial<ClubService>, newData: Partial<ClubService>): string => {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach(key => {
        const oldValue = oldData[key as keyof ClubService];
        const newValue = newData[key as keyof ClubService];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
             if (key === 'price') {
                changes.push(`Цена е променена от ${(Number(oldValue) / 100).toFixed(2)} на ${(Number(newValue) / 100).toFixed(2)}.`);
            } else if (key === 'name') {
                 changes.push(`Име е променено от '${oldValue}' на '${newValue}'.`);
            } else if (key === 'description') {
                 changes.push(`Описанието е променено.`);
            } else if (key === 'targetGroups') {
                changes.push(`Целевите групи са променени от '${(oldValue as string[]).join(', ')}' на '${(newValue as string[]).join(', ')}'.`);
            } else {
                changes.push(`Поле '${key}' е променено от '${oldValue}' на '${newValue}'.`);
            }
        }
    });

    return changes.join('\n');
};


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

export const updateClubService = async (id: string, serviceUpdate: Partial<ClubService>, note?: string): Promise<void> => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("Authentication required to update a service.");
    }
    
    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    const historyCollection = collection(db, SERVICE_HISTORY_COLLECTION);

    const batch = writeBatch(db);

    // 1. Get the old document
    const oldDocSnap = await getDoc(serviceRef);
    if (!oldDocSnap.exists()) {
        throw new Error("Service to update not found.");
    }
    const oldData = oldDocSnap.data() as ClubService;
    
    // 2. Generate summary of changes
    const changes = generateChangeSummary(oldData, serviceUpdate);

    if (changes.length === 0 && !note) {
        console.log("No changes detected, skipping history creation.");
        // Still update, as some fields might have been cleared
        return await updateDoc(serviceRef, serviceUpdate);
    }

    // 3. Create history entry
    const historyEntry: Omit<ClubServiceHistory, 'id'> = {
        serviceId: id,
        serviceName: oldData.name,
        timestamp: new Date().toISOString(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Admin',
        changes,
        note: note || undefined,
    };
    const historyRef = doc(historyCollection);
    batch.set(historyRef, historyEntry);

    // 4. Update the actual service document
    batch.update(serviceRef, serviceUpdate);

    // 5. Commit the batch
    await batch.commit();
};


export const deleteClubService = async (id: string): Promise<void> => {
    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    await deleteDoc(serviceRef);
};

// =============================================================================
// SERVICE HISTORY OPERATIONS
// =============================================================================

export const getHistoryForService = async (serviceId: string): Promise<ClubServiceHistory[]> => {
    const historyCollection = collection(db, SERVICE_HISTORY_COLLECTION);
    const q = query(historyCollection, where("serviceId", "==", serviceId), orderBy("timestamp", "desc"));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }) as ClubServiceHistory);
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
