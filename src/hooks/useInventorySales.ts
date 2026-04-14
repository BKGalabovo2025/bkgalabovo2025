import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Sale } from "@/types";
import { getInventorySales, updateSale } from "@/services/sales-service";

const updateSaleStatus = async (
  saleId: string,
  status: "pending" | "completed" | "cancelled"
) => {
  await updateSale(saleId, { status });
};

/**
 * Hook specifically for fetching inventory sales (POS sales), excluding subscription-related sales.
 */
export const useInventorySales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const salesData = await getInventorySales();
      setSales(salesData);
    } catch (err: unknown) {
      console.error("Error fetching inventory sales:", err);
      const errorMessage = "Неуспешно зареждане на продажбите от инвентар.";
      setError(errorMessage);
      toast.error("Грешка при зареждане", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const markAsPaid = useCallback(async (saleId: string) => {
    try {
      await updateSaleStatus(saleId, "completed");
      setSales((prevSales) =>
        prevSales.map((s) =>
          s.id === saleId ? { ...s, status: "completed", isPaid: true } : s
        )
      );
      toast.success("Продажбата е маркирана като платена");
    } catch (err) {
      console.error("Error marking sale as paid:", err);
      toast.error("Грешка при маркиране като платена");
    }
  }, []);

  return { sales, loading, error, markAsPaid, refetch: fetchSales };
};
