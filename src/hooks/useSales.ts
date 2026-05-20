import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Sale } from "@/types";
import {
  getSales,
  getSalesByMemberId,
  getSalesByMemberIds,
  updateSale,
} from "@/services/sales-service";

// Add a new function to update the sale status
const updateSaleStatus = async (
  saleId: string,
  status: "pending" | "completed" | "cancelled"
) => {
  await updateSale(saleId, { status });
};

export const useSales = (memberIdOrIds?: string | string[]) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberIdOrIdsKey = Array.isArray(memberIdOrIds)
    ? memberIdOrIds.join(",")
    : memberIdOrIds || "";
  const isArray = Array.isArray(memberIdOrIds);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let salesData: Sale[] = [];
      if (memberIdOrIdsKey) {
        const ids = memberIdOrIdsKey.split(",");
        if (isArray) {
          salesData = await getSalesByMemberIds(ids);
        } else {
          salesData = await getSalesByMemberId(ids[0]);
        }
      } else {
        salesData = await getSales();
      }
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
  }, [memberIdOrIdsKey, isArray]);

  useEffect(() => {
    let isMounted = true;
    const fetchSales = async () => {
      try {
        let salesData: Sale[] = [];
        if (memberIdOrIdsKey) {
          const ids = memberIdOrIdsKey.split(",");
          if (isArray) {
            salesData = await getSalesByMemberIds(ids);
          } else {
            salesData = await getSalesByMemberId(ids[0]);
          }
        } else {
          salesData = await getSales();
        }
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
  }, [memberIdOrIdsKey, isArray]);

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
