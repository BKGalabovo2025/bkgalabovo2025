"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";

import { MonthlyScheduleStep1 } from "./MonthlyScheduleStep1";
import { MonthlyScheduleStep2 } from "./MonthlyScheduleStep2";
import { MonthlyScheduleStep3 } from "./MonthlyScheduleStep3";

import {
  daysOfWeek,
  monthlyScheduleSchema,
  MonthlyScheduleFormData,
} from "./monthly-schedule-types";
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

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          <span>
            {(() => {
              if (step === 1) return "Стъпка 1: Основна информация";
              if (step === 2) return "Стъпка 2: Време и Повторяемост";
              return "Стъпка 3: Финализиране";
            })()}
          </span>
          <span>Стъпка {step} от 3</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500 ease-out",
                (() => {
                  if (i === step) return "bg-zinc-950 dark:bg-white";
                  if (i < step) return "bg-zinc-950/30 dark:bg-white/30";
                  return "bg-zinc-100 dark:bg-zinc-800";
                })()
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
          <MonthlyScheduleStep1
            form={form}
            isActive={step === 1}
            onKeyDown={handleInputKeyDown}
          />

          <MonthlyScheduleStep2
            form={form}
            isActive={step === 2}
            onKeyDown={handleInputKeyDown}
            daysOfWeek={daysOfWeek}
          />

          <MonthlyScheduleStep3
            isActive={step === 3}
            currentValues={currentValues}
            daysOfWeek={daysOfWeek}
          />

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
