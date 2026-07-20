"use client";

import { useEditProduct } from "./EditProductContext";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const ProductStockTab = () => {
  const {
    product,
    restockAmount, setRestockAmount,
    adjustmentAmount, setAdjustmentAmount,
    adjustmentNotes, setAdjustmentNotes,
    isProcessing,
    handleRestock,
    handleAdjustment,
  } = useEditProduct();

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin-slow size-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Склад & Движения</h3>
        </div>
        <span className="text-xs font-medium text-zinc-500">
          Текуща наличност: <strong className="font-bold text-zinc-950 dark:text-white">{product.stock} бр.</strong>
        </span>
      </div>

      <div className="space-y-6">
        {/* RESTOCK */}
        <div className="space-y-2">
          <Label htmlFor="restock-amount" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Презареждане (Добавяне на стока)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="restock-amount"
              type="number"
              placeholder="Количество (напр. 10)"
              value={restockAmount}
              onChange={(e) => setRestockAmount(e.target.value)}
              disabled={isProcessing}
              className="h-11 rounded-xl"
            />
            <Button
              onClick={handleRestock}
              disabled={isProcessing || !restockAmount}
              className="h-11 rounded-xl bg-zinc-950 px-5 text-white hover:bg-zinc-800"
            >
              Заприходи
            </Button>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-900"></div>

        {/* ADJUSTMENT */}
        <div className="space-y-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="adjustment-amount" className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <ShieldAlert className="size-3.5 text-zinc-400" />
              Корекция / Ръчно Отписване
            </Label>
            <p className="text-[10px] font-light text-zinc-400">Използвайте отрицателно число за бракуване/отписване (напр. -5).</p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              id="adjustment-amount"
              type="number"
              placeholder="Количество"
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
              disabled={isProcessing}
              className="h-11 rounded-xl"
            />
            <Button
              onClick={handleAdjustment}
              disabled={isProcessing || !adjustmentAmount}
              className="h-11 rounded-xl bg-rose-500 px-5 text-white hover:bg-rose-600"
            >
              Коригирай
            </Button>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="adjustment-notes" className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
              Причина / Бележка
            </Label>
            <Textarea
              id="adjustment-notes"
              placeholder="Причина (задължително при отписване/бракуване)..."
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              disabled={isProcessing}
              className="rounded-xl"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
