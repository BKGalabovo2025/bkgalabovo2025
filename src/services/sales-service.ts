
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, DocumentSnapshot, Timestamp, runTransaction, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Sale, SaleItem } from '@/types';

import { Product } from '@/types';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';

const docToSale = (doc: DocumentSnapshot): Sale | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToSale: Invalid document snapshot provided.", { id: doc.id });
        return null;
    }
    const data = doc.data() || {};

    const validatedItems = (Array.isArray(data.items) ? data.items : []).map((item: any): SaleItem | null => {
        if (!item || typeof item !== 'object') {
            console.warn("Skipping invalid item in sale:", { saleId: doc.id, item });
            return null;
        }
        return {
            productId: typeof item.productId === 'string' ? item.productId : 'unknown-product',
            name: typeof item.name === 'string' && item.name ? item.name : 'Изтрит/невалиден продукт',
            quantity: typeof item.quantity === 'number' ? item.quantity : 0,
            price: typeof item.price === 'number' ? item.price : 0,
        };
    }).filter(Boolean) as SaleItem[];

    const sale: Sale = {
        id: doc.id,
        memberId: typeof data.memberId === 'string' ? data.memberId : '',
        date: data.date?.toDate?.() instanceof Date ? data.date.toDate().toISOString() : new Date().toISOString(),
        items: validatedItems,
        status: ['pending', 'completed', 'cancelled'].includes(data.status) ? data.status : 'pending',
        currency: (data.currency === 'BGN' || data.currency === 'EUR') ? data.currency : 'BGN',
    };

    return sale;
};

export const getSales = async (): Promise<Sale[]> => {
    const db = getDb();
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(salesCollection, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
    if (!memberId) return [];
    
    const db = getDb();
    const salesCollection = collection(db, SALES_COLLECTION);
    
    const q = query(salesCollection, where("memberId", "==", memberId), orderBy("date", "desc"));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => docToSale(doc)).filter(Boolean) as Sale[];
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
    if (!id) {
        console.error("getSaleById called with an invalid ID.");
        return null;
    }
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);
    const docSnap = await getDoc(saleRef);
    return docToSale(docSnap);
};

export const addSale = async (saleData: Omit<Sale, 'id'>): Promise<string> => {
    const db = getDb();

    return await runTransaction(db, async (transaction) => {
        const productUpdates: { ref: any, newStock: number }[] = [];

        // --- READ PHASE ---
        for (const item of saleData.items) {
            const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists() || !('quantity' in productDoc.data())) {
                throw new Error(`Продукт с ID ${item.productId} не е намерен или няма информация за наличност.`);
            }
            const currentStock = productDoc.data().quantity as number;
            if (currentStock < item.quantity) {
                throw new Error(`Няма достатъчно наличност за ${item.name}. Налични: ${currentStock}, Нужни: ${item.quantity}`);
            }
            productUpdates.push({ ref: productRef, newStock: currentStock - item.quantity });
        }

        // --- WRITE PHASE ---
        const newSaleRef = doc(collection(db, SALES_COLLECTION));
        const dataToSave = {
            ...saleData,
            date: Timestamp.fromDate(new Date(saleData.date)),
        };
        transaction.set(newSaleRef, dataToSave);

        for (const update of productUpdates) {
            transaction.update(update.ref, { quantity: update.newStock });
        }

        return newSaleRef.id;
    });
};

export const updateSale = async (id: string, saleData: Partial<Omit<Sale, 'id'>>): Promise<void> => {
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);

    await runTransaction(db, async (transaction) => {
        // --- READ PHASE ---
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) {
            throw new Error("Продажбата, която се опитвате да обновите, не съществува.");
        }
        const oldSale = docToSale(saleDoc) as Sale;

        const stockAdjustments = new Map<string, number>();
        oldSale.items.forEach(item => {
            stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) + item.quantity);
        });

        const newItems = saleData.items || oldSale.items;
        newItems.forEach(item => {
            stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) - item.quantity);
        });

        const productUpdates: { ref: any, newStock: number }[] = [];
        for (const [productId, quantityChange] of stockAdjustments.entries()) {
            if (quantityChange === 0) continue;

            const productRef = doc(db, PRODUCTS_COLLECTION, productId);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists()) {
                throw new Error(`Продукт с ID ${productId} не е намерен.`);
            }

            const currentStock = productDoc.data().quantity as number;
            const newStock = currentStock + quantityChange;

            if (newStock < 0) {
                const productName = productDoc.data().name || 'Unknown Product';
                throw new Error(`Недостатъчна наличност за продукт ${productName}.`);
            }
            productUpdates.push({ ref: productRef, newStock });
        }

        // --- WRITE PHASE ---
        const dataToUpdate: { [key: string]: any } = { ...saleData };
        if (saleData.date) {
            dataToUpdate.date = Timestamp.fromDate(new Date(saleData.date as string));
        }
        transaction.update(saleRef, dataToUpdate);

        for (const update of productUpdates) {
            transaction.update(update.ref, { quantity: update.newStock });
        }
    });
};

export const deleteSale = async (id: string): Promise<void> => {
    const db = getDb();
    const saleRef = doc(db, SALES_COLLECTION, id);

    await runTransaction(db, async (transaction) => {
        // --- READ PHASE ---
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) {
            console.warn(`Sale with ID ${id} not found for deletion.`);
            return; 
        }
        const saleData = docToSale(saleDoc) as Sale;

        const productUpdates = [];
        for (const item of saleData.items) {
            if (item.productId === 'unknown-product') continue;

            const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
            const productDoc = await transaction.get(productRef); 

            if (productDoc.exists()) {
                const currentStock = productDoc.data().quantity || 0;
                const newStock = currentStock + item.quantity;
                productUpdates.push({ ref: productRef, stock: newStock }); 
            } else {
                console.warn(`Product with ID ${item.productId} not found. Cannot restore stock.`);
            }
        }

        // --- WRITE PHASE ---
        transaction.delete(saleRef);

        for (const update of productUpdates) {
            transaction.update(update.ref, { quantity: update.stock });
        }
    });
};
