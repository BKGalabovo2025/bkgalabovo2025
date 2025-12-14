
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

/**
 * Adds a new product to the database.
 * @param productData - The product data, without the 'id'.
 * @returns The ID of the newly created product.
 */
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
};

/**
 * Retrieves all products from the database, sorted by name.
 * @returns A promise that resolves to an array of all products.
 */
export const getProducts = async (): Promise<Product[]> => {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Product;
    });
};

/**
 * Updates a product in the database.
 * @param productId - The ID of the product to update.
 * @param productData - An object with the fields to update.
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

/**
 * Deletes a product from the database.
 * @param productId - The ID of the product to delete.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};
