 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MonthlyScheduleForm from "./monthly-schedule-form";
import { ScheduleEvent } from "@/types";
import { endOfMonth, eachDayOfInterval, getDay } from "date-fns";

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Генериране на график</DialogTitle>
        </DialogHeader>
        <MonthlyScheduleForm onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
