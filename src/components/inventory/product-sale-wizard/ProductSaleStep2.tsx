"use client";

import { useProductSaleWizard } from "./ProductSaleWizardContext";
import { CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const ProductSaleStep2 = () => {
  const { product, quantity, setQuantity, paymentMethod, setPaymentMethod, isPaid, setIsPaid, note, setNote } = useProductSaleWizard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <CreditCard className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Детайли на транзакцията</h3>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="sale-qty" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Количество *</Label>
            <span className="text-[10px] text-zinc-400">Складова наличност: <strong>{product.stock} бр.</strong></span>
          </div>
          <Input
            id="sale-qty"
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="rounded-xl h-11 border-zinc-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pay-method" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Начин на плащане *</Label>
            <select
              id="pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="В брой">В брой</option>
              <option value="Карта">Карта</option>
              <option value="Банков път">Банков път</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-status" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Статус на плащане *</Label>
            <select
              id="pay-status"
              value={isPaid ? "paid" : "unpaid"}
              onChange={(e) => setIsPaid(e.target.value === "paid")}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="paid">Платено</option>
              <option value="unpaid">Неплатено (Дълг)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale-note" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Допълнителна бележка (Незадължително)</Label>
          <Textarea
            id="sale-note"
            placeholder="Добавете бележка или допълнителен коментар..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};
