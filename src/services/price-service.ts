
// src/services/price-service.ts

import { collection, getDocs, doc, writeBatch, getDoc, query, orderBy, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Price, PriceHistory } from '@/types/index';
import { User } from 'firebase/auth';

const PRICES_COLLECTION = 'prices';
const PRICE_HISTORY_COLLECTION = 'priceHistory';

// --- Converters ---

const docToPrice = (doc: any): Price => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || 'Няма име',
        description: data.description || '',
        value: typeof data.value === 'number' ? data.value : 0,
        currency: data.currency || 'EUR',
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        updatedAt: data.updatedAt || new Date().toISOString(),
        updatedBy: data.updatedBy || { userId: 'system', userName: 'System' },
    };
};

const docToPriceHistory = (doc: any): PriceHistory => {
    const data = doc.data();
    return {
        id: doc.id,
        priceId: data.priceId,
        timestamp: data.timestamp,
        userId: data.userId,
        userName: data.userName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        notes: data.notes || '',
    };
};


// --- Service Functions ---

/**
 * Fetches all prices from the database.
 * @returns A promise that resolves to an array of Price objects.
 */
export const getAllPrices = async (): Promise<Price[]> => {
    const db = getDb();
    const q = query(collection(db, PRICES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPrice);
};

/**
 * Fetches all *active* prices from the database.
 * This is useful for populating dropdowns where only valid prices should be shown.
 * @returns A promise that resolves to an array of active Price objects.
 */
export const getActivePrices = async (): Promise<Price[]> => {
    const db = getDb();
    const q = query(collection(db, PRICES_COLLECTION), where('isActive', '==', true), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPrice);
};

/**
 * Updates a price and logs the change in the price history.
 * @param priceId The ID of the price to update.
 * @param newValue The new price value in cents.
 * @param user The user performing the action.
 * @param notes Optional notes for the history log.
 */
export const updatePrice = async (priceId: string, newValue: number, user: User, notes?: string): Promise<void> => {
    const db = getDb();
    const priceRef = doc(db, PRICES_COLLECTION, priceId);
    const historyRef = doc(collection(db, PRICE_HISTORY_COLLECTION)); // New history entry

    const batch = writeBatch(db);

    try {
        const oldPriceSnap = await getDoc(priceRef);
        const oldPriceData = oldPriceSnap.data();

        if (!oldPriceData) {
            throw new Error(`Price with ID "${priceId}" not found.`);
        }

        const oldValue = oldPriceData.value;

        // 1. Update the price document
        batch.update(priceRef, {
            value: newValue,
            updatedAt: new Date().toISOString(),
            updatedBy: {
                userId: user.uid,
                userName: user.displayName || user.email || 'Unknown User',
            },
        });

        // 2. Create a new history log entry
        const historyEntry: Omit<PriceHistory, 'id'> = {
            priceId: priceId,
            timestamp: new Date().toISOString(),
            userId: user.uid,
            userName: user.displayName || user.email || 'Unknown User',
            oldValue: oldValue,
            newValue: newValue,
            notes: notes || '',
        };
        batch.set(historyRef, historyEntry);

        await batch.commit();

    } catch (error) {
        console.error("Error updating price:", error);
        throw new Error("Failed to update price and log history.");
    }
};

/**
 * Fetches the history of changes for a specific price.
 * @param priceId The ID of the price to get the history for.
 * @returns A promise that resolves to an array of PriceHistory objects.
 */
export const getPriceHistory = async (priceId: string): Promise<PriceHistory[]> => {
    const db = getDb();
    const q = query(collection(db, PRICE_HISTORY_COLLECTION), where("priceId", "==", priceId), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToPriceHistory);
};
