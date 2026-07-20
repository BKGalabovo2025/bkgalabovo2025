"use client";

import { useEffect, useState } from "react";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { Sale, Member } from "@/types";
import { toast } from "sonner";
import { deleteSaleAction } from "@/lib/actions/sales";
import { getAuth } from "firebase/auth";
import { SharedSalesHistory } from "@/components/shared/sales/SharedSalesHistory";
import { Package } from "lucide-react";

const InventorySalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedSales, fetchedMembers] = await Promise.all([
        getSales(),
        getAllMembers(),
      ]);

      const dict: Record<string, string> = {};
      fetchedMembers.forEach((m: Member) => {
        dict[m.id] = `${m.firstName} ${m.lastName}`;
      });
      setMembersMap(dict);

      const inventorySales = fetchedSales.filter(
        (s) => !s.type || s.type === "inventory"
      );
      setSales(inventorySales);
    } catch (err) {
      toast.error("Грешка при зареждане на историята на продажбите.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Моля влезте в профила си");
      const idToken = await currentUser.getIdToken();

      const res = await deleteSaleAction(saleId, idToken);
      if (!res.success) throw new Error(res.message || "Грешка при изтриване");

      toast.success("Успех", {
        description: "Продажбата беше изтрита успешно.",
      });
      fetchData();
    } catch (error: unknown) {
      toast.error("Грешка", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <SharedSalesHistory
      title="История на продажбите"
      description="Проследяване на всички направени продажби от склада."
      icon={<Package className="h-5 w-5 text-indigo-500" />}
      sales={sales}
      isLoading={loading}
      membersMap={membersMap}
      baseRoute="/inventory/sales"
      onDelete={handleDeleteSale}
      showPaymentMethod={true}
    />
  );
};

export default InventorySalesHistory;
