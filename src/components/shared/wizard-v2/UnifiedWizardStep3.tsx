"use client";

import {
  AlertCircle,
  Banknote,
  Check,
  CreditCard,
  Hash,
  Smartphone,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useUnifiedSaleWizard } from "./UnifiedSaleWizardContext";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <CreditCard className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Детайли на плащането
        </h3>
      </div>

      <div className="grid gap-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label
              htmlFor="sale-price"
              className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
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
              className="h-10 rounded-xl border-zinc-200 text-xs sm:text-sm"
            />
          </div>
          {showQuantity && (
            <div className="grid gap-1.5">
              <Label
                htmlFor="sale-qty"
                className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
              >
                Количество *
              </Label>
              <div className="relative">
                <Hash className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-10 rounded-xl border-zinc-200 pl-8 text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Начин на плащане *
          </Label>
          <div className="flex gap-2.5">
            {[
              { value: "В брой", icon: Banknote, label: "В брой" },
              { value: "Revolut", icon: Smartphone, label: "Revolut" },
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                  paymentMethod === method.value
                    ? "border-zinc-950 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                )}
              >
                <method.icon className="size-3.5" strokeWidth={1.5} />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            Статус на плащане *
          </Label>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaid(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                isPaid
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <Check className="size-3.5" strokeWidth={2} />
              Платено
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                !isPaid
                  ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <AlertCircle className="size-3.5" strokeWidth={2} />
              Висящо (Дълг)
            </button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label
            htmlFor="sale-date"
            className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
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
            className="h-10 rounded-xl border-zinc-200 text-xs sm:text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label
            htmlFor="sale-note"
            className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
          >
            Бележка (по избор)
          </Label>
          <Textarea
            id="sale-note"
            placeholder="Въведете допълнителна информация..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="min-h-16 resize-none rounded-xl border-zinc-200 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
