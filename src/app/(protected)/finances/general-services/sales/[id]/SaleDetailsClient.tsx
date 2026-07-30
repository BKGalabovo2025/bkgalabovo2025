"use client";

import { useParams } from "next/navigation";

import { SharedSaleDetails } from "@/components/shared/sales/SharedSaleDetails";

export default function SaleDetailsClient() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <SharedSaleDetails
      saleId={saleId}
      backUrl="/finances/general-services"
      baseSaleUrl="/finances/general-services/sales"
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Клубни услуги", href: "/finances/general-services" },
        { label: "Детайли" },
      ]}
    />
  );
}
