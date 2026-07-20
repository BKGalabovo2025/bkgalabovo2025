"use client";

import { useParams } from "next/navigation";
import { SharedSaleDetails } from "@/components/shared/sales/SharedSaleDetails";

export default function SaleDetailsClient() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <SharedSaleDetails
      saleId={saleId}
      backUrl="/sales"
      baseSaleUrl="/sales"
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Продажби", href: "/sales" },
        { label: "Детайли" },
      ]}
    />
  );
}
