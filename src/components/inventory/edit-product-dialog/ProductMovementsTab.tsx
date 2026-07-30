"use client";

import { useEditProduct } from "./EditProductContext";
import { GenericMovementsTab } from "@/components/shared/history-tabs/GenericMovementsTab";

const getEventLabel = (type: string) => {
  switch (type) {
    case "restock":
      return "Зареждане";
    case "correction":
      return "Корекция";
    case "price_update":
      return "Промяна цена";
    case "sale":
      return "Продажба";
    case "initial":
      return "Първоначално";
    default:
      return "Друго";
  }
};

const getEventBadgeClass = (type: string) => {
  switch (type) {
    case "restock":
      return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400";
    case "sale":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
    case "price_update":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
    case "correction":
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400";
  }
};

export const ProductMovementsTab = () => {
  const { historyLoading, movements } = useEditProduct();

  return (
    <GenericMovementsTab
      loading={historyLoading}
      movements={movements}
      emptyMessage="Няма записани движения за този продукт."
      getEventLabel={getEventLabel}
      getEventBadgeClass={getEventBadgeClass}
      renderDetails={(move) => {
        const isPositive = move.quantityChange > 0;
        const isNegative = move.quantityChange < 0;

        let quantityColor = "text-zinc-650";
        if (isPositive) quantityColor = "text-green-600";
        else if (isNegative) quantityColor = "text-rose-600";

        return (
          <>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Количество:</span>
              <span className={`font-semibold ${quantityColor}`}>
                {isPositive ? `+${move.quantityChange}` : move.quantityChange}{" "}
                бр.
              </span>
            </div>
            {move.notes && (
              <p className="mt-1 border-t border-zinc-200/50 pt-1.5 text-[11px] text-zinc-400 italic dark:border-zinc-800/50">
                Бележка: {move.notes}
              </p>
            )}
          </>
        );
      }}
    />
  );
};
