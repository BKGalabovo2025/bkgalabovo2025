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
        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          Изберете месеци за плащане
        </Label>
        {unpaidMonths.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setSelectedMonthKeys(allUnpaidMonthsSelected ? [] : unpaidMonths.map((m) => m.monthKey))
            }
            className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
          >
            {allUnpaidMonthsSelected ? "Изчисти" : "Избери всички неплатени"}
          </button>
        )}
      </div>

      {monthlyAttendance.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
          <CalendarDays className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
          <p className="text-xs font-light text-zinc-400">
            Няма регистрирани присъствия за {selectedMember.firstName}.
          </p>
          <p className="text-[10px] font-light text-zinc-300 mt-1">
            Можете да продължите с плащане без свързани присъствия.
          </p>
          <button
            type="button"
            onClick={() => setSelectedMonthKeys(["NO_EVENTS"])}
            className={cn(
              "mt-4 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all",
              selectedMonthKeys.includes("NO_EVENTS")
                ? "bg-emerald-500 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {selectedMonthKeys.includes("NO_EVENTS") ? (
              <>
                <Check className="inline h-3 w-3 mr-1" /> Избрано
              </>
            ) : (
              "Продължи без присъствия"
            )}
          </button>
        </div>
      ) : (
        <div className="max-h-[280px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {monthlyAttendance.map((monthData) => {
            const isSelected = selectedMonthKeys.includes(monthData.monthKey);
            const hasUnpaid = monthData.unpaidCount > 0;
            return (
              <button
                key={monthData.monthKey}
                type="button"
                onClick={() => toggleMonthSelection(monthData.monthKey)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200",
                  isSelected
                    ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-700"
                    : "bg-white border-zinc-100 dark:bg-zinc-900/20 dark:border-zinc-800 hover:border-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-emerald-500 border-emerald-500" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", isSelected ? "text-emerald-900 dark:text-emerald-200" : "text-zinc-900 dark:text-zinc-100")}>
                      {monthData.monthLabel}
                    </p>
                    <div className="text-[10px] text-zinc-400 font-light mt-1 flex flex-col gap-0.5">
                      {Object.values(monthData.memberStats).length > 1 ? (
                        Object.values(monthData.memberStats).map((stat) => {
                          const total = stat.paidCount + stat.unpaidCount;
                          if (total === 0) return null;
                          return (
                            <span key={stat.memberId} className={isSelected ? "text-emerald-700/70 dark:text-emerald-300/70" : ""}>
                              • {stat.firstName}: {total} присъстви{total === 1 ? "е" : "я"}
                              {stat.unpaidCount > 0 && <span className="text-rose-500 font-medium ml-1">({stat.unpaidCount} неплатени)</span>}
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

                  <div className="flex items-center gap-2 shrink-0">
                    {monthData.paidCount > 0 && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-semibold uppercase">
                        {monthData.paidCount} платени
                      </span>
                    )}
                    {hasUnpaid ? (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[9px] font-semibold uppercase">
                        {monthData.unpaidCount} неплатени
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-full text-[9px] font-semibold uppercase">
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
            "px-4 py-3 rounded-2xl border flex items-center justify-between",
            selectedMonthKeys.length > 1
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
              : "bg-zinc-50 border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-800"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
            <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
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
        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
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
            className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
          >
            {selectedEventIds.length === unpaidEvents.length ? "Изчисти" : "Избери всички"}
          </button>
        )}
      </div>
      {unpaidEvents.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
          <CheckSquare className="h-8 w-8 text-emerald-200 mx-auto mb-3" />
          <p className="text-xs font-light text-zinc-400">
            Няма неплатени {eventLabel} за {selectedMember.firstName}.
          </p>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {unpaidEvents.map((event) => {
            const isChecked = selectedEventIds.includes(event.id);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => toggleEventSelection(event.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3",
                  isChecked
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                    : "bg-white border-zinc-100 dark:bg-zinc-900/20 dark:border-zinc-800 hover:border-zinc-200"
                )}
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                    isChecked ? "bg-blue-500 border-blue-500" : "border-zinc-200 bg-white dark:bg-zinc-900"
                  )}
                >
                  {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isChecked ? "text-blue-900 dark:text-blue-200" : "text-zinc-900 dark:text-zinc-100")}>
                    {event.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-light mt-0.5">
                    {format(new Date(event.startDate), "dd MMMM yyyy", { locale: bg })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                {isChecked && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      {selectedEventIds.length > 0 && (
        <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-700 font-medium">
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
        <div className="ml-auto rounded-full text-[8px] px-2 py-0 border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {service.type}
        </div>
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
              className="h-3.5 w-3.5"
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
              "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
              paymentMode === "individual"
                ? "bg-white dark:bg-zinc-800 text-blue-700 shadow-sm"
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
              className="h-3.5 w-3.5"
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
            <div className="py-12 flex flex-col items-center justify-center gap-3">
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
                className="h-7 w-7 animate-spin text-emerald-500 opacity-40"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <p className="text-zinc-400 text-xs font-light">
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
