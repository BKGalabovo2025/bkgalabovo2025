"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { Sale } from "@/types";

interface GenericSalesTabProps {
  loading: boolean;
  sales: Sale[];
  targetId: string;
  membersMap: Record<string, string>;
  emptyMessage?: string;
}

export const GenericSalesTab = ({
  loading,
  sales,
  targetId,
  membersMap,
  emptyMessage = "Няма записани продажби.",
}: GenericSalesTabProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <Loader2 className="size-8 animate-spin text-emerald-500 opacity-35" />
        <p className="text-xs font-light text-zinc-400">
          Зареждане на продажби...
        </p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="py-20 text-center text-xs font-light text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const item = sale.items.find((i) => i.productId === targetId);
        const memberName =
          sale.memberId === "GUEST_EXTERNAL"
            ? "Външен клиент"
            : membersMap[sale.memberId] || "Зареден Член";

        return (
          <div
            key={sale.id}
            className="space-y-2 rounded-2xl border border-zinc-100/50 bg-zinc-50 p-4 text-xs dark:border-zinc-900 dark:bg-zinc-900/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
              </span>
              <Badge
                className={`rounded border-none px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-none ${
                  sale.isPaid
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                }`}
              >
                {sale.isPaid ? "Платено" : "Неплатено"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Клиент:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {memberName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Брой:</span>
              <span className="font-medium">{item?.quantity || 1} бр.</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200/50 pt-1 dark:border-zinc-800/50">
              <span className="text-zinc-500">Сума:</span>
              <span className="font-bold text-emerald-500">
                {formatPrice(sale.totalAmount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
