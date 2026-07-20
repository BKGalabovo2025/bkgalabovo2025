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
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="space-y-4 rounded-4xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 font-bold text-white dark:bg-white dark:text-zinc-900">
              {!isRecoveryZone ? courtId : <Activity className="size-5" />}
            </div>
            <div className="max-w-45">
              <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                {!isRecoveryZone ? "Избран Корт" : "Избрана Услуга"}
              </p>
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                {!isRecoveryZone ? `Корт № ${courtId}` : services.find((s) => s.id === serviceId)?.name || "Услуга"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">Обща Сума</p>
            <p className="text-xl font-black tracking-tight text-primary">{formatPrice(price)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
              <Clock className="size-3" /> График
            </p>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {startTime?.toLocaleDateString("bg-BG")}
              <br />
              {startTime?.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })} -{" "}
              {endTime?.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
              <User className="size-3" /> Клиент
            </p>
            <p className="truncate text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {clientName}
              <br />
              {clientPhone}
              {clientEmail && <span className="block text-[10px] opacity-60">{clientEmail}</span>}
            </p>
          </div>
        </div>

        {selectedZone && (
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="flex items-center gap-1 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
              <Activity className="size-3" /> Избрана Зона
            </p>
            <p className="text-sm font-bold tracking-wider text-cyan-600 uppercase">{selectedZone}</p>
          </div>
        )}
      </div>

      {/* Payment Options */}
      <div className="space-y-4 rounded-4xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black tracking-wider text-zinc-900 uppercase dark:text-white">
              {isEditMode ? "Статус на плащане" : "Плащане при създаване?"}
            </h4>
            <p className="mt-1 text-[10px] font-bold tracking-tight text-zinc-400 uppercase">
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
              "relative h-6 w-12 rounded-full p-1 transition-all duration-300 focus:outline-none",
              form.watch("status") === "paid" ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"
            )}
          >
            <div
              className={cn(
                "absolute top-1 size-4 rounded-full bg-white shadow-md transition-all duration-300",
                form.watch("status") === "paid" ? "left-7" : "left-1"
              )}
            />
          </button>
        </div>

        {form.watch("status") === "paid" && (
          <div className="grid grid-cols-2 gap-3 border-t border-zinc-200/50 pt-3 duration-300 animate-in slide-in-from-top-2 dark:border-zinc-800/50">
            {["Cash", "Revolut", "Card"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => form.setValue("paymentMethod", method)}
                className={cn(
                  "h-10 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all",
                  form.watch("paymentMethod") === method
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
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
          <div className="flex items-center space-x-2 border-t border-zinc-200/50 pt-3 dark:border-zinc-800/50">
            <input
              type="checkbox"
              id="applyPaymentToPackage"
              checked={applyPaymentToPackage}
              onChange={(e) => setApplyPaymentToPackage(e.target.checked)}
              className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="applyPaymentToPackage"
              className="text-[11px] leading-none font-medium text-zinc-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Приложи плащането/статуса за всички дни от пакета (Препоръчително)
            </label>
          </div>
        )}
      </div>

      {/* Confirmation Options */}
      <div className="rounded-4xl border border-white/40 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        <FormField
          control={form.control}
          name="sendConfirmation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <FormLabel className="cursor-pointer text-xs font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                  Изпрати потвърждение
                </FormLabel>
                <p className="text-[10px] font-bold tracking-tight text-zinc-400 uppercase">
                  Системата автоматично ще изпрати имейл с детайли за резервацията
                </p>
              </div>
              <FormControl>
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "relative h-6 w-11 rounded-full p-1 transition-all duration-300 focus:outline-none",
                    field.value ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-800"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 size-4 rounded-full bg-white shadow-md transition-all duration-300",
                      field.value ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Бележки (опц.)
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Допълнителни изисквания или коментари..."
                className="h-24 resize-none rounded-4xl border-white/40 bg-white/60 text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl focus:bg-white focus:ring-0 dark:border-zinc-800/50 dark:bg-zinc-900/40"
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
