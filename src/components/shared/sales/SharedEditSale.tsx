"use client";

import { AlertCircle, ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import {
  SaleFormManager,
  SaleItem,
} from "@/components/shared/sales/SaleFormManager";
import { Button } from "@/components/ui/button";
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
          toast.error("Продажбата не бе намерена.");
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
  }, [saleId]);

  const handleUpdateSale = async ({
    cart,
    memberId,
    status,
    totalAmount,
    paymentMethod,
    note,
    saleDate,
    clientName,
    clientPhone,
  }: {
    cart: SaleItem[];
    memberId: string;
    status: Sale["status"];
    totalAmount: number;
    paymentMethod?: string;
    note?: string;
    saleDate?: string;
    clientName?: string;
    clientPhone?: string;
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
        isPaid: status === "completed",
        totalAmount: totalAmount,
        paymentMethod,
        note,
        saleDate,
        clientName,
        clientPhone,
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

  if (!initialSale) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center duration-500 animate-in fade-in">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Продажбата не бе намерена
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Продажба с идентификатор{" "}
            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
              #{saleId}
            </span>{" "}
            не съществува в базата данни или е била изтрита.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(cancelUrl)}
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 size-4" />
              Към продажби
            </Button>
            <Button
              onClick={() => router.push("/sales/new")}
              className="rounded-xl"
            >
              <PlusCircle className="mr-2 size-4" />
              Нова продажба
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
