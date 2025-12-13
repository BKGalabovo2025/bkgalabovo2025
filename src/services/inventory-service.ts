
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

/**
 * Adds a new product to the database. 
 * The document ID is auto-generated and stored in a 'productId' field within the document.
 * @param productData - The product data, without 'id' and 'productId'.
 * @returns The ID of the newly created product.
 */
export const addProduct = async (productData: Omit<Product, 'id' | 'productId'>): Promise<string> => {
    // Create a new document reference with an auto-generated ID
    const newProductRef = doc(collection(db, 'products'));
    
    // Create the full product object, including the generated ID
    const newProduct: Omit<Product, 'id'> = {
        ...productData,
        productId: newProductRef.id, // Store the auto-generated ID in the productId field
    };

    // Set the document with the new data
    await setDoc(newProductRef, newProduct);

    return newProductRef.id;
};

/**
 * Retrieves all products from the database, sorted by name.
 * It ensures the document ID is included in the returned product object.
 * @returns A promise that resolves to an array of all products.
 */
export const getProducts = async (): Promise<Product[]> => {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        // The 'id' is the document ID, and we expect 'productId' to be a field in the document data.
        return { id: doc.id, ...doc.data() } as Product;
    });
};

/**
 * Updates a product in the database.
 * @param productId - The ID of the product to update.
 * @param productData - An object with the fields to update.
 * @returns A promise that completes when the update is finished.
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'productId'>>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

/**
 * Deletes a product from the database.
 * @param productId - The ID of the product to delete.
 * @returns A promise that completes when the product is deleted.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};
