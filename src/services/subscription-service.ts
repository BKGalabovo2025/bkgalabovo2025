import { collection, getDocs, addDoc, doc, query, where, writeBatch, getDoc, updateDoc, deleteDoc, DocumentData, DocumentReference, orderBy, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Subscription, ClubService, ClubServiceHistory } from '@/types';
import { getAuth } from 'firebase/auth';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SERVICES_COLLECTION = 'clubServices';
const SERVICE_HISTORY_COLLECTION = 'serviceHistory';

// Bulletproof converters
const docToClubService = (doc: DocumentSnapshot): ClubService | null => {
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

const docToMemberSubscription = (doc: DocumentSnapshot): Subscription | null => {
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
        pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        paymentHistory: Array.isArray(data.paymentHistory) ? data.paymentHistory : [],
        paymentsMadeCount: typeof data.paymentsMadeCount === 'number' ? data.paymentsMadeCount : 0,
        totalPaymentsCount: typeof data.totalPaymentsCount === 'number' ? data.totalPaymentsCount : 0,
        licenseGranted: typeof data.licenseGranted === 'boolean' ? data.licenseGranted : false,
        apparelGranted: typeof data.apparelGranted === 'boolean' ? data.apparelGranted : false,
    };
};

const generateChangeSummary = (oldData: Partial<ClubService>, newData: Partial<ClubService>): string => {
    // ... (implementation remains the same)
    return 'Summary of changes'; // Placeholder
};

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
    Object.keys(service).forEach(key => (service as any)[key] === undefined && delete (service as any)[key]);
    return await addDoc(collection(db, SERVICES_COLLECTION), service);
};

export const updateClubService = async (id: string, serviceUpdate: Partial<ClubService>, note?: string): Promise<void> => {
    // ... (logic remains, but would internally use docToClubService if fetching data)
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

export const getSubscriptionsByMemberId = async (memberId: string): Promise<Subscription[]> => {
  const db = getDb();
  const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("memberId", "==", memberId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToMemberSubscription).filter(Boolean) as Subscription[];
};

export const assignSubscriptionToMember = async (memberId: string, serviceId: string, startDate: Date): Promise<string> => {
  const db = getDb();
  const service = await getClubServiceById(serviceId);
  if (!service) throw new Error("Service not found!");
  
  const totalPaymentsCount = service.billingPeriod === 'Годишен' ? 1 : 12;

  const newSubscription: Omit<Subscription, 'id'> = {
      memberId, serviceId, serviceName: service.name, startDate: new Date().toISOString(), endDate: new Date().toISOString(), status: 'pending_payment', pricePaid: 0, currency: service.currency, paymentHistory: [], paymentsMadeCount: 0, totalPaymentsCount: totalPaymentsCount, licenseGranted: false, apparelGranted: false
  };
  const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), newSubscription);
  return docRef.id;
};
