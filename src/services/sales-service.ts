
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where, orderBy, updateDoc, runTransaction, increment } from "firebase/firestore";
import { Sale, SaleItem } from '@/types';

const salesCollection = collection(db, 'sales');
const productsCollection = collection(db, 'products');

// Fetches all sales
export const getSales = async (): Promise<Sale[]> => {
    const snapshot = await getDocs(query(salesCollection, orderBy("date", "desc")));
    const sales: Sale[] = [];
    for (const saleDoc of snapshot.docs) { 
        const saleData = saleDoc.data();
        let customerName = 'Външен клиент';
        if (saleData.memberId) {
             try {
                const memberDoc = await getDoc(doc(db, 'members', saleData.memberId));
                if (memberDoc.exists()) {
                    const memberData = memberDoc.data();
                    customerName = `${memberData.firstName} ${memberData.lastName}`;
                }
            } catch (e) {
                console.error("Error fetching member name:", e)
            }
        }
        sales.push({ id: saleDoc.id, ...saleData, customerName: customerName } as Sale);
    }
    return sales;
};

// Fetches a single sale by its ID
export const getSaleById = async (id: string): Promise<Sale | null> => {
    const docRef = doc(db, 'sales', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const saleData = docSnap.data();
    let customerName = 'Външен клиент';
    if (saleData.memberId) {
        try {
            const memberDoc = await getDoc(doc(db, 'members', saleData.memberId));
            if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                customerName = `${memberData.firstName} ${memberData.lastName}`;
            }
        } catch (e) {
            console.error("Error fetching member name:", e);
        }
    }

    return { id: docSnap.id, ...saleData, customerName } as Sale;
};

// Fetches all sales for a specific member
export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
    const q = query(salesCollection, where("memberId", "==", memberId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(saleDoc => ({ id: saleDoc.id, ...saleDoc.data() } as Sale));
};

/**
 * Adds a new sale and updates product stock in a transaction.
 * @param saleData The data for the new sale.
 * @returns The ID of the newly created sale document.
 */
export const addSale = async (saleData: Omit<Sale, 'id' | 'customerName'>): Promise<string> => {
    try {
        const newSaleId = await runTransaction(db, async (transaction) => {
            // 1. Check for stock availability
            for (const item of saleData.items) {
                const productRef = doc(productsCollection, item.productId);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists() || productDoc.data().stock < item.quantity) {
                    throw new Error(`Недостатъчна наличност за ${item.name}. Налични: ${productDoc.data().stock}, Искани: ${item.quantity}`);
                }
            }

            // 2. Decrease stock for each product
            for (const item of saleData.items) {
                const productRef = doc(productsCollection, item.productId);
                transaction.update(productRef, { 
                    stock: increment(-item.quantity) 
                });
            }

            // 3. Create the new sale document
            const newSaleRef = doc(salesCollection); // Automatically generate a new ID
            transaction.set(newSaleRef, saleData);
            
            return newSaleRef.id;
        });
        return newSaleId;
    } catch (error) {
        console.error("Транзакцията за създаване на продажба се провали: ", error);
        // Re-throw the error to be handled by the calling UI
        throw error; 
    }
};

/**
 * Deletes a sale and restores product stock in a transaction.
 * @param saleId The ID of the sale to delete.
 */
export const deleteSale = async (saleId: string): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            const saleRef = doc(salesCollection, saleId);
            const saleDoc = await transaction.get(saleRef);

            if (!saleDoc.exists()) {
                throw new Error("Продажбата не е намерена.");
            }

            const saleItems = saleDoc.data().items as SaleItem[];

            // 1. Restore stock for each product
            for (const item of saleItems) {
                const productRef = doc(productsCollection, item.productId);
                // We need to check if product exists before incrementing
                const productDoc = await transaction.get(productRef);
                if(productDoc.exists()) {
                    transaction.update(productRef, { 
                        stock: increment(item.quantity) 
                    });
                }
            }

            // 2. Delete the sale document
            transaction.delete(saleRef);
        });
    } catch (error) {
        console.error("Транзакцията за изтриване на продажба се провали: ", error);
        throw error; // Re-throw to be handled by UI
    }
};


// Marks a sale as paid by updating its status to 'completed'
export const markSaleAsPaid = async (saleId: string): Promise<void> => {
    const saleRef = doc(db, 'sales', saleId);
    await updateDoc(saleRef, {
        status: 'completed'
    });
};
