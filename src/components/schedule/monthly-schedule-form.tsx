"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Type,
  Tag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useCallback, useMemo, useEffect } from "react";

const daysOfWeek = [
  { id: "mon", label: "Пн", value: 1 },
  { id: "tue", label: "Вт", value: 2 },
  { id: "wed", label: "Ср", value: 3 },
  { id: "thu", label: "Чт", value: 4 },
  { id: "fri", label: "Пт", value: 5 },
  { id: "sat", label: "Сб", value: 6 },
  { id: "sun", label: "Нд", value: 0 },
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
  isSaving?: boolean;
}

export default function MonthlyScheduleForm({
  onSave,
  isSaving,
}: MonthlyScheduleFormProps) {
  const [step, setStep] = useState(1);

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

  const rawWatchedDays = form.watch("days");
  const currentValues = form.getValues();

  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => setCanSubmit(true), 600);
      return () => clearTimeout(timer);
    } else {
      setCanSubmit(false);
    }
  }, [step]);

  const handleNextStep = useCallback(async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["title", "type", "location"]);
    } else if (step === 2) {
      isValid = await form.trigger(["month", "days", "startTime", "endTime"]);
    }
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  }, [step, form]);

  const handlePrevStep = useCallback(() => {
    setStep((prev) => prev - 1);
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (step < 3) {
          handleNextStep();
        } else {
          form.handleSubmit(onSave)();
        }
      }
    },
    [step, handleNextStep, form, onSave]
  );

  const renderedDays = useMemo(() => {
    const watchedDays = rawWatchedDays || [];
    return daysOfWeek.map((day) => {
      const isSelected = watchedDays.includes(day.value);
      return (
        <div
          key={day.id}
          role="checkbox"
          aria-checked={isSelected}
          tabIndex={0}
          onClick={() => {
            const currentDays = form.getValues("days") || [];
            const newValue = isSelected
              ? currentDays.filter((v) => v !== day.value)
              : [...currentDays, day.value];
            form.setValue("days", newValue, { shouldValidate: true });
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              const currentDays = form.getValues("days") || [];
              const newValue = isSelected
                ? currentDays.filter((v) => v !== day.value)
                : [...currentDays, day.value];
              form.setValue("days", newValue, { shouldValidate: true });
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
    });
  }, [rawWatchedDays, form]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          <span>
            {step === 1
              ? "Стъпка 1: Основна информация"
              : step === 2
                ? "Стъпка 2: Време и Повторяемост"
                : "Стъпка 3: Финализиране"}
          </span>
          <span>Стъпка {step} от 3</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500 ease-out",
                i === step
                  ? "bg-zinc-950 dark:bg-white"
                  : i < step
                    ? "bg-zinc-950/30 dark:bg-white/30"
                    : "bg-zinc-100 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form
          id="monthly-schedule-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              handleNextStep();
            } else {
              form.handleSubmit(onSave)();
            }
          }}
          className="space-y-8 flex-1"
        >
          {/* STEP 1 */}
          <div
            className={cn(
              "space-y-6 transition-all duration-500",
              step === 1 ? "block opacity-100" : "hidden opacity-0"
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
                    onKeyDown={handleInputKeyDown}
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
                    onKeyDown={handleInputKeyDown}
                    {...field}
                  />
                  <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
                </FormItem>
              )}
            />
          </div>

          {/* STEP 2 */}
          <div
            className={cn(
              "space-y-6 transition-all duration-500",
              step === 2 ? "block opacity-100" : "hidden opacity-0"
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
                      onKeyDown={handleInputKeyDown}
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
                      onKeyDown={handleInputKeyDown}
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
              <div className="flex flex-wrap gap-2">{renderedDays}</div>
              <FormMessage className="text-[10px] font-medium uppercase tracking-widest text-rose-500" />
            </div>
          </div>

          {/* STEP 3 */}
          <div
            className={cn(
              "space-y-6 transition-all duration-500",
              step === 3 ? "block opacity-100" : "hidden opacity-0"
            )}
          >
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 space-y-4 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-emerald-500 mb-4">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-medium text-sm">
                  Всичко е готово за генериране!
                </h3>
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
                  <span className="font-medium">
                    {daysOfWeek
                      .filter((d) =>
                        (currentValues.days || []).includes(d.value)
                      )
                      .map((d) =>
                        d.id === "sun"
                          ? "Нд"
                          : d.id === "mon"
                            ? "Пн"
                            : d.id === "tue"
                              ? "Вт"
                              : d.id === "wed"
                                ? "Ср"
                                : d.id === "thu"
                                  ? "Чт"
                                  : d.id === "fri"
                                    ? "Пт"
                                    : "Сб"
                      )
                      .join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-900 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                className="h-11 rounded-xl text-xs font-medium uppercase tracking-wider text-zinc-500 hover:border-zinc-50 hover:bg-zinc-50 gap-2 px-4"
              >
                <ArrowLeft className="h-3 w-3" /> Назад
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className={cn(
                  "h-11 rounded-xl text-xs font-medium uppercase tracking-wider gap-2 px-5 ml-auto",
                  "bg-zinc-950 text-white hover:border-zinc-900 hover:bg-zinc-900 shadow-md shadow-zinc-950/10"
                )}
              >
                Напред <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSaving || !canSubmit}
                className={cn(
                  "h-11 rounded-xl text-xs font-medium uppercase tracking-wider gap-2 px-6 ml-auto transition-all",
                  canSubmit
                    ? "bg-zinc-950 text-white hover:border-zinc-900 hover:bg-zinc-900 shadow-lg shadow-zinc-950/20"
                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed opacity-70"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Запазване...
                  </>
                ) : (
                  "Потвърди и създай"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
