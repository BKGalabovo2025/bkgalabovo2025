import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

import { Sale } from "@/types";
import {
  getSales,
  getSalesByMemberId,
  updateSale,
} from "@/services/sales-service";

// Add a new function to update the sale status
const updateSaleStatus = async (
  saleId: string,
  status: "pending" | "completed" | "cancelled"
) => {
  await updateSale(saleId, { status });
};

export const useSales = (memberId?: string) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const salesData = memberId
        ? await getSalesByMemberId(memberId)
        : await getSales();
      setSales(salesData);
    } catch (err: unknown) {
      console.error("Error fetching sales:", err);
      const errorMessage = "Неуспешно зареждане на продажбите.";
      setError(errorMessage);
      toast.error("Грешка при зареждане", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [memberId, activeBranch]);

  useEffect(() => {
    let isMounted = true;
    const fetchSales = async () => {
      try {
        const salesData = memberId
          ? await getSalesByMemberId(memberId)
          : await getSales();
        if (isMounted) {
          setSales(salesData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Error fetching sales:", err);
          const errorMessage = "Неуспешно зареждане на продажбите.";
          setError(errorMessage);
          toast.error("Грешка при зареждане", {
            description: errorMessage,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSales();

    return () => {
      isMounted = false;
    };
  }, [memberId, activeBranch]);

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

  return { sales, loading, error, markAsPaid, refetch };
};
