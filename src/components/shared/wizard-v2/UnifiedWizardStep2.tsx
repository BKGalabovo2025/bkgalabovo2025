"use client";

/**
 * Shared sub-components used by both RecoveryWizardStep2 and TrainingWizardStep2.
 * These were 100% identical in both wizards — extracted here to avoid duplication.
 */

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { CalendarDays, Check, CheckSquare } from "lucide-react";

import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Member, ScheduleEvent } from "@/types";

import { useUnifiedSaleWizard } from "./UnifiedSaleWizardContext";

// MonthAttendance is identical in both contexts — define it once here
interface MonthAttendanceStat {
  memberId: string;
  firstName: string;
  paidCount: number;
  unpaidCount: number;
}

interface MonthAttendance {
  monthKey: string;
  monthLabel: string;
  year?: number;
  events?: unknown[];
  paidCount: number;
  unpaidCount: number;
  memberStats: Record<string, MonthAttendanceStat>;
}

export const UnifiedWizardStep2 = () => {
  const {
    mode,
    selectedMember,
    paymentMode,
    setPaymentMode,
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
  } = useUnifiedSaleWizard();

  const eventLabel = mode === "recovery" ? "Процедура" : "Тренировка";

  if (!selectedMember) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => setPaymentMode("subscription")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase transition-all",
            paymentMode === "subscription"
              ? "bg-white text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Месечен абонамент
        </button>
        <button
          onClick={() => setPaymentMode("individual")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase transition-all",
            paymentMode === "individual"
              ? "bg-white text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400"
              : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Единични {eventLabel.toLowerCase()}
        </button>
      </div>

      {paymentMode === "subscription" ? (
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
      ) : (
        <WizardStep2Individual
          selectedMember={selectedMember}
          unpaidEvents={unpaidEvents}
          selectedEventIds={selectedEventIds}
          setSelectedEventIds={setSelectedEventIds}
          toggleEventSelection={toggleEventSelection}
          eventLabel={eventLabel}
        />
      )}
    </div>
  );
};

// ── Subscription sub-component ─────────────────────────────────────────────────

interface SubscriptionProps {
  selectedMember: Member;
  monthlyAttendance: MonthAttendance[];
  unpaidMonths: MonthAttendance[];
  selectedMonthKeys: string[];
  setSelectedMonthKeys: (keys: string[]) => void;
  allUnpaidMonthsSelected: boolean;
  toggleMonthSelection: (key: string) => void;
  price: string | number;
}

const WizardStep2Subscription = ({
  selectedMember,
  monthlyAttendance,
  unpaidMonths,
  selectedMonthKeys,
  setSelectedMonthKeys,
  allUnpaidMonthsSelected,
  toggleMonthSelection,
  price,
}: SubscriptionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold tracking-widest text-zinc-700 uppercase dark:text-zinc-300">
          Изберете месеци за плащане
        </Label>
        {unpaidMonths.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setSelectedMonthKeys(
                allUnpaidMonthsSelected
                  ? []
                  : unpaidMonths.map((m) => m.monthKey)
              )
            }
            className="text-[10px] font-semibold tracking-widest text-emerald-600 uppercase transition-colors hover:text-emerald-700"
          >
            {allUnpaidMonthsSelected ? "Изчисти" : "Избери всички неплатени"}
          </button>
        )}
      </div>

      {monthlyAttendance.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center dark:border-zinc-900 dark:bg-zinc-900/40">
          <CalendarDays className="mx-auto mb-3 size-8 text-zinc-200" />
          <p className="text-xs font-light text-zinc-400">
            Няма регистрирани присъствия за {selectedMember.firstName}.
          </p>
          <p className="mt-1 text-[10px] font-light text-zinc-300">
            Можете да продължите с плащане без свързани присъствия.
          </p>
          <button
            type="button"
            onClick={() => setSelectedMonthKeys(["NO_EVENTS"])}
            className={cn(
              "mt-4 rounded-xl px-4 py-2 text-[10px] font-semibold tracking-widest uppercase transition-all",
              selectedMonthKeys.includes("NO_EVENTS")
                ? "bg-emerald-500 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {selectedMonthKeys.includes("NO_EVENTS") ? (
              <>
                <Check className="mr-1 inline size-3" /> Избрано
              </>
            ) : (
              "Продължи без присъствия"
            )}
          </button>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-70 space-y-2 overflow-y-auto pr-1">
          {monthlyAttendance.map((monthData) => {
            const isSelected = selectedMonthKeys.includes(monthData.monthKey);
            const hasUnpaid = monthData.unpaidCount > 0;
            return (
              <button
                key={monthData.monthKey}
                type="button"
                onClick={() => toggleMonthSelection(monthData.monthKey)}
                className={cn(
                  "w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                  isSelected
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20"
                    : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    )}
                  >
                    {isSelected && (
                      <Check className="size-3 text-white" strokeWidth={3} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isSelected
                          ? "text-emerald-900 dark:text-emerald-200"
                          : "text-zinc-900 dark:text-zinc-100"
                      )}
                    >
                      {monthData.monthLabel}
                    </p>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-light text-zinc-400">
                      {Object.values(monthData.memberStats).length > 1 ? (
                        Object.values(monthData.memberStats).map((stat) => {
                          const total = stat.paidCount + stat.unpaidCount;
                          if (total === 0) return null;
                          return (
                            <span
                              key={stat.memberId}
                              className={
                                isSelected
                                  ? "text-emerald-700/70 dark:text-emerald-300/70"
                                  : ""
                              }
                            >
                              • {stat.firstName}: {total} присъстви
                              {total === 1 ? "е" : "я"}
                              {stat.unpaidCount > 0 && (
                                <span className="ml-1 font-medium text-rose-500">
                                  ({stat.unpaidCount} неплатени)
                                </span>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span
                          className={
                            isSelected
                              ? "text-emerald-700/70 dark:text-emerald-300/70"
                              : ""
                          }
                        >
                          {monthData.paidCount + monthData.unpaidCount}{" "}
                          присъствия общо
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {monthData.paidCount > 0 && (
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700 uppercase">
                        {monthData.paidCount} платени
                      </span>
                    )}
                    {hasUnpaid ? (
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[9px] font-semibold text-rose-700 uppercase">
                        {monthData.unpaidCount} неплатени
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[9px] font-semibold text-zinc-400 uppercase">
                        Изплатен
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedMonthKeys.length > 0 &&
        !selectedMonthKeys.includes("NO_EVENTS") && (
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              selectedMonthKeys.length > 1
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-3.5 text-emerald-600"
                strokeWidth={2}
              />
              <span className="text-[10px] font-semibold tracking-widest text-emerald-800 uppercase dark:text-emerald-300">
                Избрани: {selectedMonthKeys.length}{" "}
                {selectedMonthKeys.length === 1 ? "месец" : "месеца"}
              </span>
            </div>
            {selectedMonthKeys.length > 1 && (
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Общо:{" "}
                {formatPrice(Number(price || 0) * selectedMonthKeys.length)}
              </span>
            )}
          </div>
        )}
    </div>
  );
};

// ── Individual sub-component ──────────────────────────────────────────────────

interface IndividualProps {
  selectedMember: Member;
  unpaidEvents: ScheduleEvent[];
  selectedEventIds: string[];
  setSelectedEventIds: (ids: string[]) => void;
  toggleEventSelection: (id: string) => void;
  /** Label for event items, e.g. "процедури" or "тренировки" */
  eventLabel?: string;
}

const WizardStep2Individual = ({
  selectedMember,
  unpaidEvents,
  selectedEventIds,
  setSelectedEventIds,
  toggleEventSelection,
  eventLabel = "процедури",
}: IndividualProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold tracking-widest text-zinc-700 uppercase dark:text-zinc-300">
          Изберете {eventLabel} за плащане
        </Label>
        {unpaidEvents.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setSelectedEventIds(
                selectedEventIds.length === unpaidEvents.length
                  ? []
                  : unpaidEvents.map((e) => e.id)
              )
            }
            className="text-[10px] font-semibold tracking-widest text-emerald-600 uppercase hover:text-emerald-700"
          >
            {selectedEventIds.length === unpaidEvents.length
              ? "Изчисти"
              : "Избери всички"}
          </button>
        )}
      </div>
      {unpaidEvents.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center dark:border-zinc-900 dark:bg-zinc-900/40">
          <CheckSquare className="mx-auto mb-3 size-8 text-emerald-200" />
          <p className="text-xs font-light text-zinc-400">
            Няма неплатени {eventLabel} за {selectedMember.firstName}.
          </p>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-75 space-y-2 overflow-y-auto pr-1">
          {unpaidEvents.map((event) => {
            const isChecked = selectedEventIds.includes(event.id);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => toggleEventSelection(event.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                  isChecked
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                    : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/20"
                )}
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-all",
                    isChecked
                      ? "border-blue-500 bg-blue-500"
                      : "border-zinc-200 bg-white dark:bg-zinc-900"
                  )}
                >
                  {isChecked && (
                    <Check className="size-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isChecked
                        ? "text-blue-900 dark:text-blue-200"
                        : "text-zinc-900 dark:text-zinc-100"
                    )}
                  >
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-[10px] font-light text-zinc-400">
                    {format(new Date(event.startDate), "dd MMMM yyyy", {
                      locale: bg,
                    })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                {isChecked && (
                  <Check className="size-4 shrink-0 text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
      {selectedEventIds.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[10px] font-medium text-blue-700">
          Избрани: {selectedEventIds.length} {eventLabel}
        </div>
      )}
    </div>
  );
};
