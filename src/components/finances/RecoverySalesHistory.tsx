"use client";

import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types";
import { deleteSaleAction } from "@/lib/actions/sales";
import { SharedSalesHistory } from "@/components/shared/sales/SharedSalesHistory";

export function RecoverySalesHistory() {
  const { sales, isLoading, refetch } = useRecoveryServices();
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [membersLoading, setMembersLoading] = useState(true);
  const { idToken } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const fetchedMembers = await getAllMembers();
        const dict: Record<string, string> = {};
        fetchedMembers.forEach((m: Member) => {
          dict[m.id] = `${m.firstName} ${m.lastName}`;
        });
        setMembersMap(dict);
      } catch (err) {
        console.error("Грешка при зареждане на членове", err);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleDeleteSale = async (saleId: string) => {
    if (!idToken) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    try {
      const res = await deleteSaleAction(saleId, idToken);
      if (!res.success) throw new Error(res.message || "Грешка при изтриване.");

      toast.success("Успех", {
        description: "Продажбата беше изтрита успешно.",
      });
      if (refetch) refetch();
    } catch (error: unknown) {
      toast.error("Грешка", {
        description:
          (error instanceof Error ? error.message : "Unknown error") ||
          "Грешка при изтриване.",
      });
    }
  };

  return (
    <SharedSalesHistory
      title="История на продажбите"
      description="Проследяване на всички направени продажби на възстановяване."
      icon={<ShoppingCart className="size-5 text-emerald-500" />}
      sales={sales}
      isLoading={isLoading || membersLoading}
      membersMap={membersMap}
      baseRoute="/sales"
      onDelete={handleDeleteSale}
      showPaymentMethod={false}
    />
  );
}
