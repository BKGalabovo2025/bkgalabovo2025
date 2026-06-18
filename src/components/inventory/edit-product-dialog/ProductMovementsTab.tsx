"use client";

import { useEditProduct } from "./EditProductContext";
import { Loader2 } from "lucide-react";
import { formatDateTimeDisplay } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";

const getEventLabel = (type: string) => {
  switch (type) {
    case "restock": return "Зареждане";
    case "correction": return "Корекция";
    case "price_update": return "Промяна цена";
    case "sale": return "Продажба";
    case "initial": return "Първоначално";
    default: return "Друго";
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

  if (historyLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 opacity-35" />
        <p className="text-zinc-400 text-xs font-light">Зареждане на движения...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs font-light">
        Няма записани движения за този продукт.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((move) => {
        const isPositive = move.quantityChange > 0;
        const isNegative = move.quantityChange < 0;

        let quantityColor = "text-zinc-650";
        if (isPositive) quantityColor = "text-green-600";
        else if (isNegative) quantityColor = "text-rose-600";

        return (
          <div key={move.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100/50 dark:border-zinc-900 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-[10px]">{formatDateTimeDisplay(move.createdAt)}</span>
              <Badge className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-none border-none ${getEventBadgeClass(move.type)}`}>
                {getEventLabel(move.type)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Количество:</span>
              <span className={`font-semibold ${quantityColor}`}>
                {isPositive ? `+${move.quantityChange}` : move.quantityChange} бр.
              </span>
            </div>
            {move.notes && (
              <p className="text-zinc-400 italic text-[11px] border-t border-zinc-200/50 dark:border-zinc-800/50 pt-1.5 mt-1">
                Бележка: {move.notes}
              </p>
            )}
            <div className="text-[10px] text-zinc-400/80 text-right mt-1">
              Оператор: {move.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};
