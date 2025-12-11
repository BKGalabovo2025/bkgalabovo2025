
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

/**
 * Добавя нов продукт в базата данни.
 * @param productData - Обект, съдържащ данните за продукта.
 * @returns Promise, което връща ID-то на новосъздадения документ.
 */
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
};

/**
 * Връща всички продукти от базата данни, сортирани по име.
 * @returns Promise, което връща масив с всички продукти.
 */
export const getProducts = async (): Promise<Product[]> => {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

/**
 * Актуализира продукт в базата данни.
 * @param productId - ID на продукта за актуализиране.
 * @param productData - Обект с новите данни за продукта.
 * @returns Promise, което завършва, когато актуализацията е приключила.
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

/**
 * Изтрива продукт от базата данни.
 * @param productId - ID на продукта за изтриване.
 * @returns Promise, което завършва, когато продуктът е изтрит.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};
