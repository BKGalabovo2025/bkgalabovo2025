
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

import { Sale } from '@/types';
import { getSales, getSalesByMemberId, markSaleAsPaid as serviceMarkAsPaid } from '@/services/sales-service';

export const useSales = (memberId?: string) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSales = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // If a memberId is provided, fetch sales specifically for that member.
                // Otherwise, fetch all sales.
                const salesData = memberId 
                    ? await getSalesByMemberId(memberId) 
                    : await getSales();
                
                setSales(salesData);
            } catch (err: any) {
                console.error("Error fetching sales:", err);
                const errorMessage = 'Неуспешно зареждане на продажбите.';
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
        };

        fetchSales();
    }, [memberId, toast]);

    const markAsPaid = useCallback(async (saleId: string) => {
      try {
        await serviceMarkAsPaid(saleId);
        // Manually update the state to reflect the change in the UI immediately
        setSales(prevSales => prevSales.map(s => 
            s.id === saleId ? { ...s, isPaid: true } : s
        ));
        toast({ title: 'Продажбата е маркирана като платена' });
      } catch (err) {
        console.error('Error marking sale as paid:', err);
        toast({ title: 'Грешка при маркиране като платена', variant: 'destructive' });
      }
    }, [toast]);

    return { sales, loading, error, markAsPaid };
};
