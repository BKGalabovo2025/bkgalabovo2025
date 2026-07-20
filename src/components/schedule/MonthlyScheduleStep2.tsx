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
            <FormLabel className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
              <Calendar className="size-3" /> Месец за генериране
            </FormLabel>
            <Input
              type="month"
              className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 text-center text-sm font-light transition-all focus:border-zinc-200 focus:ring-0"
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
              <FormLabel className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                <Clock className="size-3" /> Начален час
              </FormLabel>
              <Input
                type="time"
                className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 text-sm font-light transition-all focus:border-zinc-200 focus:ring-0"
                onKeyDown={onKeyDown}
                {...field}
              />
              <FormMessage className="text-[10px] font-medium tracking-widest text-rose-500 uppercase" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                <Clock className="size-3" /> Краен час
              </FormLabel>
              <Input
                type="time"
                className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 text-sm font-light transition-all focus:border-zinc-200 focus:ring-0"
                onKeyDown={onKeyDown}
                {...field}
              />
              <FormMessage className="text-[10px] font-medium tracking-widest text-rose-500 uppercase" />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormLabel className="mb-4 block text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
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
                  "flex h-12 min-w-[50px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-zinc-950 md:min-w-15",
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/20"
                    : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50"
                )}
              >
                <span className="text-[11px] font-medium tracking-widest uppercase">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
        <FormMessage className="text-[10px] font-medium tracking-widest text-rose-500 uppercase" />
      </div>
    </div>
  );
}
