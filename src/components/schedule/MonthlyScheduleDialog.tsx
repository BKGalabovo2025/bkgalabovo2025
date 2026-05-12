"use client";

import React, { useState, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScheduleEvent } from "@/types";
import MonthlyScheduleForm, {
  MonthlyScheduleFormData,
} from "./monthly-schedule-form";

interface MonthlyScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (newEvents: Omit<ScheduleEvent, "id">[]) => Promise<void>;
}

export const MonthlyScheduleDialog: React.FC<MonthlyScheduleDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descriptionId = useId();

  const handleGenerate = async (formData: MonthlyScheduleFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const newEvents: Omit<ScheduleEvent, "id">[] = [];
      const {
        month: monthString,
        days,
        startTime,
        endTime,
        location,
        title,
      } = formData;

      // Default values for event properties not included in the form
      const [year, month] = monthString.split("-").map(Number);

      // Use a more robust way to get days in month
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        // Create date in local time first
        const eventDate = new Date(year, month - 1, i);
        const dayOfWeek = eventDate.getDay();

        if (days.includes(dayOfWeek)) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);

          const start = new Date(year, month - 1, i, startHour, startMin);
          const end = new Date(year, month - 1, i, endHour, endMin);

          newEvents.push({
            title: title || "Тренировка",
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            type: formData.type || "training",
            location: location,
            attendees: [],
            attendeeMemberIds: [],
            description: `Автоматично генерирана тренировка за месец ${month}/${year}.`,
          });
        }
      }

      if (newEvents.length > 0) {
        await onGenerate(newEvents);
        onClose();
      } else {
        setError("Не са намерени съвпадащи дни за избрания месец.");
      }
    } catch (err) {
      setError(
        "Възникна грешка при генерирането на графика. Моля, опитайте отново."
      );
      console.error("Error in handleGenerate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-xl w-[92vw] rounded-4xl sm:rounded-5xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
        aria-describedby={descriptionId}
      >
        <div className="p-6 sm:p-10 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-3xl font-light tracking-tight text-zinc-950 dark:text-white">
              Месечен график
            </DialogTitle>
            <DialogDescription
              id={descriptionId}
              className="text-zinc-400 font-light mt-1 sm:text-sm text-xs"
            >
              Генерирайте автоматично събития за целия месец на базата на избран
              шаблон.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-10 pt-4 sm:pt-8 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
          <MonthlyScheduleForm
            onSave={handleGenerate}
            onClose={onClose}
            isSaving={isSubmitting}
          />
          {error && (
            <p className="text-[11px] font-medium text-rose-500 uppercase tracking-widest text-center mt-6">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
