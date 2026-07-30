"use client";

import { useParams } from "next/navigation";

import { SharedEditSale } from "@/components/shared/sales/SharedEditSale";

export default function EditSaleClient() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <SharedEditSale
      saleId={saleId}
      cancelUrl="/inventory/sales"
      successUrl={`/inventory/sales/${saleId}`}
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Склад", href: "/inventory" },
        { label: "Продажби", href: "/inventory/sales" },
        { label: "Детайли", href: `/inventory/sales/${saleId}` },
        { label: "Редакция" },
      ]}
    />
  );
}
