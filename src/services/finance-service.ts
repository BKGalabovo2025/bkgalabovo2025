import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, updateDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Payment, Subscription } from '@/types';

const PAYMENTS_COLLECTION = 'payments';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

// Bulletproof converters
const docToPayment = (doc: DocumentSnapshot): Payment | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : new Date().toISOString(),
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        method: ['cash', 'card', 'bank_transfer'].includes(data.method) ? data.method : 'cash',
        status: ['paid', 'unpaid', 'failed'].includes(data.status) ? data.status : 'unpaid',
        notes: typeof data.notes === 'string' ? data.notes : '',
    };
};

const docToSubscription = (doc: DocumentSnapshot): Subscription | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        serviceId: typeof data.serviceId === 'string' ? data.serviceId : '',
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : new Date().toISOString(),
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : new Date().toISOString(),
        status: ['active', 'inactive', 'cancelled'].includes(data.status) ? data.status : 'inactive',
    };
};

// Payment Functions
export const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
    const db = getDb();
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), { ...paymentData, date: Timestamp.fromDate(new Date(paymentData.date)) });
    return docRef.id;
};

export const updatePayment = async (paymentId: string, paymentData: Partial<Omit<Payment, 'id'>>): Promise<void> => {
    const db = getDb();
    const paymentDoc = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentDoc, paymentData);
};

export const getPaymentsForMember = async (memberId: string): Promise<Payment[]> => {
    const db = getDb();
    const q = query(collection(db, PAYMENTS_COLLECTION), where('memberId', '==', memberId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPayment).filter(Boolean) as Payment[];
};

export const getAllPayments = async (): Promise<Payment[]> => {
    const db = getDb();
    const snapshot = await getDocs(collection(db, PAYMENTS_COLLECTION));
    return snapshot.docs.map(docToPayment).filter(Boolean) as Payment[];
};

export const deletePayment = async (paymentId: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, PAYMENTS_COLLECTION, paymentId));
};

// Subscription Functions
export const addSubscription = async (subscriptionData: Omit<Subscription, 'id'>): Promise<string> => {
    const db = getDb();
    const dataWithTimestamps = {
        ...subscriptionData,
        startDate: Timestamp.fromDate(new Date(subscriptionData.startDate)),
        endDate: Timestamp.fromDate(new Date(subscriptionData.endDate)),
    };
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), dataWithTimestamps);
    return docRef.id;
};

export const updateSubscription = async (subscriptionId: string, subscriptionData: Partial<Omit<Subscription, 'id'>>): Promise<void> => {
    const db = getDb();
    const subDoc = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subDoc, subscriptionData);
};

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    const db = getDb();
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSubscription).filter(Boolean) as Subscription[];
};

export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId));
};
