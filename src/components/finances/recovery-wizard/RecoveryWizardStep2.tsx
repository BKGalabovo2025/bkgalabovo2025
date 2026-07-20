"use client";

import { useRecoveryWizard } from "./RecoveryWizardContext";
import { CalendarDays, Calendar, CreditCard, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  WizardStep2Subscription,
  WizardStep2Individual,
} from "@/components/shared/wizard/WizardStep2Shared";

export const RecoveryWizardStep2 = () => {
  const {
    selectedMember,
    service,
    paymentMode,
    setPaymentMode,
    attendanceLoading,
    monthlyAttendance,
    unpaidMonths,
    selectedMonthKeys,
    setSelectedMonthKeys,
    allUnpaidMonthsSelected,
    toggleMonthSelection,
    price,
    unpaidEvents,
    selectedEventIds,
    setSelectedEventIds,
    toggleEventSelection,
  } = useRecoveryWizard();

  if (!selectedMember) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <CalendarDays className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Присъствия и период
        </h3>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
        <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
          {selectedMember.firstName[0]}
          {selectedMember.lastName[0]}
        </div>
        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
          {selectedMember.firstName} {selectedMember.lastName}
        </span>
        <Badge className="ml-auto rounded-full text-[8px] px-2 py-0 border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {service.type}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          Тип плащане
        </Label>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setPaymentMode("subscription")}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
              paymentMode === "subscription"
                ? "bg-white dark:bg-zinc-800 text-emerald-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            Абонамент (Месец)
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("individual")}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
              paymentMode === "individual"
                ? "bg-white dark:bg-zinc-800 text-blue-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
            Еднократно
          </button>
        </div>
      </div>

      {(() => {
        if (attendanceLoading) {
          return (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500 opacity-40" />
              <p className="text-zinc-400 text-xs font-light">Зареждане на присъствията...</p>
            </div>
          );
        }

        if (paymentMode === "subscription") {
          return (
            <WizardStep2Subscription
              selectedMember={selectedMember}
              monthlyAttendance={monthlyAttendance}
              unpaidMonths={unpaidMonths}
              selectedMonthKeys={selectedMonthKeys}
              setSelectedMonthKeys={setSelectedMonthKeys}
              allUnpaidMonthsSelected={allUnpaidMonthsSelected}
              toggleMonthSelection={toggleMonthSelection}
              price={price}
            />
          );
        }

        return (
          <WizardStep2Individual
            selectedMember={selectedMember}
            unpaidEvents={unpaidEvents}
            selectedEventIds={selectedEventIds}
            setSelectedEventIds={setSelectedEventIds}
            toggleEventSelection={toggleEventSelection}
            eventLabel="процедури"
          />
        );
      })()}
    </div>
  );
};
