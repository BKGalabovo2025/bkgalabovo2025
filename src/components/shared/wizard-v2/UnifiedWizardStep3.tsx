"use client";

import { useUnifiedSaleWizard } from "./UnifiedSaleWizardContext";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  AlertCircle,
  Hash,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const UnifiedWizardStep3 = () => {
  const {
    mode,
    price,
    setPrice,
    quantity,
    setQuantity,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    saleDate,
    setSaleDate,
  } = useUnifiedSaleWizard();

  const showQuantity = mode === "product" || mode === "general";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <CreditCard className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Детайли на плащането
        </h3>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label
              htmlFor="sale-price"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
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
          {showQuantity && (
            <div className="grid gap-2">
              <Label
                htmlFor="sale-qty"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Количество *
              </Label>
              <div className="relative">
                <Hash className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11 rounded-xl border-zinc-200 pl-9"
                />
              </div>
            </div>
          )}
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
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <AlertCircle className="size-4" strokeWidth={2} />
              Висящо (Дълг)
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor="sale-date"
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            Дата на продажба
          </Label>
          <Input
            id="sale-date"
            type="date"
            value={saleDate ? saleDate.substring(0, 10) : ""}
            onChange={(e) =>
              setSaleDate(
                e.target.value ? new Date(e.target.value).toISOString() : ""
              )
            }
            className="h-11 rounded-xl border-zinc-200"
          />
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor="sale-note"
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            Бележка (по избор)
          </Label>
          <Textarea
            id="sale-note"
            placeholder="Въведете допълнителна информация..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20 resize-none rounded-xl border-zinc-200"
          />
        </div>
      </div>
    </div>
  );
};
