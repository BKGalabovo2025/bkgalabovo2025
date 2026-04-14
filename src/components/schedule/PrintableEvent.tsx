// This component is designed specifically for printing.
import React from "react";
import { ScheduleEvent, Member, ScheduleEventType, Attendee } from "@/types";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

interface PrintableEventProps {
  event: ScheduleEvent;
  members: Member[];
  eventTypeTranslations: Record<ScheduleEventType, string>;
}

// Simplified formatDate function, as data is now pre-processed in the hook.
const formatDate = (date?: Date | string | null) => {
  if (!date) return "N/A";
  try {
    // The date should now consistently be a Date object or a valid ISO string.
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d MMMM yyyy 'г.', HH:mm 'ч.'", { locale: bg });
  } catch {
    return "Невалидна дата";
  }
};

export const PrintableEvent: React.FC<PrintableEventProps> = ({
  event,
  members,
  eventTypeTranslations,
}) => {
  if (!event) return null;

  const attendeeNames = (event.attendees || [])
    .map((attendee: Attendee) => {
      const member = members.find((m) => m.id === attendee.memberId);
      return member ? `${member.firstName} ${member.lastName}` : null;
    })
    .filter(Boolean)
    .join(", ");

  const translatedEventType = event.type
    ? eventTypeTranslations[event.type]
    : "Няма посочен";

  return (
    <div className="p-4 font-sans text-sm">
      <h1 className="text-xl font-bold mb-4 border-b pb-2">
        Детайли за събитието
      </h1>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <p className="font-semibold col-span-1">Заглавие:</p>
        <p className="col-span-2">{event.title}</p>

        <p className="font-semibold col-span-1">Начало:</p>
        <p className="col-span-2">{formatDate(event.startDate)}</p>

        <p className="font-semibold col-span-1">Край:</p>
        <p className="col-span-2">{formatDate(event.endDate)}</p>

        <p className="font-semibold col-span-1">Място:</p>
        <p className="col-span-2">{event.location || "Няма посочено"}</p>

        <p className="font-semibold col-span-1">Тип:</p>
        <p className="col-span-2">{translatedEventType}</p>

        {attendeeNames && (
          <>
            <p className="font-semibold col-span-1 mt-2">Присъстващи:</p>
            <p className="col-span-2 mt-2">{attendeeNames}</p>
          </>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-6 pt-2 border-t">
        Генерирано на:{" "}
        {format(new Date(), "d MMMM yyyy 'г.' HH:mm 'ч.'", { locale: bg })}
      </p>
    </div>
  );
};
