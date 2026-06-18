"use client";

import { useGeneralWizard } from "./GeneralWizardContext";
import { CreditCard } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const GeneralWizardStep2 = () => {
  const {
    quantity,
    setQuantity,
    price,
    setPrice,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
  } = useGeneralWizard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <CreditCard className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Детайли на транзакцията</h3>
      </div>

      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sale-qty" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Количество *
            </Label>
            <Input
              id="sale-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-xl h-11 border-zinc-200"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sale-price" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Ед. Цена (EUR) *
            </Label>
            <Input
              id="sale-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-xl h-11 border-zinc-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pay-method" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Начин на плащане *
            </Label>
            <select
              id="pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="В брой">В брой</option>
              <option value="Карта">Карта</option>
              <option value="Банков път">Банков път</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pay-status" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Статус на плащане *
            </Label>
            <select
              id="pay-status"
              value={isPaid ? "paid" : "unpaid"}
              onChange={(e) => setIsPaid(e.target.value === "paid")}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="paid">Платено</option>
              <option value="unpaid">Неплатено (Дълг)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale-note" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Допълнителна бележка (Незадължително)
          </Label>
          <Textarea
            id="sale-note"
            placeholder="Добавете бележка или допълнителен коментар..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
