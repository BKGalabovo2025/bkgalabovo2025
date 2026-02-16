
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, DocumentSnapshot, Timestamp, runTransaction, query, where, limit, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Sale, SaleItem, Product, Subscription, InventoryEvent } from '@/types';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const EVENTS_COLLECTION = 'inventoryEvents';
const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';

const docToSale = (doc: DocumentSnapshot): Sale | null => {
    if (!doc.id || !doc.exists()) {
        return null;
    }
    const data = doc.data() || {};

    const saleDate = data.saleDate?.toDate?.() || new Date();
    const items: SaleItem[] = data.items || [];

    let totalAmount = data.totalAmount || 0;
    const isSubscriptionSale = !!data.subscriptionId;

    // NORMALIZATION LOGIC:
    // The goal is to always return totalAmount in CENTS.
    if (isSubscriptionSale) {
        // For subscription sales, the amount is assumed to be already in CENTS in Firestore.
        // No action needed.
    } else {
        // For inventory sales, the amount is stored in EUROS.
        // Convert it to CENTS.
        totalAmount = Math.round(totalAmount * 100);
    }

    // Recalculate from items only if total is still zero.
    if (totalAmount === 0 && items.length > 0) {
        // This assumes item.price is consistent with the logic above (EUR for inventory, Cents for subs)
        totalAmount = items.reduce((acc, item) => {
            const itemPriceInCents = isSubscriptionSale ? item.price : Math.round(item.price * 100);
            return acc + (itemPriceInCents * item.quantity);
        }, 0);
    }

    const sale: Sale = {
        id: doc.id,
        memberId: data.memberId,
        saleDate: saleDate.toISOString(),
        items: items,
        status: data.status || 'completed',
        currency: data.currency || 'EUR', 
        totalAmount: totalAmount, // GUARANTEED TO BE IN CENTS
        isPaid: typeof data.isPaid === 'boolean' ? data.isPaid : true, 
        subscriptionId: data.subscriptionId || null,
    };

    return sale;
};

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
