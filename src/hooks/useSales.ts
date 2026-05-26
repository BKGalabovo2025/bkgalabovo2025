import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Sale } from "@/types";
import {
  getSales,
  getSalesByMemberId,
  getSalesByMemberIds,
} from "@/services/sales-service";
import { useAuth } from "@/context/auth-context";
import { deleteSaleAction, updateSaleAction } from "@/lib/actions/sales";

export const useSales = (memberIdOrIds?: string | string[]) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { idToken } = useAuth();

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

  const markAsPaid = useCallback(
    async (saleId: string) => {
      if (!idToken) {
        toast.error("Грешка при оторизация");
        return;
      }
      try {
        const res = await updateSaleAction(saleId, idToken, {
          status: "completed",
          isPaid: true,
        });
        if (res.success) {
          setSales((prevSales) =>
            prevSales.map((s) =>
              s.id === saleId ? { ...s, status: "completed", isPaid: true } : s
            )
          );
          toast.success("Продажбата е маркирана като платена");
        } else {
          toast.error("Грешка при маркиране като платена: " + res.message);
        }
      } catch (err) {
        console.error("Error marking sale as paid:", err);
        toast.error("Грешка при маркиране като платена");
      }
    },
    [idToken]
  );

  const markAsUnpaid = useCallback(
    async (saleId: string) => {
      if (!idToken) {
        toast.error("Грешка при оторизация");
        return;
      }
      try {
        const res = await updateSaleAction(saleId, idToken, {
          status: "pending",
          isPaid: false,
        });
        if (res.success) {
          setSales((prevSales) =>
            prevSales.map((s) =>
              s.id === saleId ? { ...s, status: "pending", isPaid: false } : s
            )
          );
          toast.success("Плащането е отменено");
        } else {
          toast.error("Грешка при отмяна на плащането: " + res.message);
        }
      } catch (err) {
        console.error("Error marking sale as unpaid:", err);
        toast.error("Грешка при отмяна на плащането");
      }
    },
    [idToken]
  );

  const deleteSale = useCallback(
    async (saleId: string) => {
      if (!idToken) {
        toast.error("Грешка при оторизация");
        return;
      }

      const confirmDelete = window.confirm(
        "Сигурни ли сте, че искате да изтриете този запис? Това действие е необратимо."
      );
      if (!confirmDelete) return;

      try {
        const result = await deleteSaleAction(saleId, idToken);

        if (result.success) {
          setSales((prevSales) => prevSales.filter((s) => s.id !== saleId));
          toast.success(result.message || "Записът бе изтрит успешно.");
        } else {
          toast.error(result.message || "Грешка при изтриването.");
        }
      } catch (err) {
        console.error("Error deleting sale:", err);
        toast.error("Грешка при изтриването.");
      }
    },
    [idToken]
  );

  return {
    sales,
    loading,
    error,
    markAsPaid,
    markAsUnpaid,
    deleteSale,
    refetch,
  };
};
