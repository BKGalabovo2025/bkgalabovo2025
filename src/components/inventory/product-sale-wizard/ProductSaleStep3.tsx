"use client";

import { useProductSaleWizard } from "./ProductSaleWizardContext";
import { Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/currency";

export const ProductSaleStep3 = () => {
  const { product, selectedMember, quantity, paymentMethod, isPaid, totalAmount } = useProductSaleWizard();

  if (!selectedMember) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <Sparkles className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Преглед и потвърждение</h3>
      </div>

      <div className="space-y-4 rounded-3xl border border-zinc-100/50 bg-zinc-50 p-6 dark:border-zinc-900 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-400">Купувач (Член)</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {selectedMember.firstName} {selectedMember.lastName}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-400">Артикул</span>
          <span className="font-bold text-zinc-900 dark:text-white">{product.name}</span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-400">Количество</span>
          <span className="font-bold text-zinc-900 dark:text-white">{quantity} бр.</span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-400">Начин на плащане</span>
          <span className="font-bold text-zinc-900 dark:text-white">{paymentMethod}</span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-400">Статус</span>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${isPaid ? "text-emerald-500" : "text-rose-500"}`}>
            {isPaid ? "Платено" : "Неплатено"}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Обща сума</span>
          <span className="text-2xl font-bold tracking-tight text-emerald-500">{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};
