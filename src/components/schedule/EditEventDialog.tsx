"use client";

import React from "react";

import {
  EventDialogForm,
  toLocalISOString,
} from "@/components/shared/schedule/EventDialogForm";
import { ScheduleEvent } from "@/types";

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  onUpdateEvent: (
    eventId: string,
    eventData: Partial<Omit<ScheduleEvent, "id" | "color">>
  ) => Promise<void>;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({
  isOpen,
  onClose,
  event,
  onUpdateEvent,
}) => {
  if (!event) return null;

  return (
    <EventDialogForm
      key={event.id} // re-mount when switching events
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle="Редактиране на събитие"
      submitLabel="Запази промените"
      idPrefix="edit"
      initialValues={{
        title: event.title ?? "",
        startDate: toLocalISOString(event.startDate),
        endDate: toLocalISOString(event.endDate),
        type: event.type ?? "training",
        location: event.location ?? "",
        description: event.description ?? "",
      }}
      onSubmit={async ({
        title,
        startDate,
        endDate,
        type,
        location,
        description,
      }) => {
        await onUpdateEvent(event.id, {
          title,
          startDate,
          endDate,
          type,
          location,
          description,
        });
      }}
    />
  );
};
