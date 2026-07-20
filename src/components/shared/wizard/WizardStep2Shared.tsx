"use client";

/**
 * Shared sub-components used by both RecoveryWizardStep2 and TrainingWizardStep2.
 * These were 100% identical in both wizards — extracted here to avoid duplication.
 */

import { CalendarDays, Check, CheckSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { ScheduleEvent, Member, ClubService } from "@/types";

// MonthAttendance is identical in both contexts — define it once here
export interface MonthAttendanceStat {
  memberId: string;
  firstName: string;
  paidCount: number;
  unpaidCount: number;
}

export interface MonthAttendance {
  monthKey: string;
  monthLabel: string;
  year?: number;
  events?: unknown[];
  paidCount: number;
  unpaidCount: number;
  memberStats: Record<string, MonthAttendanceStat>;
}

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

export const WizardStep2Subscription = ({
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
              setSelectedMonthKeys(allUnpaidMonthsSelected ? [] : unpaidMonths.map((m) => m.monthKey))
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
                      isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    )}
                  >
                    {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-semibold", isSelected ? "text-emerald-900 dark:text-emerald-200" : "text-zinc-900 dark:text-zinc-100")}>
                      {monthData.monthLabel}
                    </p>
                    <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-light text-zinc-400">
                      {Object.values(monthData.memberStats).length > 1 ? (
                        Object.values(monthData.memberStats).map((stat) => {
                          const total = stat.paidCount + stat.unpaidCount;
                          if (total === 0) return null;
                          return (
                            <span key={stat.memberId} className={isSelected ? "text-emerald-700/70 dark:text-emerald-300/70" : ""}>
                              • {stat.firstName}: {total} присъстви{total === 1 ? "е" : "я"}
                              {stat.unpaidCount > 0 && <span className="ml-1 font-medium text-rose-500">({stat.unpaidCount} неплатени)</span>}
                            </span>
                          );
                        })
                      ) : (
                        <span className={isSelected ? "text-emerald-700/70 dark:text-emerald-300/70" : ""}>
                          {monthData.paidCount + monthData.unpaidCount} присъствия общо
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

      {selectedMonthKeys.length > 0 && !selectedMonthKeys.includes("NO_EVENTS") && (
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border px-4 py-3",
            selectedMonthKeys.length > 1
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
              : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-emerald-600" strokeWidth={2} />
            <span className="text-[10px] font-semibold tracking-widest text-emerald-800 uppercase dark:text-emerald-300">
              Избрани: {selectedMonthKeys.length} {selectedMonthKeys.length === 1 ? "месец" : "месеца"}
            </span>
          </div>
          {selectedMonthKeys.length > 1 && (
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Общо: {formatPrice(Number(price || 0) * selectedMonthKeys.length)}
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

export const WizardStep2Individual = ({
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
                selectedEventIds.length === unpaidEvents.length ? [] : unpaidEvents.map((e) => e.id)
              )
            }
            className="text-[10px] font-semibold tracking-widest text-emerald-600 uppercase hover:text-emerald-700"
          >
            {selectedEventIds.length === unpaidEvents.length ? "Изчисти" : "Избери всички"}
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
                    isChecked ? "border-blue-500 bg-blue-500" : "border-zinc-200 bg-white dark:bg-zinc-900"
                  )}
                >
                  {isChecked && <Check className="size-3 text-white" strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", isChecked ? "text-blue-900 dark:text-blue-200" : "text-zinc-900 dark:text-zinc-100")}>
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-[10px] font-light text-zinc-400">
                    {format(new Date(event.startDate), "dd MMMM yyyy", { locale: bg })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                {isChecked && <Check className="size-4 shrink-0 text-blue-500" />}
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
}

export interface WizardStep2WrapperProps {
  selectedMember: Member;
  service: ClubService;
  paymentMode: "subscription" | "individual";
  setPaymentMode: (mode: "subscription" | "individual") => void;
  attendanceLoading: boolean;
  monthlyAttendance: MonthAttendance[];
  unpaidMonths: MonthAttendance[];
  selectedMonthKeys: string[];
  setSelectedMonthKeys: React.Dispatch<React.SetStateAction<string[]>>;
  allUnpaidMonthsSelected: boolean;
  toggleMonthSelection: (monthKey: string) => void;
  price: string | number;
  unpaidEvents: ScheduleEvent[];
  selectedEventIds: string[];
  setSelectedEventIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleEventSelection: (eventId: string) => void;
  eventLabel: string;
}

export const WizardStep2Wrapper = ({
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
  eventLabel,
}: WizardStep2WrapperProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <CalendarDays className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Присъствия и период
        </h3>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-[9px] font-bold text-white">
          {selectedMember.firstName[0]}
          {selectedMember.lastName[0]}
        </div>
        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
          {selectedMember.firstName} {selectedMember.lastName}
        </span>
        <div className="ml-auto rounded-full border-none bg-emerald-100 px-2 py-0 text-[8px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {service.type}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold tracking-widest text-zinc-700 uppercase dark:text-zinc-300">
          Тип плащане
        </Label>
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setPaymentMode("subscription")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-all",
              paymentMode === "subscription"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {/* Hardcoded icon to match <Calendar /> usage */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <path d="M8 2v4"></path>
              <path d="M16 2v4"></path>
              <rect width="18" height="18" x="3" y="4" rx="2"></rect>
              <path d="M3 10h18"></path>
            </svg>
            Абонамент (Месец)
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("individual")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-all",
              paymentMode === "individual"
                ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {/* Hardcoded icon to match <CreditCard /> usage */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <rect width="20" height="14" x="2" y="5" rx="2"></rect>
              <line x1="2" x2="22" y1="10" y2="10"></line>
            </svg>
            Еднократно
          </button>
        </div>
      </div>

      {(() => {
        if (attendanceLoading) {
          return (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              {/* Loader2 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-7 animate-spin text-emerald-500 opacity-40"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <p className="text-xs font-light text-zinc-400">
                Зареждане на присъствията...
              </p>
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
            eventLabel={eventLabel}
          />
        );
      })()}
    </div>
  );
};;
