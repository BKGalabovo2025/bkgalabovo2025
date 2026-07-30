"use client";

import { useParams } from "next/navigation";

import { SharedEditSale } from "@/components/shared/sales/SharedEditSale";

export default function EditSaleClient() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <SharedEditSale
      saleId={saleId}
      cancelUrl="/finances/general-services"
      successUrl={`/finances/general-services/sales/${saleId}`}
      breadcrumbs={[
        { label: "Начало", href: "/dashboard" },
        { label: "Клубни услуги", href: "/finances/general-services" },
        {
          label: "Детайли",
          href: `/finances/general-services/sales/${saleId}`,
        },
        { label: "Редакция" },
      ]}
    />
  );
}
