"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, MapPin, Clock, Type, Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const daysOfWeek = [
  { id: "mon", label: "Пн", value: 1, full: "Понеделник" },
  { id: "tue", label: "Вт", value: 2, full: "Вторник" },
  { id: "wed", label: "Ср", value: 3, full: "Сряда" },
  { id: "thu", label: "Чт", value: 4, full: "Четвъртък" },
  { id: "fri", label: "Пт", value: 5, full: "Петък" },
  { id: "sat", label: "Сб", value: 6, full: "Събота" },
  { id: "sun", label: "Нд", value: 0, full: "Неделя" },
];

const monthlyScheduleSchema = z
  .object({
    title: z.string().min(1, "Моля, въведете заглавие."),
    type: z.enum(["training", "competition", "camp", "event", "other"]),
    month: z.string().min(1, "Моля, изберете месец."),
    days: z.array(z.number()).min(1, "Моля, изберете поне един ден."),
    startTime: z.string().min(1, "Моля, въведете начален час."),
    endTime: z.string().min(1, "Моля, въведете краен час."),
    location: z.string().min(1, "Моля, въведете локация."),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
  });

export type MonthlyScheduleFormData = z.infer<typeof monthlyScheduleSchema>;

interface MonthlyScheduleFormProps {
  onSave: (data: MonthlyScheduleFormData) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export default function MonthlyScheduleForm({
  onSave,
  onClose,
  isSaving,
}: MonthlyScheduleFormProps) {
  const form = useForm<MonthlyScheduleFormData>({
    resolver: zodResolver(monthlyScheduleSchema),
    defaultValues: {
      title: "Тренировка",
      type: "training",
      month: format(new Date(), "yyyy-MM"),
      days: [],
      startTime: "17:00",
      endTime: "18:30",
      location: 'Спортна зала "Енергетик" град Гълъбово',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title and Type */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                  <Type className="h-3 w-3" /> Заглавие
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="напр. Тренировка - Група А"
                    className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                  <Tag className="h-3 w-3" /> Тип събитие
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light">
                      <SelectValue placeholder="Изберете тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-zinc-100 shadow-xl p-2">
                    <SelectItem
                      value="training"
                      className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50"
                    >
                      Тренировка
                    </SelectItem>
                    <SelectItem
                      value="competition"
                      className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50"
                    >
                      Състезание
                    </SelectItem>
                    <SelectItem
                      value="camp"
                      className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50"
                    >
                      Лагер
                    </SelectItem>
                    <SelectItem
                      value="event"
                      className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50"
                    >
                      Събитие
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50"
                    >
                      Друго
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
              </FormItem>
            )}
          />

          {/* Month and Days */}
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                  <Calendar className="h-3 w-3" /> Месец
                </FormLabel>
                <FormControl>
                  <Input
                    type="month"
                    className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                    {...field}
                  />
                </FormControl>
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
                  <MapPin className="h-3 w-3" /> Локация
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
              </FormItem>
            )}
          />
        </div>

        {/* Days of Week - Grid Style */}
        <div className="space-y-4">
          <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 block mb-4">
            Повтаряне в дните
          </FormLabel>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <FormField
                key={day.id}
                control={form.control}
                name="days"
                render={({ field }) => {
                  const isSelected = field.value?.includes(day.value);
                  return (
                    <FormItem
                      key={day.id}
                      className="flex-1 min-w-[50px] md:min-w-[60px]"
                    >
                      <FormControl>
                        <div
                          onClick={() => {
                            const newValue = isSelected
                              ? field.value?.filter((v) => v !== day.value)
                              : [...(field.value || []), day.value];
                            field.onChange(newValue);
                          }}
                          className={cn(
                            "h-12 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all gap-0.5",
                            isSelected
                              ? "bg-zinc-950 border-zinc-950 text-white shadow-lg shadow-zinc-950/20"
                              : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-50"
                          )}
                        >
                          <span className="text-[11px] font-medium uppercase tracking-widest">
                            {day.label}
                          </span>
                          <Checkbox checked={isSelected} className="sr-only" />
                        </div>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3" /> Начало
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                    {...field}
                  />
                </FormControl>
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
                  <Clock className="h-3 w-3" /> Край
                </FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl text-[11px] font-medium uppercase tracking-widest text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
          >
            Отказ
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[11px] font-medium uppercase tracking-widest shadow-xl shadow-zinc-950/10 transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Генерирай график"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
