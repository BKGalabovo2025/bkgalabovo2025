"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyScheduleFormData } from "./monthly-schedule-types";

interface DayOfWeek {
  id: string;
  label: string;
  value: number;
}

interface MonthlyScheduleStep2Props {
  form: UseFormReturn<MonthlyScheduleFormData>;
  isActive: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
  daysOfWeek: DayOfWeek[];
}

export function MonthlyScheduleStep2({
  form,
  isActive,
  onKeyDown,
  daysOfWeek,
}: MonthlyScheduleStep2Props) {
  const watchedDays = form.watch("days") || [];

  const handleToggleDay = (dayValue: number) => {
    const currentDays = form.getValues("days") || [];
    const isSelected = currentDays.includes(dayValue);
    const newValue = isSelected
      ? currentDays.filter((v) => v !== dayValue)
      : [...currentDays, dayValue];
    form.setValue("days", newValue, { shouldValidate: true });
  };

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        isActive ? "block opacity-100" : "hidden opacity-0"
      )}
    >
      <FormField
        control={form.control}
        name="month"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3" /> Месец за генериране
            </FormLabel>
            <Input
              type="month"
              className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light text-center"
              {...field}
            />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3" /> Начален час
              </FormLabel>
              <Input
                type="time"
                className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                onKeyDown={onKeyDown}
                {...field}
              />
              <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3" /> Краен час
              </FormLabel>
              <Input
                type="time"
                className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                onKeyDown={onKeyDown}
                {...field}
              />
              <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 block mb-4">
          Повторение в дните (Дни от седмицата)
        </FormLabel>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map((day) => {
            const isSelected = watchedDays.includes(day.value);
            return (
              <div
                key={day.id}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleToggleDay(day.value)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    handleToggleDay(day.value);
                  }
                }}
                className={cn(
                  "h-12 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all gap-0.5 flex-1 min-w-[50px] md:min-w-[60px] select-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-950",
                  isSelected
                    ? "bg-zinc-950 border-zinc-950 text-white shadow-lg shadow-zinc-950/20"
                    : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50"
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-widest">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
        <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
      </div>
    </div>
  );
}
