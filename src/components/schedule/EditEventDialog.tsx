/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useId, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleEvent, ScheduleEventType } from "@/types";
import { Loader2, ArrowRight, ArrowLeft, Calendar, MapPin, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onUpdateEvent: (
    eventId: string,
    eventData: Partial<Omit<ScheduleEvent, "id" | "color">>
  ) => Promise<void>;
}

const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: "Тренировка",
  competition: "Състезание",
  camp: "Лагер",
  event: "Събитие",
  other: "Друго",
};

const toLocalISOString = (dateString: string | undefined | null): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  } catch {
    return "";
  }
};

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  isOpen,
  onClose,
  event,
  onUpdateEvent,
}) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(event?.title || "");
  const [startDate, setStartDate] = useState(toLocalISOString(event?.startDate));
  const [endDate, setEndDate] = useState(toLocalISOString(event?.endDate));
  const [type, setType] = useState<ScheduleEventType>(event?.type || "training");
  const [location, setLocation] = useState(event?.location || "");
  const [description, setDescription] = useState(event?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event && isOpen) {
      setStep(1); // Reset to first step when opened
      setTitle(event.title || "");
      setStartDate(toLocalISOString(event.startDate));
      setEndDate(toLocalISOString(event.endDate));
      setType(event.type || "training");
      setLocation(event.location || "");
      setDescription(event.description || "");
      setError(null);
    }
  }, [event, isOpen]);

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!title || !type || !location) {
        setError("Моля, въведете име, тип и място.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!startDate || !endDate) {
        setError("Моля, въведете начало и край.");
        return false;
      }
      if (startDate >= endDate) {
        setError("Началото трябва да е преди края.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === "Enter" && target.tagName !== "TEXTAREA" && target.tagName !== "BUTTON") {
      e.preventDefault();
      if (step < 3) {
        handleNextStep();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (step < 3) {
      handleNextStep();
      return;
    }
    if (!validateStep(3)) return;
    if (!title || !startDate || !endDate || !type || !location) {
      setError("Моля, попълнете всички задължителни полета.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdateEvent(event.id, {
        title,
        startDate,
        endDate,
        type,
        location,
        description,
      });
      onClose();
    } catch (err) {
      setError("Възникна грешка при обновяването на събитието.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const descriptionId = useId();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        key={event?.id}
        className="sm:max-w-[540px] w-[92vw] rounded-4xl sm:rounded-5xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        aria-describedby={descriptionId}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 sm:p-8 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 z-10">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight text-zinc-950 dark:text-white flex items-center justify-between">
                <span>Редактиране на събитие</span>
                <span className="text-xs sm:text-sm font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                  Стъпка {step} от 3
                </span>
              </DialogTitle>
              <DialogDescription
                id={descriptionId}
                className="text-zinc-400 font-light mt-1 text-xs sm:text-sm"
              >
                {step === 1 && "Основна информация за събитието."}
                {step === 2 && "Кога ще се проведе?"}
                {step === 3 && "Допълнителни детайли (по желание)."}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Bar */}
            <div className="mt-6 flex gap-2">
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

          <div className="overflow-y-auto custom-scrollbar flex-1 overscroll-contain relative">
            {event && (
              <form
                id="edit-event-form"
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* STEP 1: Basic Info */}
                <div className={cn("space-y-5 transition-all duration-500", step === 1 ? "block opacity-100" : "hidden opacity-0")}>
                  <div className="space-y-2">
                    <label htmlFor="edit-type" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Тип на събитието
                    </label>
                    <Select
                      onValueChange={(value: ScheduleEventType) => setType(value)}
                      value={type}
                    >
                      <SelectTrigger
                        id="edit-type"
                        className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                      >
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                        {Object.entries(eventTypeTranslations).map(([key, value]) => (
                          <SelectItem key={key} value={key as ScheduleEventType} className="rounded-xl py-3 cursor-pointer">
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-title" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
                      Име на събитието / Група
                    </label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light focus:ring-zinc-950"
                      autoFocus={step === 1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="edit-location" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
                      Място / Корт
                    </label>
                    <Input
                      id="edit-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                    />
                  </div>
                </div>

                {/* STEP 2: Time Range */}
                <div className={cn("space-y-5 transition-all duration-500", step === 2 ? "block opacity-100" : "hidden opacity-0")}>
                  <div className="space-y-2">
                    <label htmlFor="edit-startDate" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Начало
                    </label>
                    <Input
                      id="edit-startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                      autoFocus={step === 2}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-endDate" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Край
                    </label>
                    <Input
                      id="edit-endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-12 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 shadow-none font-light"
                    />
                  </div>
                </div>

                {/* STEP 3: Additional details */}
                <div className={cn("space-y-5 transition-all duration-500", step === 3 ? "block opacity-100" : "hidden opacity-0")}>
                  <div className="space-y-2">
                    <label htmlFor="edit-description" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                      <AlignLeft className="h-3 w-3" /> Описание
                    </label>
                    <Textarea
                      id="edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 shadow-none font-light resize-none focus:ring-zinc-950"
                      autoFocus={step === 3}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900">
                    <p className="text-[11px] font-medium text-rose-500 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {error}
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="p-6 sm:p-8 pt-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/20 shrink-0 z-10">
            <DialogFooter className="flex flex-row justify-between sm:justify-between items-center w-full gap-3 sm:gap-0">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-2xl font-medium text-[11px] uppercase tracking-widest hover:bg-white dark:hover:bg-zinc-900 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-2xl font-medium text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-all"
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
                  className="h-12 px-8 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 font-medium text-[11px] uppercase tracking-widest shadow-xl shadow-zinc-950/10 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  Напред <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="edit-event-form"
                  disabled={isSubmitting}
                  className="h-12 px-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 font-medium text-[11px] uppercase tracking-widest shadow-xl shadow-zinc-950/10 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Запазване...
                    </>
                  ) : (
                    "Запази промените"
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
