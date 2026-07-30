"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import {
  SaleFormManager,
  SaleItem,
} from "@/components/shared/sales/SaleFormManager";
import { useAuth } from "@/context/auth-context";
import { createSaleAction } from "@/lib/actions/sales";
import { Sale } from "@/types";

export default function NewSaleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMemberId = searchParams.get("memberId");

  const { idToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSale = async ({
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
      if (!idToken) throw new Error("Missing authentication token.");

      const result = await createSaleAction(idToken, {
        saleDate: new Date().toISOString(),
        items: cart,
        memberId: memberId && memberId !== "none" ? memberId : "unknown",
        status,
        isPaid: status === "completed",
        totalAmount,
        currency: "EUR",
        siteId: "default",
      });

      if (result.success) {
        if (memberId && memberId !== "none" && memberId !== "GUEST_EXTERNAL") {
          mutate(memberId);
        }
        toast.success(result.message || "Продажбата беше създадена успешно.");
        router.push("/sales");
      } else {
        toast.error(result.message || "Възникна грешка при създаването.");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      toast.error("Възникна грешка при създаването.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SaleFormManager
      title="Нова продажба"
      description="Създайте нова продажба на артикули от склада."
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Продажби", href: "/sales" },
        { label: "Нова" },
      ]}
      cancelUrl="/sales"
      initialMemberId={queryMemberId || "none"}
      submitText="Завърши продажбата"
      onSubmit={handleCreateSale}
      isSubmitting={isSubmitting}
    />
  );
}
