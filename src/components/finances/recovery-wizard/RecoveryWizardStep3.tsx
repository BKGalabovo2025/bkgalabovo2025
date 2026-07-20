"use client";

import { useRecoveryWizard } from "./RecoveryWizardContext";
import { CreditCard, Banknote, Smartphone, Check, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const RecoveryWizardStep3 = () => {
  const { price, setPrice, paymentMethod, setPaymentMethod, isPaid, setIsPaid, note, setNote } = useRecoveryWizard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <CreditCard className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Детайли на плащането
        </h3>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="sale-price" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Сума (EUR) *
          </Label>
          <Input
            id="sale-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11 rounded-xl border-zinc-200"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Начин на плащане *
          </Label>
          <div className="flex gap-3">
            {[
              { value: "В брой", icon: Banknote, label: "В брой" },
              { value: "Revolut", icon: Smartphone, label: "Revolut" },
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                  paymentMethod === method.value
                    ? "border-zinc-950 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                )}
              >
                <method.icon className="size-4" strokeWidth={1.5} />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Статус на плащане *
          </Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                isPaid
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <Check className="size-4" strokeWidth={2} />
              Платено
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                !isPaid
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <AlertCircle className="size-4" strokeWidth={2} />
              Неплатено (Дълг)
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale-note" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Допълнителна бележка (Незадължително)
          </Label>
          <Textarea
            id="sale-note"
            placeholder="Добавете коментар..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl border-zinc-200 dark:border-zinc-800"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
