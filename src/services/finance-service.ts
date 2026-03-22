
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, updateDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Payment, Subscription, PaymentHistoryItem } from '@/types';

const PAYMENTS_COLLECTION = 'payments';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

interface PaymentHistoryItemData {
    paymentId: string;
    date: Timestamp;
    amount: number;
}

const docToPayment = (doc: DocumentSnapshot): Payment | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};
    return {
        id: doc.id,
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        paymentDate: data.paymentDate instanceof Timestamp ? data.paymentDate.toDate().toISOString() : new Date().toISOString(),
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        type: ['subscription', 'donation', 'sale', 'other'].includes(data.type) ? data.type : 'other',
        method: ['cash', 'card', 'bank_transfer'].includes(data.method) ? data.method : 'cash',
        status: ['succeeded', 'pending', 'failed'].includes(data.status) ? data.status : 'pending',
        notes: typeof data.notes === 'string' ? data.notes : '',
        relatedId: typeof data.relatedId === 'string' ? data.relatedId : undefined,
    };
};

const docToSubscription = (doc: DocumentSnapshot): Subscription | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};

    const paymentHistory = (Array.isArray(data.paymentHistory) ? data.paymentHistory : []).map((item: PaymentHistoryItemData): PaymentHistoryItem | null => {
        if (!item || typeof item !== 'object') return null;
        return {
            paymentId: typeof item.paymentId === 'string' ? item.paymentId : '',
            date: item.date instanceof Timestamp ? item.date.toDate().toISOString() : new Date().toISOString(),
            amount: typeof item.amount === 'number' ? item.amount : 0,
        };
    }).filter(Boolean) as PaymentHistoryItem[];

    return {
        id: doc.id,
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        serviceId: typeof data.serviceId === 'string' ? data.serviceId : '',
        serviceName: typeof data.serviceName === 'string' ? data.serviceName : '',
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : new Date().toISOString(),
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : new Date().toISOString(),
        status: ['active', 'inactive', 'cancelled', 'pending_payment'].includes(data.status) ? data.status : 'inactive',
        price: typeof data.price === 'number' ? data.price : 0,
        pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : 0,
        currency: ['BGN', 'EUR'].includes(data.currency) ? data.currency : 'BGN',
        paymentHistory: paymentHistory,
        paymentsMadeCount: typeof data.paymentsMadeCount === 'number' ? data.paymentsMadeCount : 0,
        totalPaymentsCount: typeof data.totalPaymentsCount === 'number' ? data.totalPaymentsCount : 0,
        licenseGranted: typeof data.licenseGranted === 'boolean' ? data.licenseGranted : undefined,
        apparelGranted: typeof data.apparelGranted === 'boolean' ? data.apparelGranted : undefined,
    };
};

const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
    const db = getDb();
    const dataWithTimestamp = {
        ...paymentData,
        paymentDate: Timestamp.fromDate(new Date(paymentData.paymentDate)),
    };
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), dataWithTimestamp);
    return docRef.id;
};

const updatePayment = async (paymentId: string, paymentData: Partial<Omit<Payment, 'id'>>): Promise<void> => {
    const db = getDb();
    const paymentDoc = doc(db, PAYMENTS_COLLECTION, paymentId);
    const dataToUpdate: { [key: string]: unknown } = { ...paymentData };
    if (paymentData.paymentDate) {
        dataToUpdate.paymentDate = Timestamp.fromDate(new Date(paymentData.paymentDate));
    }
    await updateDoc(paymentDoc, dataToUpdate);
};

const getPaymentsForMember = async (memberId: string): Promise<Payment[]> => {
    const db = getDb();
    const q = query(collection(db, PAYMENTS_COLLECTION), where('memberId', '==', memberId), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPayment).filter(Boolean) as Payment[];
};

export const getAllPayments = async (): Promise<Payment[]> => {
    const db = getDb();
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPayment).filter(Boolean) as Payment[];
};

const deletePayment = async (paymentId: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, PAYMENTS_COLLECTION, paymentId));
};

const addSubscription = async (subscriptionData: Omit<Subscription, 'id'>): Promise<string> => {
    const db = getDb();
    const dataWithTimestamps = {
        ...subscriptionData,
        startDate: Timestamp.fromDate(new Date(subscriptionData.startDate)),
        endDate: Timestamp.fromDate(new Date(subscriptionData.endDate)),
        paymentHistory: subscriptionData.paymentHistory.map((p: PaymentHistoryItem) => ({ ...p, date: Timestamp.fromDate(new Date(p.date))}))
    };
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), dataWithTimestamps);
    return docRef.id;
};

const updateSubscription = async (subscriptionId: string, subscriptionData: Partial<Omit<Subscription, 'id'>>): Promise<void> => {
    const db = getDb();
    const subDoc = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const dataToUpdate: { [key: string]: unknown } = { ...subscriptionData };
    if (subscriptionData.startDate) {
        dataToUpdate.startDate = Timestamp.fromDate(new Date(subscriptionData.startDate));
    }
    if (subscriptionData.endDate) {
        dataToUpdate.endDate = Timestamp.fromDate(new Date(subscriptionData.endDate));
    }
    if (subscriptionData.paymentHistory) {
        dataToUpdate.paymentHistory = subscriptionData.paymentHistory.map((p: PaymentHistoryItem) => ({ ...p, date: Timestamp.fromDate(new Date(p.date))}));
    }

    await updateDoc(subDoc, dataToUpdate);
};

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    const db = getDb();
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSubscription).filter(Boolean) as Subscription[];
};

const deleteSubscription = async (subscriptionId: string): Promise<void> => {
    const db = getDb();
    await deleteDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId));
};
