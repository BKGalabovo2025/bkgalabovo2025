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
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <Loader2 className="size-8 animate-spin text-amber-500 opacity-35" />
        <p className="text-xs font-light text-zinc-400">Зареждане на движения...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="py-20 text-center text-xs font-light text-zinc-400">
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
          <div key={move.id} className="space-y-2 rounded-2xl border border-zinc-100/50 bg-zinc-50 p-4 text-xs dark:border-zinc-900 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">{formatDateTimeDisplay(move.createdAt)}</span>
              <Badge className={`rounded border-none px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-none ${getEventBadgeClass(move.type)}`}>
                {getEventLabel(move.type)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Количество:</span>
              <span className={`font-semibold ${quantityColor}`}>
                {isPositive ? `+${move.quantityChange}` : move.quantityChange} бр.
              </span>
            </div>
            {move.notes && (
              <p className="mt-1 border-t border-zinc-200/50 pt-1.5 text-[11px] text-zinc-400 italic dark:border-zinc-800/50">
                Бележка: {move.notes}
              </p>
            )}
            <div className="mt-1 text-right text-[10px] text-zinc-400/80">
              Оператор: {move.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};
