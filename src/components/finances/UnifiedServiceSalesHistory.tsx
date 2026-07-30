"use client";

import { Dumbbell, ShoppingBag, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SharedSalesHistory } from "@/components/shared/sales/SharedSalesHistory";
import { useAuth } from "@/context/auth-context";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import { useTrainingServices } from "@/hooks/useTrainingServices";
import { deleteGeneralServiceSaleAction } from "@/lib/actions/general-services-server";
import { deleteSaleAction } from "@/lib/actions/sales";
import { getAllMembers } from "@/services/member-service";
import { Member, Sale } from "@/types";

type ServiceType = "general" | "training" | "recovery";

interface UnifiedProps {
  serviceType: ServiceType;
  sales: Sale[];
  isLoading: boolean;
  refetch: () => void;
  deleteAction: (
    saleId: string,
    token?: string
  ) => Promise<{
    success?: boolean;
    message?: string | null;
    error?: string | null;
  }>;
  title: string;
  description: string;
  baseRoute: string;
}

function UnifiedServiceSalesHistory({
  serviceType,
  sales,
  isLoading,
  refetch,
  deleteAction,
  title,
  description,
  baseRoute,
}: UnifiedProps) {
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
    if (serviceType !== "general" && !idToken) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    try {
      const res = await deleteAction(saleId, idToken || undefined);
      if (!res.success)
        throw new Error(res.message || res.error || "Грешка при изтриване.");

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

  const icons = {
    general: <ShoppingBag className="size-5 text-emerald-500" />,
    training: <Dumbbell className="size-5 text-indigo-500" />,
    recovery: <ShoppingCart className="size-5 text-emerald-500" />,
  };

  return (
    <SharedSalesHistory
      title={title}
      description={description}
      icon={icons[serviceType]}
      sales={sales}
      isLoading={isLoading || membersLoading}
      membersMap={membersMap}
      baseRoute={baseRoute}
      onDelete={handleDeleteSale}
      showPaymentMethod={serviceType === "general"}
    />
  );
}

export function GeneralServiceSalesHistory() {
  const { sales, isLoading, refetch } = useGeneralServices();
  return (
    <UnifiedServiceSalesHistory
      serviceType="general"
      sales={sales}
      isLoading={isLoading}
      refetch={refetch}
      deleteAction={async (id) => deleteGeneralServiceSaleAction(id)}
      title="История на продажбите"
      description="Списък с всички продадени клубни услуги и техния статус на плащане."
      baseRoute="/finances/general-services/sales"
    />
  );
}

export function TrainingSalesHistory() {
  const { sales, isLoading, refetch } = useTrainingServices();
  return (
    <UnifiedServiceSalesHistory
      serviceType="training"
      sales={sales}
      isLoading={isLoading}
      refetch={refetch}
      deleteAction={async (id, token) => deleteSaleAction(id, token!)}
      title="История на продажбите"
      description="Проследяване на всички направени продажби на тренировки."
      baseRoute="/sales"
    />
  );
}

export function RecoverySalesHistory() {
  const { sales, isLoading, refetch } = useRecoveryServices();
  return (
    <UnifiedServiceSalesHistory
      serviceType="recovery"
      sales={sales}
      isLoading={isLoading}
      refetch={refetch}
      deleteAction={async (id, token) => deleteSaleAction(id, token!)}
      title="История на продажбите"
      description="Проследяване на всички направени продажби на възстановяване."
      baseRoute="/sales"
    />
  );
}
