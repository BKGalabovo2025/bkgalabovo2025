
import {
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    getDoc,
    runTransaction // Import runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subscription, Member, Payment } from '@/types';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const MEMBERS_COLLECTION = 'members';
const PAYMENTS_COLLECTION = 'payments';

// --- Типове --- //
type CreateSubscriptionData = Omit<Subscription, 'id'>;
type UpdateSubscriptionData = Partial<CreateSubscriptionData>;
export type SubscriptionWithMember = Subscription & { member: Pick<Member, 'firstName' | 'lastName'> };

export type EnrichedPayment = Payment & {
  member: Pick<Member, 'firstName' | 'lastName' | 'id'>;
  subscriptionType: Subscription['type'];
};


// --- Сървис за Абонаменти --- //

export const getSubscriptionsWithMembers = async (): Promise<SubscriptionWithMember[]> => {
    const subsSnapshot = await getDocs(collection(db, SUBSCRIPTIONS_COLLECTION));
    const memberCache = new Map<string, Pick<Member, 'firstName' | 'lastName'> | null>();

    const subscriptions = await Promise.all(subsSnapshot.docs.map(async (subDoc) => {
        const subData = { id: subDoc.id, ...subDoc.data() } as Subscription;
        let memberInfo: Pick<Member, 'firstName' | 'lastName'> | null = null;

        if (memberCache.has(subData.memberId)) {
            memberInfo = memberCache.get(subData.memberId) || null;
        } else {
            const memberRef = doc(db, MEMBERS_COLLECTION, subData.memberId);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
                const memberData = memberSnap.data() as Member;
                memberInfo = { firstName: memberData.firstName, lastName: memberData.lastName };
            }
            memberCache.set(subData.memberId, memberInfo);
        }
        
        return {
            ...subData,
            member: memberInfo || { firstName: 'Неизвестен', lastName: 'Член' }
        };
    }));

    return subscriptions;
};

export const addSubscription = async (data: CreateSubscriptionData): Promise<string> => {
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), data);
    return docRef.id;
};

export const updateSubscription = async (id: string, data: UpdateSubscriptionData): Promise<void> => {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    await updateDoc(subRef, data);
};

export const deleteSubscription = async (id: string): Promise<void> => {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    await deleteDoc(subRef);
};


// --- Сървис за Плащания --- //

/**
 * Създава плащане и обновява статуса на абонамента в една трансакция.
 */
export const createPaymentAndUpdateSubscription = async (subscription: Subscription): Promise<string> => {
    const paymentData: Omit<Payment, 'id'> = {
        subscriptionId: subscription.id,
        amount: subscription.amount,
        paymentDate: new Date().toISOString(),
        method: 'card', // Може да се направи по-динамично
    };

    try {
        const newPaymentId = await runTransaction(db, async (transaction) => {
            // 1. Обнови абонамента
            const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);
            transaction.update(subRef, { status: 'paid' });

            // 2. Създай ново плащане
            const paymentRef = doc(collection(db, PAYMENTS_COLLECTION)); // Генерира ново ID
            transaction.set(paymentRef, paymentData);
            
            return paymentRef.id;
        });
        return newPaymentId;
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Неуспешна трансакция. Моля, опитайте отново.");
    }
};

/**
 * Извлича всички плащания, обогатени с информация за члена и абонамента.
 */
export const getEnrichedPayments = async (): Promise<EnrichedPayment[]> => {
    const paymentsSnapshot = await getDocs(collection(db, PAYMENTS_COLLECTION));
    
    const memberCache = new Map<string, Member | null>();
    const subscriptionCache = new Map<string, Subscription | null>();

    const enrichedPayments = await Promise.all(paymentsSnapshot.docs.map(async (paymentDoc) => {
        const paymentData = { id: paymentDoc.id, ...paymentDoc.data() } as Payment;

        let subscription: Subscription | null = null;
        if (subscriptionCache.has(paymentData.subscriptionId)) {
            subscription = subscriptionCache.get(paymentData.subscriptionId) || null;
        } else {
            const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, paymentData.subscriptionId);
            const subSnap = await getDoc(subRef);
            if(subSnap.exists()){
                subscription = { id: subSnap.id, ...subSnap.data() } as Subscription;
            }
            subscriptionCache.set(paymentData.subscriptionId, subscription);
        }
        
        if (!subscription) return null; // Пропусни плащането, ако абонаментът е изтрит

        let member: Member | null = null;
        if (memberCache.has(subscription.memberId)) {
            member = memberCache.get(subscription.memberId) || null;
        } else {
            const memberRef = doc(db, MEMBERS_COLLECTION, subscription.memberId);
            const memberSnap = await getDoc(memberRef);
             if(memberSnap.exists()){
                member = { id: memberSnap.id, ...memberSnap.data() } as Member;
            }
            memberCache.set(subscription.memberId, member);
        }

        return {
            ...paymentData,
            member: member ? { id: member.id, firstName: member.firstName, lastName: member.lastName } : { id: 'unknown', firstName: 'Неизвестен', lastName: 'Член' },
            subscriptionType: subscription.type
        };
    }));

    // Филтрираме null стойностите, ако има такива
    return enrichedPayments.filter(p => p !== null) as EnrichedPayment[];
};
