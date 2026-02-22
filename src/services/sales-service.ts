
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, DocumentSnapshot, Timestamp, runTransaction, query, where, limit, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Sale, SaleItem, Product, Subscription, InventoryEvent, Member, ClubService } from '@/types';
import { docToMember } from './member-service'; 
import { docToClubService, docToMemberSubscription } from './subscription-service'; // CORRECTED IMPORT

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const EVENTS_COLLECTION = 'inventoryEvents';
const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const MEMBERS_COLLECTION = 'members';
const SERVICES_COLLECTION = 'clubServices';

// Existing docToSale function (make sure it's robust)
const docToSale = (doc: DocumentSnapshot): Sale | null => {
    if (!doc.id || !doc.exists()) {
        return null;
    }
    const data = doc.data() || {};
    const saleDate = data.saleDate?.toDate?.() || new Date();
    
    return {
        id: doc.id,
        memberId: data.memberId,
        saleDate: saleDate.toISOString(),
        items: data.items || [],
        status: data.status || 'completed',
        currency: data.currency || 'EUR', 
        totalAmount: data.totalAmount, // Assuming it's in cents
        isPaid: typeof data.isPaid === 'boolean' ? data.isPaid : true, 
        subscriptionId: data.subscriptionId || null,
    };
};

// New type for the detailed receipt
export interface ReceiptDetails {
    sale: Sale;
    member: Member;
    service: ClubService;
    subscription: Subscription;
}

// New efficient function to get all receipt details
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

    // Fetch related documents
    const memberRef = doc(db, MEMBERS_COLLECTION, sale.memberId);
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, sale.subscriptionId);

    const [memberSnap, subscriptionSnap] = await Promise.all([
        getDoc(memberRef),
        getDoc(subscriptionRef),
    ]);

    if (!memberSnap.exists()) {
        console.error("No member found with ID:", sale.memberId);
        return null;
    }

    if (!subscriptionSnap.exists()) {
        console.error("No subscription found with ID:", sale.subscriptionId);
        return null;
    }

    const member = docToMember(memberSnap);
    const subscription = docToMemberSubscription(subscriptionSnap); // CORRECTED FUNCTION NAME

    if (!subscription || !subscription.serviceId) {
        console.error("Subscription data is incomplete:", subscription);
        return null;
    }

    const serviceRef = doc(db, SERVICES_COLLECTION, subscription.serviceId);
    const serviceSnap = await getDoc(serviceRef);

    if (!serviceSnap.exists()) {
        console.error("No service found with ID:", subscription.serviceId);
        return null;
    }

    const service = docToClubService(serviceSnap);

    if (!member || !service || !subscription) { // Added subscription to the check
        return null;
    }

    return {
        sale,
        member,
        service,
        subscription
    };
};

// ... (rest of the existing functions: getSales, getInventorySales, addSale, etc.)

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

    // Data sent to this function should have totalAmount in EUROS
    const totalAmountInCents = Math.round(saleData.totalAmount * 100);

    await runTransaction(db, async (transaction) => {
        transaction.set(newSaleRef, {
            ...saleData,
            saleDate: Timestamp.fromDate(new Date(saleData.saleDate)),
            // We store inventory sales in EUROS to maintain consistency with old data.
            // The normalization happens on read.
            totalAmount: saleData.totalAmount,
            createdAt: Timestamp.now(),
        });

        for (const item of saleData.items) {
            const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists()) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }

            const currentStock = productDoc.data().stock || 0;
            const newStock = currentStock - item.quantity;

            if (newStock < 0) {
                throw new Error(`Not enough stock for ${item.name}.`);
            }

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

export const updateSale = async (id: string, data: Partial<Sale>): Promise<void> => {
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);
    // This is tricky. Assume data is in the correct format for now.
    await updateDoc(saleRef, data);
};

export const deleteSale = async (id: string): Promise<void> => {
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);
    await deleteDoc(saleRef);
};

export const getSaleBySubscriptionId = async (subscriptionId: string): Promise<Sale | null> => {
    if (!subscriptionId) return null;
    const db = getDb();
    const q = query(collection(db, SALES_COLLECTION), where("subscriptionId", "==", subscriptionId), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToSale(querySnapshot.docs[0]);
};

export const findOrCreateSaleForSubscription = async (subscription: Subscription): Promise<Sale | null> => {
    const db = getDb();
    const existingSale = await getSaleBySubscriptionId(subscription.id);
    if (existingSale) return existingSale;

    const firstPayment = subscription.paymentHistory?.[0];
    if (!firstPayment || !subscription.memberId) {
        console.warn(`Cannot create sale for subscription ${subscription.id}: no payment history or memberId found.`);
        return null;
    }

    try {
        let createdSale: Sale | null = null;
        await runTransaction(db, async (transaction) => {
            const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscription.id);
            const salesCollectionRef = collection(db, SALES_COLLECTION);
            const saleDate = new Date(firstPayment.date);

            // Data for Firestore. Amounts for subscriptions are stored in CENTS.
            const saleDataForFirestore = {
                memberId: subscription.memberId,
                subscriptionId: subscription.id,
                saleDate: Timestamp.fromDate(saleDate),
                items: [{
                    productId: subscription.serviceId,
                    name: subscription.serviceName,
                    quantity: 1,
                    price: firstPayment.amount, // This is in CENTS
                }],
                totalAmount: firstPayment.amount, // This is in CENTS
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
            
            // Return a normalized Sale object (docToSale will handle this)
            createdSale = docToSale(await transaction.get(newSaleRef));
        });
        
        console.log(`Self-healed: Created new sale for subscription ${subscription.id}`);
        return createdSale;

    } catch (error) {
        console.error("Error in findOrCreateSaleForSubscription transaction:", error);
        throw error;
    }
};
