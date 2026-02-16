
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

import { Sale } from '@/types';
import { getInventorySales, updateSale } from '@/services/sales-service';

const updateSaleStatus = async (saleId: string, status: 'pending' | 'completed' | 'cancelled') => {
    await updateSale(saleId, { status });
};

/**
 * Hook specifically for fetching inventory sales (POS sales), excluding subscription-related sales.
 */
export const useInventorySales = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const salesData = await getInventorySales();
            setSales(salesData);
        } catch (err: any) {
            console.error("Error fetching inventory sales:", err);
            const errorMessage = 'Неуспешно зареждане на продажбите от инвентар.';
            setError(errorMessage);
            toast({ 
                title: "Грешка при зареждане", 
                description: errorMessage, 
                variant: "destructive" 
            });
        }
        finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const markAsPaid = useCallback(async (saleId: string) => {
      try {
        await updateSaleStatus(saleId, 'completed');
        setSales(prevSales => prevSales.map(s => 
            s.id === saleId ? { ...s, status: 'completed', isPaid: true } : s
        ));
        toast({ title: 'Продажбата е маркирана като платена' });
      } catch (err) {
        console.error('Error marking sale as paid:', err);
        toast({ title: 'Грешка при маркиране като платена', variant: 'destructive' });
      }
    }, [toast]);

    return { sales, loading, error, markAsPaid, refetch: fetchSales };
};
