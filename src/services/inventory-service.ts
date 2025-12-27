import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, addDoc, runTransaction, Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Product, InventoryEvent } from '@/types';

const PRODUCTS_COLLECTION = 'products';
const EVENTS_COLLECTION = 'inventoryEvents';

const docToProduct = (doc: DocumentSnapshot): Product | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToProduct: Invalid document snapshot.", { id: doc.id });
        return null;
    }
    const data = doc.data() || {};

    // A product MUST have a valid, non-empty name.
    const name = data.name;
    if (typeof name !== 'string' || name.trim() === '') {
        console.warn(`docToProduct: Skipping product with invalid or missing name.`, { id: doc.id });
        return null; 
    }

    const product: Product = {
        id: doc.id,
        name: name,
        description: typeof data.description === 'string' ? data.description : '',
        price: typeof data.price === 'number' ? data.price : 0,
        stock: typeof data.stock === 'number' ? data.stock : 0,
        category: typeof data.category === 'string' ? data.category : 'Без категория',
        supplier: typeof data.supplier === 'string' ? data.supplier : 'Без доставчик',
        sku: typeof data.sku === 'string' ? data.sku : null,
    };
    
    return product;
};

const docToInventoryEvent = (doc: DocumentSnapshot): InventoryEvent | null => {
    if (!doc.id || !doc.exists()) {
        console.error("docToInventoryEvent: Invalid document snapshot.", { id: doc.id });
        return null;
    }
    const data = doc.data() || {};
    const event: InventoryEvent = {
        id: doc.id,
        productId: typeof data.productId === 'string' ? data.productId : '',
        productName: typeof data.productName === 'string' ? data.productName : '',
        type: ['RESTOCK', 'ADJUSTMENT', 'PRICE_UPDATE', 'SALE'].includes(data.type) ? data.type : 'ADJUSTMENT',
        quantityChange: typeof data.quantityChange === 'number' ? data.quantityChange : 0,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        userId: typeof data.userId === 'string' ? data.userId : '',
        userName: typeof data.userName === 'string' ? data.userName : '',
        notes: typeof data.notes === 'string' ? data.notes : undefined,
        oldPrice: typeof data.oldPrice === 'number' ? data.oldPrice : undefined,
        newPrice: typeof data.newPrice === 'number' ? data.newPrice : undefined,
    };
    if (!event.productId || !event.userId) {
        return null; // Core fields must exist.
    }
    return event;
};

export const getInventoryEvents = async (): Promise<InventoryEvent[]> => {
    const db = getDb();
    const eventsCollection = collection(db, EVENTS_COLLECTION);
    const q = query(eventsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToInventoryEvent).filter(Boolean) as InventoryEvent[];
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const db = getDb();
    const dataWithStock = { ...productData, stock: productData.stock ?? 0 };
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), dataWithStock);
    return docRef.id;
};

export const getProducts = async (): Promise<Product[]> => {
    const db = getDb();
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToProduct).filter(Boolean) as Product[];
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const db = getDb();
    const productDoc = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productDoc);
};

export const restockProduct = async (productId: string, quantityToAdd: number, userId: string, userName: string) => {
    const db = getDb();
    if (quantityToAdd <= 0) throw new Error("Количеството трябва да е положително.");

    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        const product = docToProduct(productDoc);
        if (!product) throw new Error("Продуктът не е намерен!");

        const newStock = product.stock + quantityToAdd;
        transaction.update(productRef, { stock: newStock });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId, productName: product.name, type: 'RESTOCK', quantityChange: quantityToAdd,
            createdAt: Timestamp.now(), userId, userName,
        };
        transaction.set(doc(collection(db, EVENTS_COLLECTION)), eventData);
    });
};

export const adjustProductStock = async (productId: string, quantityChange: number, userId: string, userName: string, notes?: string) => {
    const db = getDb();
    if (quantityChange === 0) return;

    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        const product = docToProduct(productDoc);
        if (!product) throw new Error("Продуктът не е намерен!");

        const newStock = product.stock + quantityChange;
        if (newStock < 0) throw new Error(`Наличността не може да е отрицателна.`);

        transaction.update(productRef, { stock: newStock });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId, productName: product.name, type: 'ADJUSTMENT', quantityChange, notes,
            createdAt: Timestamp.now(), userId, userName,
        };
        transaction.set(doc(collection(db, EVENTS_COLLECTION)), eventData);
    });
};

export const updateProductPrice = async (productId: string, newPrice: number, userId: string, userName: string) => {
    const db = getDb();
    if (newPrice < 0) throw new Error("Цената не може да е отрицателна.");

    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        const product = docToProduct(productDoc);
        if (!product) throw new Error("Продуктът не е намерен!");

        const oldPrice = product.price;
        if (oldPrice === newPrice) return;

        transaction.update(productRef, { price: newPrice });

        const eventData: Omit<InventoryEvent, 'id'> = {
            productId, productName: product.name, type: 'PRICE_UPDATE', oldPrice, newPrice,
            createdAt: Timestamp.now(), userId, userName,
        };
        transaction.set(doc(collection(db, EVENTS_COLLECTION)), eventData);
    });
};
