"use client";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { MonthlyScheduleFormData } from "./monthly-schedule-types";

interface DayOfWeek {
  id: string;
  label: string;
  value: number;
}

interface MonthlyScheduleStep3Props {
  isActive: boolean;
  currentValues: MonthlyScheduleFormData;
  daysOfWeek: DayOfWeek[];
}

export function MonthlyScheduleStep3({
  isActive,
  currentValues,
  daysOfWeek,
}: MonthlyScheduleStep3Props) {
  const selectedDaysLabels = daysOfWeek
    .filter((d) => (currentValues.days || []).includes(d.value))
    .map((d) => d.label)
    .join(", ");

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        isActive ? "block opacity-100" : "hidden opacity-0"
      )}
    >
      <div className="space-y-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-4 flex items-center gap-3 text-emerald-500">
          <CheckCircle2 className="size-6" />
          <h3 className="text-sm font-medium">
            Всичко е готово за генериране!
          </h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Събитие:
            </span>
            <span className="font-medium">{currentValues.title}</span>
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Място:
            </span>
            <span className="font-medium">{currentValues.location}</span>
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Месец:
            </span>
            <span className="font-medium">{currentValues.month}</span>
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Час:
            </span>
            <span className="font-medium">
              {currentValues.startTime} - {currentValues.endTime}
            </span>
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Дни:
            </span>
            <span className="font-medium">{selectedDaysLabels}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
