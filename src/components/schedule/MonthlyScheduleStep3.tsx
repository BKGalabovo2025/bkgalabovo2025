"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyScheduleFormData } from "./monthly-schedule-form";

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
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 space-y-4 border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-emerald-500 mb-4">
          <CheckCircle2 className="h-6 w-6" />
          <h3 className="font-medium text-sm">Всичко е готово за генериране!</h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
              Събитие:
            </span>
            <span className="font-medium">{currentValues.title}</span>
            <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
              Място:
            </span>
            <span className="font-medium">{currentValues.location}</span>
            <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
              Месец:
            </span>
            <span className="font-medium">{currentValues.month}</span>
            <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
              Час:
            </span>
            <span className="font-medium">
              {currentValues.startTime} - {currentValues.endTime}
            </span>
            <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">
              Дни:
            </span>
            <span className="font-medium">{selectedDaysLabels}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
