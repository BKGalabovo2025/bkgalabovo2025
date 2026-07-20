 
 
 
// This component is designed specifically for printing.
import React from "react";
import { ScheduleEvent, Member, ScheduleEventType, Attendee } from "@/types";
import { formatDateTimeDisplay } from "@/lib/date-utils";

// Removed local formatDate as we use the centralized one.

interface PrintableEventProps {
  event: ScheduleEvent;
  members: Member[];
  eventTypeTranslations: Record<ScheduleEventType, string>;
}

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
      <h1 className="mb-4 border-b pb-2 text-xl font-bold">
        Детайли за събитието
      </h1>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        <p className="col-span-1 font-semibold">Заглавие:</p>
        <p className="col-span-2">{event.title}</p>

        <p className="col-span-1 font-semibold">Начало:</p>
        <p className="col-span-2">{formatDateTimeDisplay(event.startDate)}</p>

        <p className="col-span-1 font-semibold">Край:</p>
        <p className="col-span-2">{formatDateTimeDisplay(event.endDate)}</p>

        <p className="col-span-1 font-semibold">Място:</p>
        <p className="col-span-2">{event.location || "Няма посочено"}</p>

        <p className="col-span-1 font-semibold">Тип:</p>
        <p className="col-span-2">{translatedEventType}</p>

        {attendeeNames && (
          <>
            <p className="col-span-1 mt-2 font-semibold">Присъстващи:</p>
            <p className="col-span-2 mt-2">{attendeeNames}</p>
          </>
        )}
      </div>
      <p
        className="mt-6 border-t pt-2 text-xs text-gray-500"
        suppressHydrationWarning
      >
        Генерирано на: {formatDateTimeDisplay(new Date())}
      </p>
    </div>
  );
};
