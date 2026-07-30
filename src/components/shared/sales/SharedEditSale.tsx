"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import {
  SaleFormManager,
  SaleItem,
} from "@/components/shared/sales/SaleFormManager";
import { useAuth } from "@/context/auth-context";
import { updateSaleAction } from "@/lib/actions/sales";
import { getSaleById } from "@/services/sales-service";
import { Sale } from "@/types";

export interface SharedEditSaleProps {
  saleId: string;
  cancelUrl: string;
  successUrl: string;
  breadcrumbs: { label: string; href?: string }[];
}

export function SharedEditSale({
  saleId,
  cancelUrl,
  successUrl,
  breadcrumbs,
}: SharedEditSaleProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const [initialSale, setInitialSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!saleId) return;
      try {
        setPageLoading(true);
        const saleData = await getSaleById(saleId);

        if (!saleData) {
          toast.error("Продажбата не е намерена.");
          router.push(cancelUrl);
          return;
        }

        setInitialSale(saleData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Неуспешно зареждане на данните.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchInitialData();
  }, [saleId, router, cancelUrl]);

  const handleUpdateSale = async ({
    cart,
    memberId,
    status,
    totalAmount,
  }: {
    cart: SaleItem[];
    memberId: string;
    status: Sale["status"];
    totalAmount: number;
  }) => {
    setIsSubmitting(true);
    try {
      if (!idToken) {
        toast.error("Липсва оторизация. Моля, влезте отново.");
        return;
      }

      const result = await updateSaleAction(saleId, idToken, {
        items: cart,
        memberId: memberId === "none" ? undefined : memberId,
        status: status,
        totalAmount: totalAmount,
      });

      if (result.success) {
        if (
          initialSale?.memberId &&
          initialSale.memberId !== "GUEST_EXTERNAL"
        ) {
          mutate(initialSale.memberId);
        }
        if (
          memberId &&
          memberId !== "none" &&
          memberId !== "GUEST_EXTERNAL" &&
          memberId !== initialSale?.memberId
        ) {
          mutate(memberId);
        }
        toast.success(result.message || "Продажбата е актуализирана успешно.");
        router.push(successUrl);
      } else {
        toast.error(result.message || "Възникна грешка при обновяване.");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Възникна грешка при обновяване.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!initialSale) return null;

  return (
    <SaleFormManager
      title="Редактиране на продажба"
      description={`Редакция на детайлите за продажба #${saleId.substring(0, 8)}.`}
      breadcrumbs={breadcrumbs}
      cancelUrl={cancelUrl}
      initialCart={initialSale.items}
      initialMemberId={initialSale.memberId || "none"}
      initialStatus={initialSale.status}
      initialSale={initialSale}
      submitText="Запази промените"
      onSubmit={handleUpdateSale}
      isSubmitting={isSubmitting}
    />
  );
}
