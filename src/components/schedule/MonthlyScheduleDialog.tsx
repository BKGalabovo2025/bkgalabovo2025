/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { eachDayOfInterval, endOfMonth, getDay } from "date-fns";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScheduleEvent } from "@/types";

import MonthlyScheduleForm from "./monthly-schedule-form";

export default function MonthlyScheduleDialog({
  isOpen,
  onClose,
  onGenerate,
}: any) {
  const handleSave = async (data: any) => {
    const [year, monthStr] = data.month.split("-");
    const startDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
    const endDate = endOfMonth(startDate);

    const allDaysInMonth = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const events: Omit<ScheduleEvent, "id">[] = [];

    const [startHour, startMinute] = data.startTime.split(":").map(Number);
    const [endHour, endMinute] = data.endTime.split(":").map(Number);

    allDaysInMonth.forEach((date) => {
      const dayOfWeek = getDay(date);
      if (data.days.includes(dayOfWeek)) {
        const eventStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          startHour,
          startMinute
        );
        const eventEnd = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          endHour,
          endMinute
        );

        events.push({
          title: data.title,
          type: data.type,
          location: data.location,
          startDate: eventStart.toISOString(),
          endDate: eventEnd.toISOString(),
          attendees: [],
          attendeeMemberIds: [],
        });
      }
    });

    await onGenerate(events);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-lg flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Генериране на график
          </DialogTitle>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0">
          <MonthlyScheduleForm onSave={handleSave} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
