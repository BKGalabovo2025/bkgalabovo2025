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
import { Loader2, Calendar, MapPin, Clock, Type, Tag, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useEffect, useState } from "react";

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

  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted) {
      form.setValue("month", format(new Date(), "yyyy-MM"));
    }
  }, [isMounted, form]);

  const handleNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["title", "type", "location"]);
    } else if (step === 2) {
      isValid = await form.trigger(["month", "days", "startTime", "endTime"]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === "Enter" && target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
      e.preventDefault();
      if (step < 3) {
        handleNextStep();
      } else {
        form.handleSubmit(onSave)();
      }
    }
  };

  const currentValues = form.getValues();

  return (
    <div className="flex flex-col h-full">
      {/* Wizard Progress Header */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          <span>{step === 1 ? "Стъпка 1: Основна информация" : step === 2 ? "Стъпка 2: Време и Повторяемост" : "Стъпка 3: Финализиране"}</span>
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
        <form id="monthly-schedule-form" onSubmit={form.handleSubmit(onSave)} onKeyDown={handleKeyDown} className="space-y-8 flex-1">
          {/* STEP 1: Basic Info */}
          <div className={cn("space-y-6 transition-all duration-500", step === 1 ? "block opacity-100" : "hidden opacity-0")}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                    <Tag className="h-3 w-3" /> Тип събитие
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-2xl bg-zinc-50/50 border-zinc-100 focus:ring-0 focus:border-zinc-200 transition-all text-sm font-light">
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-zinc-100 shadow-xl p-2">
                      <SelectItem value="training" className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50">Тренировка</SelectItem>
                      <SelectItem value="competition" className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50">Състезание</SelectItem>
                      <SelectItem value="camp" className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50">Лагер</SelectItem>
                      <SelectItem value="event" className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50">Събитие</SelectItem>
                      <SelectItem value="other" className="rounded-xl py-3 text-xs font-light tracking-wide focus:bg-zinc-50">Друго</SelectItem>
                    </SelectContent>
                  </Select>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3" /> Място / Корт
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

          {/* STEP 2: Time and Repetition */}
          <div className={cn("space-y-6 transition-all duration-500", step === 2 ? "block opacity-100" : "hidden opacity-0")}>
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 mb-2">
                    <Calendar className="h-3 w-3" /> Месец за генериране
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

            <div className="space-y-4">
              <FormLabel className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 block mb-4">
                Повтаряне в дните (Дни от седмицата)
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
                        <FormItem key={day.id} className="flex-1 min-w-[50px] md:min-w-[60px]">
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
          </div>

          {/* STEP 3: Summary / Confirmation */}
          <div className={cn("space-y-6 transition-all duration-500", step === 3 ? "block opacity-100" : "hidden opacity-0")}>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 space-y-4 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-emerald-500 mb-4">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-medium text-sm">Всичко е готово за генериране!</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">Събитие:</span>
                  <span className="font-medium">{currentValues.title}</span>
                  
                  <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">Място:</span>
                  <span className="font-medium">{currentValues.location}</span>
                  
                  <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">Месец:</span>
                  <span className="font-medium">{currentValues.month}</span>
                  
                  <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">Час:</span>
                  <span className="font-medium">{currentValues.startTime} - {currentValues.endTime}</span>
                  
                  <span className="text-zinc-500 uppercase tracking-wider font-medium text-[10px]">Дни:</span>
                  <span className="font-medium">
                    {daysOfWeek.filter(d => currentValues.days.includes(d.value)).map(d => d.label).join(", ")}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs font-light text-zinc-500 text-center px-4">
              След като потвърдите, системата автоматично ще създаде всички отделни събития в графика за избраните дни от месеца.
            </p>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-900 mt-8">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                disabled={isSaving}
                className="h-12 px-6 rounded-2xl text-[11px] font-medium uppercase tracking-widest text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Назад
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
                className="h-12 px-6 rounded-2xl text-[11px] font-medium uppercase tracking-widest text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
              >
                Отказ
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                className="h-12 px-8 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[11px] font-medium uppercase tracking-widest shadow-xl shadow-zinc-950/10 transition-all active:scale-[0.98] flex items-center gap-2"
              >
                Напред <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSaving}
                className="h-12 px-10 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 text-[11px] font-medium uppercase tracking-widest shadow-xl shadow-zinc-950/10 transition-all active:scale-[0.98]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Генерирай график"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
