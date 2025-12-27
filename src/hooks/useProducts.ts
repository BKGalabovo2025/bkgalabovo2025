
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Product } from '@/types';
import { useToast } from '@/components/ui/use-toast';

type NewProduct = Omit<Product, 'id'>;

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const db = getDb();
        setIsLoading(true);
        const productsCollection = collection(db, 'products');
        const q = query(productsCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Product));
            setProducts(productsData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching products:", err);
            setError(err);
            setIsLoading(false);
            toast({ title: "Грешка при зареждане на продуктите", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [toast]);

    const addProduct = useCallback(async (productData: NewProduct) => {
        const db = getDb();
        try {
            await addDoc(collection(db, 'products'), productData);
            toast({ title: "Продуктът е добавен успешно" });
        } catch (err) {
            console.error("Error adding product:", err);
            toast({ title: "Грешка при добавяне на продукт", variant: "destructive" });
            throw err;
        }
    }, [toast]);

    const updateProduct = useCallback(async (productId: string, productData: Partial<NewProduct>) => {
        const db = getDb();
        const originalProducts = products;
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...productData } as Product : p));
        
        try {
            await updateDoc(doc(db, 'products', productId), productData);
            toast({ title: "Продуктът е обновен" });
        } catch (err) {
            setProducts(originalProducts);
            console.error("Error updating product:", err);
            toast({ title: "Грешка при обновяване", variant: "destructive" });
            throw err;
        }
    }, [products, toast]);

    const deleteProduct = useCallback(async (productId: string) => {
        const db = getDb();
        const originalProducts = products;
        setProducts(prev => prev.filter(p => p.id !== productId));

        try {
            await deleteDoc(doc(db, 'products', productId));
            toast({ title: "Продуктът е изтрит" });
        } catch (err) {
            setProducts(originalProducts);
            console.error("Error deleting product:", err);
            toast({ title: "Грешка при изтриване", variant: "destructive" });
            throw err;
        }
    }, [products, toast]);

    return { products, isLoading, error, addProduct, updateProduct, deleteProduct };
};
