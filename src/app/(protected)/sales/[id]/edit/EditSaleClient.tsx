"use client";

import { useParams } from "next/navigation";
import { SharedEditSale } from "@/components/shared/sales/SharedEditSale";

export default function EditSaleClient() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <SharedEditSale
      saleId={saleId}
      cancelUrl="/sales"
      successUrl={`/sales/${saleId}`}
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Продажби", href: "/sales" },
        { label: "Детайли", href: `/sales/${saleId}` },
        { label: "Редакция" },
      ]}
    />
  );
}
