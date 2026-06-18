"use client";

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MapPin, Type, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyScheduleFormData } from "./monthly-schedule-form";

interface MonthlyScheduleStep1Props {
  form: UseFormReturn<MonthlyScheduleFormData>;
  isActive: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function MonthlyScheduleStep1({
  form,
  isActive,
  onKeyDown,
}: MonthlyScheduleStep1Props) {
  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-500",
        isActive ? "block opacity-100" : "hidden opacity-0"
      )}
    >
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
              <Tag className="h-3 w-3" /> Тип събитие
            </FormLabel>
            <select
              className="w-full h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light px-4"
              value={field.value || "training"}
              onChange={(e) => field.onChange(e.target.value)}
            >
              <option value="training">Тренировка</option>
              <option value="competition">Състезание</option>
              <option value="camp">Лагер</option>
              <option value="event">Събитие</option>
              <option value="other">Друго</option>
            </select>
            <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
              <Type className="h-3 w-3" /> Име на събитието / Група
            </FormLabel>
            <Input
              placeholder="напр. Тренировка - Група А"
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
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
              <MapPin className="h-3 w-3" /> Място / Корт
            </FormLabel>
            <Input
              className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
              onKeyDown={onKeyDown}
              {...field}
            />
            <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
          </FormItem>
        )}
      />
    </div>
  );
}
