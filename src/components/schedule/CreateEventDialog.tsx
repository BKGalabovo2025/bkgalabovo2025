 

"use client";

import React from "react";
import { ScheduleEvent } from "@/types";
import {
  EventDialogForm,
  getDefaultStartTime,
  getDefaultEndTime,
} from "@/components/shared/schedule/EventDialogForm";

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (
    newEvent: Omit<ScheduleEvent, "id" | "color">
  ) => Promise<void>;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const defaultStart = getDefaultStartTime();

  return (
    <EventDialogForm
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle="Създаване на събитие"
      submitLabel="Създай събитие"
      idPrefix="create"
      initialValues={{
        startDate: defaultStart,
        endDate: getDefaultEndTime(defaultStart),
      }}
      onSubmit={async ({ title, startDate, endDate, type, location, description }) => {
        await onAddEvent({
          title,
          startDate,
          endDate,
          type,
          location,
          description,
          attendees: [],
          attendeeMemberIds: [],
        });
      }}
    />
  );
};
