"use client";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Clock, User } from "lucide-react";
import { useReservationDialog } from "./ReservationDialogContext";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const ReservationStep4Review = () => {
  const {
    form,
    isRecoveryZone,
    isEditMode,
    watchedValues,
    services,
    price,
    reservation,
    applyPaymentToPackage,
    setApplyPaymentToPackage,
  } = useReservationDialog();

  const {
    courtId,
    serviceId,
    startTime,
    endTime,
    clientName,
    clientPhone,
    clientEmail,
    selectedZone,
  } = watchedValues;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold">
              {!isRecoveryZone ? courtId : <Activity className="w-5 h-5" />}
            </div>
            <div className="max-w-[180px]">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                {!isRecoveryZone ? "Избран Корт" : "Избрана Услуга"}
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                {!isRecoveryZone ? `Корт № ${courtId}` : services.find((s) => s.id === serviceId)?.name || "Услуга"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Обща Сума</p>
            <p className="text-xl font-black text-primary tracking-tight">{formatPrice(price)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3" /> График
            </p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {startTime?.toLocaleDateString("bg-BG")}
              <br />
              {startTime?.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })} -{" "}
              {endTime?.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <User className="w-3 h-3" /> Клиент
            </p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">
              {clientName}
              <br />
              {clientPhone}
              {clientEmail && <span className="block opacity-60 text-[10px]">{clientEmail}</span>}
            </p>
          </div>
        </div>

        {selectedZone && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3 h-3" /> Избрана Зона
            </p>
            <p className="text-sm font-bold text-cyan-600 uppercase tracking-wider">{selectedZone}</p>
          </div>
        )}
      </div>

      {/* Payment Options */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              {isEditMode ? "Статус на плащане" : "Плащане при създаване?"}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tight font-bold">
              {isEditMode ? "Промяна на статуса на плащане" : "Маркирайте резервацията като платена веднага"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const isPaid = form.getValues("status") === "paid";
              form.setValue("status", isPaid ? "unpaid" : "paid");
              if (!isPaid) form.setValue("paymentMethod", "Cash");
            }}
            className={cn(
              "w-12 h-6 rounded-full p-1 transition-all duration-300 relative focus:outline-none",
              form.watch("status") === "paid" ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 absolute top-1",
                form.watch("status") === "paid" ? "left-7" : "left-1"
              )}
            />
          </button>
        </div>

        {form.watch("status") === "paid" && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 animate-in slide-in-from-top-2 duration-300">
            {["Cash", "Revolut", "Card"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => form.setValue("paymentMethod", method)}
                className={cn(
                  "h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                  form.watch("paymentMethod") === method
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                )}
              >
                {(() => {
                  if (method === "Cash") return "В брой";
                  if (method === "Card") return "Карта";
                  return "Revolut";
                })()}
              </button>
            ))}
          </div>
        )}

        {isEditMode && reservation?.packageGroupId && (
          <div className="flex items-center space-x-2 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <input
              type="checkbox"
              id="applyPaymentToPackage"
              checked={applyPaymentToPackage}
              onChange={(e) => setApplyPaymentToPackage(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
            />
            <label
              htmlFor="applyPaymentToPackage"
              className="text-[11px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-600"
            >
              Приложи плащането/статуса за всички дни от пакета (Препоръчително)
            </label>
          </div>
        )}
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Бележки (опц.)
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Допълнителни изисквания или коментари..."
                className="resize-none rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm h-24"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
