
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale } from '@/types';
import { useToast } from '@/components/ui/use-toast';

type NewSale = Omit<Sale, 'id'>;

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return date;
    return undefined;
};

export const useSales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const salesCollection = collection(db, 'sales');
        // Note: We are ordering by 'date' now, not 'saleDate'. Ensure this field exists in Firestore.
        const q = query(salesCollection, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesData = snapshot.docs.map(doc => {
                const data = doc.data();
                // Explicitly construct the Sale object to ensure type safety
                return {
                    id: doc.id,
                    date: toISOStringOrUndefined(data.date) || new Date().toISOString(),
                    items: data.items || [],
                    total: data.total || 0,
                    status: data.status || 'completed',
                    memberId: data.memberId || null,
                    paymentMethod: data.paymentMethod || 'cash',
                } as Sale;
            });
            setSales(salesData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching sales:", err);
            setError(err);
            setIsLoading(false);
            toast({ title: "Грешка при зареждане на продажбите", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [toast]);

    const addSale = useCallback(async (saleData: NewSale) => {
        try {
            // Ensure the date is in the correct format before sending to Firestore
            const dataToSend = {
                ...saleData,
                date: saleData.date ? new Date(saleData.date) : new Date(),
            };
            await addDoc(collection(db, 'sales'), dataToSend);
            toast({ title: "Продажбата е регистрирана" });
        } catch (err) {
            console.error("Error adding sale:", err);
            toast({ title: "Грешка при регистриране на продажба", variant: "destructive" });
            throw err;
        }
    }, [toast]);

    const updateSale = useCallback(async (saleId: string, saleData: Partial<NewSale>) => {
        const originalSales = sales;
        // Optimistic update
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...saleData } as Sale : s));
        
        try {
            const dataToSend: { [key: string]: any } = { ...saleData };
            if (saleData.date) {
                dataToSend.date = new Date(saleData.date);
            }
            await updateDoc(doc(db, 'sales', saleId), dataToSend);
            toast({ title: "Продажбата е обновена" });
        } catch (err) {
            setSales(originalSales); // Rollback on error
            console.error("Error updating sale:", err);
            toast({ title: "Грешка при обновяване", variant: "destructive" });
            throw err;
        }
    }, [sales, toast]);

    const deleteSale = useCallback(async (saleId: string) => {
        const originalSales = sales;
        setSales(prev => prev.filter(s => s.id !== saleId));

        try {
            await deleteDoc(doc(db, 'sales', saleId));
            toast({ title: "Продажбата е изтрита" });
        } catch (err) {
            setSales(originalSales);
            console.error("Error deleting sale:", err);
            toast({ title: "Грешка при изтриване", variant: "destructive" });
            throw err;
        }
    }, [sales, toast]);

    return { sales, isLoading, error, addSale, updateSale, deleteSale };
};
