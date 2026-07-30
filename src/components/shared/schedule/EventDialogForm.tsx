/* eslint-disable sonarjs/no-nested-conditional */

"use client";

import {
  AlignLeft,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  MapPin,
} from "lucide-react";
import React, { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ScheduleEventType } from "@/types";

// ── Shared constants ──────────────────────────────────────────────────────────

const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: "Тренировка",
  competition: "Състезание",
  camp: "Лагер",
  event: "Събитие",
  other: "Друго",
};

export const getDefaultStartTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export const getDefaultEndTime = (startTime: string) => {
  const now = new Date(startTime);
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
};

export const toLocalISOString = (
  dateString: string | undefined | null
): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

// ── Shared EventDialogForm ────────────────────────────────────────────────────

interface EventDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dialog title shown in the header */
  dialogTitle: string;
  /** Label for the submit button on step 3 */
  submitLabel: string;
  /** Initial values — provide for edit mode, omit for create */
  initialValues?: {
    title?: string;
    startDate?: string;
    endDate?: string;
    type?: ScheduleEventType;
    location?: string;
    description?: string;
  };
  /** Called on final submit */
  onSubmit: (data: {
    title: string;
    startDate: string;
    endDate: string;
    type: ScheduleEventType;
    location: string;
    description: string;
  }) => Promise<void>;
  /** Unique prefix for form field IDs to avoid collisions when both dialogs coexist */
  idPrefix?: string;
}

export const EventDialogForm: React.FC<EventDialogFormProps> = ({
  isOpen,
  onClose,
  dialogTitle,
  submitLabel,
  initialValues,
  onSubmit,
  idPrefix = "event",
}) => {
  const defaultStart = getDefaultStartTime();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ?? defaultStart
  );
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ?? getDefaultEndTime(defaultStart)
  );
  const [type, setType] = useState<ScheduleEventType>(
    initialValues?.type ?? "training"
  );
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionId = useId();

  // Sync state when initial values change (e.g. editing a different event)
  useEffect(() => {
    if (isOpen && initialValues) {
      setStep(1);
      setTitle(initialValues.title ?? "");
      setStartDate(initialValues.startDate ?? defaultStart);
      setEndDate(initialValues.endDate ?? getDefaultEndTime(defaultStart));
      setType(initialValues.type ?? "training");
      setLocation(initialValues.location ?? "");
      setDescription(initialValues.description ?? "");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setStep(1);
    setError(null);
    onClose();
  };

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
    if (validateStep(step)) setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (
      e.key === "Enter" &&
      target.tagName !== "TEXTAREA" &&
      target.tagName !== "BUTTON"
    ) {
      e.preventDefault();
      if (step < 3) handleNextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await onSubmit({
        title,
        startDate,
        endDate,
        type,
        location,
        description,
      });
      handleClose();
    } catch (err) {
      setError("Възникна грешка. Моля опитайте отново.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formId = `${idPrefix}-form`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[85vh] w-[92vw] flex-col overflow-hidden rounded-4xl border-none bg-white p-0 shadow-2xl sm:max-h-[90vh] sm:max-w-135 sm:rounded-5xl dark:bg-zinc-950"
        aria-describedby={descriptionId}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="z-10 shrink-0 border-b border-zinc-100 bg-white p-6 pb-4 sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-xl font-light tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                <span>{dialogTitle}</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-400 sm:text-sm dark:bg-zinc-900">
                  Стъпка {step} от 3
                </span>
              </DialogTitle>
              <DialogDescription
                id={descriptionId}
                className="mt-1 text-xs font-light text-zinc-400 sm:text-sm"
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

          {/* Form body */}
          <div className="custom-scrollbar relative flex-1 overflow-y-auto overscroll-contain">
            <form
              id={formId}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="space-y-6 p-6 sm:p-8"
            >
              {/* STEP 1: Basic Info */}
              <div
                className={cn(
                  "space-y-5 transition-all duration-500",
                  step === 1 ? "block opacity-100" : "hidden opacity-0"
                )}
              >
                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-type`}
                    className="ml-1 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    <MapPin className="size-3" /> Тип на събитието
                  </label>
                  <Select
                    onValueChange={(value: ScheduleEventType) => setType(value)}
                    value={type}
                  >
                    <SelectTrigger
                      id={`${idPrefix}-type`}
                      className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 font-light shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <SelectValue placeholder="Изберете тип" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                      {Object.entries(eventTypeTranslations).map(
                        ([key, value]) => (
                          <SelectItem
                            key={key}
                            value={key as ScheduleEventType}
                            className="cursor-pointer rounded-xl py-3"
                          >
                            {value}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-title`}
                    className="ml-1 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    Име на събитието / Група
                  </label>
                  <Input
                    id={`${idPrefix}-title`}
                    placeholder="Например: Тренировка - Напреднали"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 font-light shadow-none focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/50"
                    autoFocus={step === 1}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-location`}
                    className="ml-1 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    Място / Корт
                  </label>
                  <Input
                    id={`${idPrefix}-location`}
                    placeholder="Например: Спортна зала 'Енергетик'"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 font-light shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
                  />
                </div>
              </div>

              {/* STEP 2: Time Range */}
              <div
                className={cn(
                  "space-y-5 transition-all duration-500",
                  step === 2 ? "block opacity-100" : "hidden opacity-0"
                )}
              >
                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-startDate`}
                    className="ml-1 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    <Calendar className="size-3" /> Начало
                  </label>
                  <Input
                    id={`${idPrefix}-startDate`}
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 font-light shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
                    autoFocus={step === 2}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-endDate`}
                    className="ml-1 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    <Calendar className="size-3" /> Край
                  </label>
                  <Input
                    id={`${idPrefix}-endDate`}
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 px-4 font-light shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
                  />
                </div>
              </div>

              {/* STEP 3: Additional details */}
              <div
                className={cn(
                  "space-y-5 transition-all duration-500",
                  step === 3 ? "block opacity-100" : "hidden opacity-0"
                )}
              >
                <div className="space-y-2">
                  <label
                    htmlFor={`${idPrefix}-description`}
                    className="ml-1 flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    <AlignLeft className="size-3" /> Описание (по желание)
                  </label>
                  <Textarea
                    id={`${idPrefix}-description`}
                    placeholder="Допълнителни бележки, треньори..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-30 resize-none rounded-2xl border-zinc-100 bg-zinc-50/50 p-4 font-light shadow-none focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/50"
                    autoFocus={step === 3}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
                  <p className="flex items-center justify-center gap-2 text-center text-[11px] font-medium tracking-widest text-rose-500 uppercase">
                    <span className="size-1.5 animate-pulse rounded-full bg-rose-500" />
                    {error}
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="z-10 shrink-0 border-t border-zinc-100 bg-zinc-50/30 p-6 pt-4 sm:p-8 dark:border-zinc-900 dark:bg-zinc-900/20">
            <DialogFooter className="flex w-full flex-row items-center justify-between gap-3 sm:justify-between sm:gap-0">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="flex h-12 items-center gap-2 rounded-2xl px-6 text-[11px] font-medium tracking-widest uppercase transition-all hover:bg-white dark:hover:bg-zinc-900"
                >
                  <ArrowLeft className="size-4" /> Назад
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl px-6 text-[11px] font-medium tracking-widest text-zinc-400 uppercase transition-all hover:text-zinc-950"
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
                  className="active:scale-0.98 flex h-12 items-center gap-2 rounded-2xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-xl shadow-zinc-950/10 transition-all hover:opacity-90 dark:bg-white dark:text-zinc-950"
                >
                  Напред <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form={formId}
                  disabled={isSubmitting}
                  className="active:scale-0.98 h-12 rounded-2xl bg-zinc-950 px-10 text-[11px] font-medium tracking-widest text-white uppercase shadow-xl shadow-zinc-950/10 transition-all hover:opacity-90 dark:bg-white dark:text-zinc-950"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />{" "}
                      Запазване...
                    </>
                  ) : (
                    submitLabel
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
