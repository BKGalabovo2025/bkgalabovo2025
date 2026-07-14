"use client";

import { useTrainingWizard } from "./TrainingWizardContext";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  AlertCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const TrainingWizardStep3 = () => {
  const {
    price,
    setPrice,
    paymentMethod,
    setPaymentMethod,
    isPaid,
    setIsPaid,
    note,
    setNote,
    saleDate,
    setSaleDate,
  } = useTrainingWizard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <CreditCard className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Детайли на плащането
        </h3>
      </div>

      <div className="grid gap-5">
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
            className="rounded-xl h-11 border-zinc-200"
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
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                  paymentMethod === method.value
                    ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                )}
              >
                <method.icon className="h-4 w-4" strokeWidth={1.5} />
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
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                isPaid
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
              )}
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              Платено
            </button>
            <button
              type="button"
              onClick={() => setIsPaid(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all",
                !isPaid
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
              )}
            >
              <AlertCircle className="h-4 w-4" strokeWidth={2} />
              Неплатено (Дълг)
            </button>
          </div>
        </div>

        {isPaid && (
          <div className="grid gap-2">
            <Label
              htmlFor="sale-date"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Дата на плащане *
            </Label>
            <Input
              id="sale-date"
              type="date"
              value={
                saleDate ? new Date(saleDate).toISOString().split("T")[0] : ""
              }
              onChange={(e) => {
                if (e.target.value) {
                  setSaleDate(new Date(e.target.value).toISOString());
                }
              }}
              className="rounded-xl h-11 border-zinc-200"
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label
            htmlFor="sale-note"
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            Допълнителна бележка (по желание)
          </Label>
          <Textarea
            id="sale-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border-zinc-200 resize-none h-20"
            placeholder="Въведете бележка..."
          />
        </div>
      </div>
    </div>
  );
};
