"use client";

import { GenericSalesTab } from "@/components/shared/history-tabs/GenericSalesTab";

import { useEditProduct } from "./EditProductContext";

export const ProductSalesTab = () => {
  const { historyLoading, sales, product, membersMap } = useEditProduct();

  if (!product) return null;

  return (
    <GenericSalesTab
      loading={historyLoading}
      sales={sales}
      targetId={product.id}
      membersMap={membersMap}
      emptyMessage="Няма записани продажби за този продукт."
    />
  );
};
