
import { collection, getDocs, addDoc, doc, query, where, writeBatch, runTransaction, getDoc, updateDoc, deleteDoc, DocumentData, DocumentReference, orderBy, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
import { Subscription, ClubService, ClubServiceHistory } from '@/types/index';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';
const SERVICE_HISTORY_COLLECTION = 'serviceHistory';
const MEMBERS_COLLECTION = 'members'; // Added for fetching member data

// --- Converters --- 
export const docToClubService = (doc: DocumentSnapshot): ClubService | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name : 'Неименувана услуга',
        description: typeof data.description === 'string' ? data.description : '',
        price: typeof data.price === 'number' ? data.price : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        type: ['Абонамент', 'Еднократно плащане'].includes(data.type) ? data.type : 'Еднократно плащане',
        billingPeriod: ['Месечен', 'Годишен', null].includes(data.billingPeriod) ? data.billingPeriod : null,
        targetGroups: Array.isArray(data.targetGroups) ? data.targetGroups : [],
        isCoachLed: typeof data.isCoachLed === 'boolean' ? data.isCoachLed : false,
        durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : 0,
        requiresBooking: typeof data.requiresBooking === 'boolean' ? data.requiresBooking : false,
        minMembers: typeof data.minMembers === 'number' ? data.minMembers : 0,
        maxMembers: typeof data.maxMembers === 'number' ? data.maxMembers : 0,
        paymentRules: typeof data.paymentRules === 'object' ? data.paymentRules : undefined,
        specialRights: Array.isArray(data.specialRights) ? data.specialRights : [],
        cancellationPolicy: typeof data.cancellationPolicy === 'object' ? data.cancellationPolicy : { isAllowed: false, noticePeriodDays: 0, feeType: 'none', feeValue: 0, description: '', longTermSicknessDiscount: 0 },
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
        createdBy: data.createdBy && typeof data.createdBy === 'object' ? data.createdBy : { userId: '', userName: '' },
        updatedBy: data.updatedBy && typeof data.updatedBy === 'object' ? data.updatedBy : { userId: '', userName: '' },
    };
};

const docToClubServiceHistory = (doc: DocumentSnapshot): ClubServiceHistory | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        serviceId: typeof data.serviceId === 'string' ? data.serviceId : '',
        serviceName: typeof data.serviceName === 'string' ? data.serviceName : '',
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
        userId: typeof data.userId === 'string' ? data.userId : '',
        userName: typeof data.userName === 'string' ? data.userName : '',
        changes: typeof data.changes === 'string' ? data.changes : '',
        note: typeof data.note === 'string' ? data.note : undefined,
    };
};

export const docToMemberSubscription = (doc: DocumentSnapshot): Subscription | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        serviceId: typeof data.serviceId === 'string' ? data.serviceId : '',
        serviceName: typeof data.serviceName === 'string' ? data.serviceName : '',
        startDate: typeof data.startDate === 'string' ? data.startDate : new Date().toISOString(),
        endDate: typeof data.endDate === 'string' ? data.endDate : new Date().toISOString(),
        status: ['active', 'inactive', 'cancelled', 'pending_payment'].includes(data.status) ? data.status : 'inactive',
        price: typeof data.price === 'number' ? data.price : 0,
        pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : [],
        paymentsMadeCount: typeof data.paymentsMadeCount === 'number' ? data.paymentsMadeCount : 0,
        totalPaymentsCount: typeof data.totalPaymentsCount === 'number' ? data.totalPaymentsCount : 0,
        licenseGranted: typeof data.licenseGranted === 'boolean' ? data.licenseGranted : false,
        apparelGranted: typeof data.apparelGranted === 'boolean' ? data.apparelGranted : false,
        linkedSubscriptionId: typeof data.linkedSubscriptionId === 'string' ? data.linkedSubscriptionId : null,
    };
};

// --- Change Summary Generator --- 
const generateChangeSummary = (oldData: ClubService, newData: Omit<ClubService, 'id'>): string => {
    const changes: string[] = [];
    if (oldData.name !== newData.name) changes.push(`- Име: '${oldData.name}' -> '${newData.name}'`);
    if (oldData.price !== newData.price) changes.push(`- Цена: ${(oldData.price / 100).toFixed(2)} -> ${(newData.price / 100).toFixed(2)} ${newData.currency}`);
    if (oldData.description !== newData.description) changes.push(`- Описанието е променено.`);
    if (oldData.billingPeriod !== newData.billingPeriod) changes.push(`- Таксуване: '${oldData.billingPeriod}' -> '${newData.billingPeriod}'`);
    const oldGroups = (oldData.targetGroups || []).join(', ');
    const newGroups = (newData.targetGroups || []).join(', ');
    if (oldGroups !== newGroups) changes.push(`- Целеви групи: '${oldGroups}' -> '${newGroups}'`);
    if (!changes.length) return 'Няма засечени промени.';
    return changes.join('\n');
};

// --- Service Functions --- 

export const getAllClubServices = async (): Promise<ClubService[]> => {
    const db = getDb();
    const q = query(collection(db, SERVICES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToClubService).filter(Boolean) as ClubService[];
};

export const getClubServiceById = async (id: string): Promise<ClubService | null> => {
    const db = getDb();
    const docSnap = await getDoc(doc(db, SERVICES_COLLECTION, id));
    return docToClubService(docSnap);
};

export const createClubService = async (service: Omit<ClubService, 'id'>): Promise<DocumentReference<DocumentData>> => {
    const db = getDb();
    const cleanService: { [key: string]: unknown } = {};
    Object.entries(service).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanService[key] = value;
      }
    });
    return await addDoc(collection(db, SERVICES_COLLECTION), cleanService);
};

export const updateClubService = async (id: string, serviceUpdate: Omit<ClubService, 'id'>, note?: string): Promise<void> => {
    const db = getDb();
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Нямате права за тази операция. Моля, влезте отново в системата.");

    const serviceRef = doc(db, SERVICES_COLLECTION, id);
    const historyRef = doc(collection(db, SERVICE_HISTORY_COLLECTION));
    const batch = writeBatch(db);

    const oldDocSnap = await getDoc(serviceRef);
    const oldData = docToClubService(oldDocSnap);
    if (!oldData) throw new Error("Услугата, която се опитвате да промените, не съществува.");

    const changes = generateChangeSummary(oldData, serviceUpdate);

    const historyLog: ClubServiceHistory = {
        id: historyRef.id,
        serviceId: id,
        serviceName: oldData.name,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userName: user.displayName || user.email || 'System',
        changes: changes,
        note: note || undefined,
    };

    const cleanServiceUpdate: { [key: string]: unknown } = {};
    Object.entries(serviceUpdate).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanServiceUpdate[key] = value;
        }
    });

    const cleanHistoryLog: { [key: string]: unknown } = {};
    Object.entries(historyLog).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanHistoryLog[key] = value;
        }
    });

    batch.update(serviceRef, cleanServiceUpdate);
    batch.set(historyRef, cleanHistoryLog);
    await batch.commit();
};

export const deleteClubService = async (id: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, SERVICES_COLLECTION, id));
};

export const getHistoryForService = async (serviceId: string): Promise<ClubServiceHistory[]> => {
    const db = getDb();
    const q = query(collection(db, SERVICE_HISTORY_COLLECTION), where("serviceId", "==", serviceId), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToClubServiceHistory).filter(Boolean) as ClubServiceHistory[];
};

// --- Subscription Functions ---

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  const db = getDb();
  const q = query(collection(db, SUBSCRIPTIONS_COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToMemberSubscription).filter(Boolean) as Subscription[];
};

export const getSubscriptionsByMemberId = async (memberId: string): Promise<Subscription[]> => {
  const db = getDb();
  const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("memberId", "==", memberId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToMemberSubscription).filter(Boolean) as Subscription[];
};

export const createSubscription = async (
  subscription: Omit<Subscription, 'id'>, 
  _userId: string, 
  _userName: string
): Promise<string> => {
    const db = getDb();
    const subRef = doc(collection(db, 'memberSubscriptions'));
    
    // Подготвяме данните за продажбата (Sale)
    const saleData = {
        memberId: subscription.memberId,
        subscriptionId: subRef.id,
        saleDate: Timestamp.now(),
        items: [{
            productId: subscription.serviceId,
            name: subscription.serviceName,
            quantity: 1,
            price: subscription.price,
        }],
        totalAmount: subscription.price,
        currency: subscription.currency,
        isPaid: subscription.pricePaid >= subscription.price,
        status: 'completed' as const,
    };

    await runTransaction(db, async (transaction) => {
        // 1. Записваме абонамента
        transaction.set(subRef, { ...subscription, id: subRef.id });

        // 2. Записваме продажбата автоматично
        const saleRef = doc(collection(db, 'sales'));
        transaction.set(saleRef, saleData);
        
        // 3. Обновяваме последната дата на плащане в профила на члена
        const memberRef = doc(db, MEMBERS_COLLECTION, subscription.memberId);
        transaction.update(memberRef, { 
            lastPaymentDate: new Date().toISOString() 
        });
    });

    return subRef.id;
};

export const updateSubscription = async (id: string, subscriptionUpdate: Partial<Subscription>): Promise<void> => {
    const db = getDb();
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    const cleanSubscriptionUpdate: { [key: string]: unknown } = {};
    Object.entries(subscriptionUpdate).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanSubscriptionUpdate[key] = value;
        }
    });
    await updateDoc(subRef, cleanSubscriptionUpdate);
};
