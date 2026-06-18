"use client";

import { useEditProduct } from "./EditProductContext";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

export const ProductSalesTab = () => {
  const { historyLoading, sales, product, membersMap } = useEditProduct();

  if (!product) return null;

  if (historyLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 opacity-35" />
        <p className="text-zinc-400 text-xs font-light">Зареждане на продажби...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs font-light">
        Няма записани продажби за този продукт.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const item = sale.items.find((i) => i.productId === product.id);
        const memberName =
          sale.memberId === "GUEST_EXTERNAL"
            ? "Външен клиент"
            : membersMap[sale.memberId] || "Зареден Член";

        return (
          <div key={sale.id} className="p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100/50 dark:border-zinc-900 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-[10px]">{new Date(sale.saleDate).toLocaleDateString("bg-BG")}</span>
              <Badge
                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shadow-none border-none ${
                  sale.isPaid
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                }`}
              >
                {sale.isPaid ? "Платено" : "Неплатено"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Клиент:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{memberName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Брой:</span>
              <span className="font-medium">{item?.quantity || 1} бр.</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-zinc-500">Сума:</span>
              <span className="font-bold text-emerald-500">{formatPrice(sale.totalAmount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
