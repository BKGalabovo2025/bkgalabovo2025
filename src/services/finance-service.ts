
import { collection, getDocs, query, orderBy, DocumentSnapshot, Timestamp } from 'firebase/firestore';
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

export const getAllPayments = async (): Promise<Payment[]> => {
    const db = getDb();
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPayment).filter(Boolean) as Payment[];
};

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    const db = getDb();
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSubscription).filter(Boolean) as Subscription[];
};
