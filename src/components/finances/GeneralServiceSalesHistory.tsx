"use client";

import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types";
import { deleteGeneralServiceSaleAction } from "@/lib/actions/general-services-server";
import { SharedSalesHistory } from "@/components/shared/sales/SharedSalesHistory";

export function GeneralServiceSalesHistory() {
  const { sales, isLoading, refetch } = useGeneralServices();
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [membersLoading, setMembersLoading] = useState(true);

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
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    try {
      const res = await deleteGeneralServiceSaleAction(saleId);
      if (!res.success) throw new Error(res.error);

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
      description="Списък с всички продадени клубни услуги и техния статус на плащане."
      icon={<ShoppingBag className="h-5 w-5 text-emerald-500" />}
      sales={sales}
      isLoading={isLoading || membersLoading}
      membersMap={membersMap}
      baseRoute="/finances/general-services/sales"
      onDelete={handleDeleteSale}
      showPaymentMethod={true}
    />
  );
}
