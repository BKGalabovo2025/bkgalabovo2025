"use client";

import { useEditProduct } from "./EditProductContext";
import { GenericSalesTab } from "@/components/shared/history-tabs/GenericSalesTab";

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
