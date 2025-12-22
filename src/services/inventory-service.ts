
import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, addDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, InventoryEvent } from '@/types';

/**
 * Retrieves all inventory events, sorted by most recent first.
 * @returns A promise that resolves to an array of inventory events.
 */
export const getInventoryEvents = async (): Promise<InventoryEvent[]> => {
    const eventsCollection = collection(db, 'inventoryEvents');
    const q = query(eventsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryEvent));
};

/**
 * Adds a new product to the database.
 */
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const dataWithStock = { ...productData, stock: productData.stock ?? 0 };
    const docRef = await addDoc(collection(db, 'products'), dataWithStock);
    return docRef.id;
};

/**
 * Retrieves all products from the database, sorted by name.
 */
export const getProducts = async (): Promise<Product[]> => {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, stock: data.stock ?? 0 } as Product;
    });
};

/**
 * Deletes a product from the database.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};

/**
 * Restocks a product and creates an inventory event log.
 */
export const restockProduct = async (productId: string, quantityToAdd: number, userId: string, userName: string) => {
    if (quantityToAdd <= 0) {
        throw new Error("Количеството за презареждане трябва да е положително число.");
    }

    const productRef = doc(db, 'products', productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Продуктът не е намерен!");

        const currentData = productDoc.data();
        const newStock = (currentData.stock || 0) + quantityToAdd;

        transaction.update(productRef, { stock: newStock });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId,
            productName: currentData.name,
            type: 'RESTOCK',
            quantityChange: quantityToAdd,
            createdAt: Timestamp.now(),
            userId,
            userName,
        };
        transaction.set(doc(collection(db, 'inventoryEvents')), eventData);
    });
};

/**
 * Adjusts a product's stock (increase or decrease) and creates an inventory event log.
 */
export const adjustProductStock = async (productId: string, quantityChange: number, userId: string, userName: string, notes?: string) => {
    if (quantityChange === 0) {
        throw new Error("Количеството за корекция не може да бъде нула.");
    }

    const productRef = doc(db, 'products', productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Продуктът не е намерен!");

        const currentData = productDoc.data();
        const newStock = (currentData.stock || 0) + quantityChange;

        if (newStock < 0) {
            throw new Error(`Корекцията би направила наличността отрицателна (${newStock}). Моля, проверете количеството.`);
        }

        transaction.update(productRef, { stock: newStock });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId,
            productName: currentData.name,
            type: 'ADJUSTMENT',
            quantityChange,
            notes: notes || null,
            createdAt: Timestamp.now(),
            userId,
            userName,
        };
        transaction.set(doc(collection(db, 'inventoryEvents')), eventData);
    });
};

/**
 * Updates a product's price and creates an inventory event log.
 */
export const updateProductPrice = async (productId: string, newPrice: number, userId: string, userName: string) => {
    if (newPrice < 0) {
        throw new Error("Цената не може да бъде отрицателно число.");
    }

    const productRef = doc(db, 'products', productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Продуктът не е намерен!");

        const currentData = productDoc.data();
        if (currentData.price === newPrice) return;

        transaction.update(productRef, { price: newPrice });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId,
            productName: currentData.name,
            type: 'PRICE_UPDATE',
            oldPrice: currentData.price,
            newPrice,
            createdAt: Timestamp.now(),
            userId,
            userName,
        };
        transaction.set(doc(collection(db, 'inventoryEvents')), eventData);
    });
};
