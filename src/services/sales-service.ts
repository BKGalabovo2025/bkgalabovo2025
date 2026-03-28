
import { collection, getDocs, doc, getDoc, DocumentSnapshot, Timestamp, runTransaction, query, where, limit, orderBy, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Sale, Subscription, InventoryEvent, Member, ClubService } from '@/types';
import { docToMember } from './member-service'; 
import { docToClubService, docToMemberSubscription } from './subscription-service';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const EVENTS_COLLECTION = 'inventoryEvents';
const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const MEMBERS_COLLECTION = 'members';
const SERVICES_COLLECTION = 'clubServices';

const docToSale = (doc: DocumentSnapshot): Sale | null => {
    if (!doc.id || !doc.exists()) {
        return null;
    }
    const data = doc.data() || {};
    const saleDate = data.saleDate?.toDate?.() || new Date();
    const rawAmount = data.totalAmount;
    const totalAmount = Number(rawAmount) || 0;

    return {
        id: doc.id,
        memberId: data.memberId,
        saleDate: saleDate.toISOString(),
        items: data.items || [],
        status: data.status || 'completed',
        currency: data.currency || 'EUR', 
        totalAmount: totalAmount,
        isPaid: typeof data.isPaid === 'boolean' ? data.isPaid : true, 
        subscriptionId: data.subscriptionId || null,
    };
};

export interface ReceiptDetails {
    sale: Sale;
    member: Member;
    relatedMember: Member | null; // Added for family subscriptions
    service: ClubService;
    subscription: Subscription;
}

export const getReceiptDetails = async (saleId: string): Promise<ReceiptDetails | null> => {
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);

    if (!saleSnap.exists()) {
        console.error("No sale found with ID:", saleId);
        return null;
    }

    const sale = docToSale(saleSnap);
    if (!sale || !sale.memberId || !sale.subscriptionId) {
        console.error("Sale data is incomplete:", sale);
        return null;
    }

    const memberSnap = await getDoc(doc(db, MEMBERS_COLLECTION, sale.memberId));
    if (!memberSnap.exists()) {
        console.error("No member found with ID:", sale.memberId);
        return null;
    }
    const member = docToMember(memberSnap);
    if (!member) {
        console.error("Could not process member data for ID:", sale.memberId);
        return null;
    }

    // --- Fetch related member if ID exists ---
    let relatedMember: Member | null = null;
    if (member.relatedMemberId) {
        try {
            const relatedMemberSnap = await getDoc(doc(db, MEMBERS_COLLECTION, member.relatedMemberId));
            if (relatedMemberSnap.exists()) {
                relatedMember = docToMember(relatedMemberSnap);
            }
        } catch (e) {
            console.warn(`Could not fetch related member (ID: ${member.relatedMemberId}). Proceeding without it.`, e);
        }
    }
    // ----------------------------------------

    const subscriptionSnap = await getDoc(doc(db, SUBSCRIPTIONS_COLLECTION, sale.subscriptionId));
    if (!subscriptionSnap.exists()) {
        console.error("No subscription found with ID:", sale.subscriptionId);
        return null;
    }
    const subscription = docToMemberSubscription(subscriptionSnap);
    if (!subscription || !subscription.serviceId) {
        console.error("Subscription data is incomplete:", subscription);
        return null;
    }

    const serviceSnap = await getDoc(doc(db, SERVICES_COLLECTION, subscription.serviceId));
    if (!serviceSnap.exists()) {
        console.error("No service found with ID:", subscription.serviceId);
        return null;
    }
    const service = docToClubService(serviceSnap);

    if (!service) {
        return null;
    }

    return {
        sale,
        member,
        relatedMember, // Include in the final object
        service,
        subscription
    };
};


// ... (rest of the existing functions: getSales, addSale, etc.)

export const getSales = async (): Promise<Sale[]> => {
    const db = getDb();
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(salesCollection, orderBy("saleDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const getInventorySales = async (): Promise<Sale[]> => {
    const db = getDb();
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(salesCollection, where('subscriptionId', '==', null), orderBy("saleDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const addSale = async (saleData: Omit<Sale, 'id'>, userId: string, userName: string): Promise<string> => {
    const db = getDb();
    const newSaleRef = doc(collection(db, SALES_COLLECTION));

    await runTransaction(db, async (transaction) => {
        transaction.set(newSaleRef, {
            ...saleData,
            saleDate: Timestamp.fromDate(new Date(saleData.saleDate)),
            totalAmount: saleData.totalAmount,
            createdAt: Timestamp.now(),
        });

        for (const item of saleData.items) {
            const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) throw new Error(`Product with ID ${item.productId} not found.`);

            const currentStock = productDoc.data().stock || 0;
            const newStock = currentStock - item.quantity;
            if (newStock < 0) throw new Error(`Not enough stock for ${item.name}.`);

            transaction.update(productRef, { stock: newStock });

            const eventData: Omit<InventoryEvent, 'id'> = {
                productId: item.productId,
                productName: item.name,
                type: 'sale',
                quantityChange: -item.quantity,
                createdAt: new Date().toISOString(),
                userId: userId,
                userName: userName,
                relatedSaleId: newSaleRef.id,
            };
            const eventRef = doc(collection(db, EVENTS_COLLECTION));
            transaction.set(eventRef, eventData);
        }
    });

    return newSaleRef.id;
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
    if (!memberId) return [];
    const db = getDb();
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(salesCollection, where("memberId", "==", memberId), orderBy("saleDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => docToSale(doc)).filter(Boolean) as Sale[];
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
    if (!id) return null;
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);
    const docSnap = await getDoc(saleRef);
    return docToSale(docSnap);
};

export const updateSale = async (id: string, data: Partial<Omit<Sale, 'id' | 'createdAt'>>): Promise<void> => {
    if (!id) throw new Error("Sale ID is required for update.");
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);
    
    const dataToUpdate: { [key: string]: unknown } = { ...data };
    if (dataToUpdate.saleDate && typeof dataToUpdate.saleDate === 'string') {
        dataToUpdate.saleDate = Timestamp.fromDate(new Date(dataToUpdate.saleDate));
    }
    
    await updateDoc(saleRef, dataToUpdate);
};

export const findOrCreateSaleForSubscription = async (subscription: Subscription): Promise<Sale | null> => {
    const db = getDb();
    const existingSale = await getSaleBySubscriptionId(subscription.id);
    if (existingSale) return existingSale;

    const firstPayment = subscription.paymentHistory?.[0];
    if (!firstPayment || !subscription.memberId) return null;

    try {
        let createdSale: Sale | null = null;
        await runTransaction(db, async (transaction) => {
            const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);
            const salesCollectionRef = collection(db, SALES_COLLECTION);

            const saleDataForFirestore = {
                memberId: subscription.memberId,
                subscriptionId: subscription.id,
                saleDate: Timestamp.fromDate(new Date(firstPayment.date)),
                items: [{
                    productId: subscription.serviceId,
                    name: subscription.serviceName,
                    quantity: 1,
                    price: firstPayment.amount, 
                }],
                totalAmount: firstPayment.amount, 
                currency: 'EUR', 
                isPaid: true, 
                status: 'completed' as const,
                createdAt: Timestamp.now(),
            };

            const newSaleRef = doc(salesCollectionRef);
            transaction.set(newSaleRef, saleDataForFirestore);

            const updatedPaymentHistory = subscription.paymentHistory.map((p, index) => {
                if (index === 0 && !p.saleId) return { ...p, saleId: newSaleRef.id };
                return p;
            });

            transaction.update(subscriptionRef, { paymentHistory: updatedPaymentHistory });
            
            const saleSnap = await transaction.get(newSaleRef);
            // Manually construct the Sale object for return to avoid another DB read
            const saleData = saleSnap.data();
            createdSale = {
                id: saleSnap.id,
                ...saleData,
                saleDate: (saleData?.saleDate as Timestamp).toDate().toISOString(),
            } as Sale;

        });
        
        console.log(`Self-healed: Created new sale for subscription ${subscription.id}`);
        return createdSale;

    } catch (error) {
        console.error("Error in findOrCreateSaleForSubscription transaction:", error);
        throw error;
    }
};

const getSaleBySubscriptionId = async (subscriptionId: string): Promise<Sale | null> => {
    if (!subscriptionId) return null;
    const db = getDb();
    const q = query(collection(db, SALES_COLLECTION), where("subscriptionId", "==", subscriptionId), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToSale(querySnapshot.docs[0]);
};
