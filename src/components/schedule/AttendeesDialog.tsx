"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Member, ScheduleEvent, Attendee } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { formatFullName } from "@/lib/utils";

interface AttendeesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  members: Member[]; // Full list of members for adding new attendees
  onUpdateAttendees: (eventId: string, attendees: Attendee[]) => Promise<void>;
}

export const AttendeesDialog: React.FC<AttendeesDialogProps> = ({
  isOpen,
  onClose,
  event,
  members,
  onUpdateAttendees,
}) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);

  useEffect(() => {
    if (event?.attendees) {
      // Map full member info to attendees
      const attendeesWithNames = event.attendees.map((a) => {
        const member = members.find((m) => m.id === a.memberId);
        return {
          ...a,
          name: member ? formatFullName(member) : "Неизвестен член",
        };
      });
      setAttendees(attendeesWithNames);
    } else {
      setAttendees([]);
    }
    // Reset mode when dialog opens
    setIsAddingMode(false);
  }, [event, members]);

  const handleToggleAttended = (memberId: string) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.memberId === memberId ? { ...a, attended: !a.attended } : a
      )
    );
  };

  const handleAddMemberToAttendees = (member: Member) => {
    if (!attendees.some((a) => a.memberId === member.id)) {
      setAttendees((prev) => [
        ...prev,
        {
          memberId: member.id,
          name: formatFullName(member),
          attended: true, // Automatically mark as attended when adding
        },
      ]);
    }
  };

  const handleRemoveMemberFromAttendees = (memberId: string) => {
    setAttendees((prev) => prev.filter((a) => a.memberId !== memberId));
  };

  const handleSubmit = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      // We only need to submit the IDs and attended status
      const payload = attendees.map(({ memberId, attended, name }) => ({
        memberId,
        attended,
        name,
      }));
      await onUpdateAttendees(event.id, payload);
      onClose();
    } catch (error) {
      console.error("Failed to update attendees", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const registeredMemberIds = new Set(attendees.map((a) => a.memberId));
  const availableMembers = members.filter(
    (m) =>
      !registeredMemberIds.has(m.id) &&
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const attendeesToShow = attendees.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAddingMode ? "Добавяне на членове" : "Управление на присъствия"}
          </DialogTitle>
          <DialogDescription>
            {isAddingMode
              ? `Търсете и добавете членове към събитието "${event?.title || ""}".`
              : `Маркирайте присъствалите на събитието "${event?.title || ""}".`}
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Търсене по име..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        {isAddingMode ? (
          <ScrollArea className="h-80 border rounded-md">
            <div className="p-2">
              {availableMembers.length > 0 ? (
                availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <span>{formatFullName(member)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddMemberToAttendees(member)}
                    >
                      Добави
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  Няма намерени членове.
                </p>
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-80 border rounded-md">
            <div className="p-2">
              {attendeesToShow.length > 0 ? (
                attendeesToShow.map((attendee) => (
                  <div
                    key={attendee.memberId}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        id={`att-${attendee.memberId}`}
                        checked={attendee.attended}
                        onCheckedChange={() =>
                          handleToggleAttended(attendee.memberId)
                        }
                        className="mr-3"
                      />
                      <label
                        htmlFor={`att-${attendee.memberId}`}
                        className="font-medium"
                      >
                        {attendee.name}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveMemberFromAttendees(attendee.memberId)
                      }
                    >
                      Премахни
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  Няма записани членове за това събитие.
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 flex justify-between w-full">
          <Button
            variant="outline"
            onClick={() => setIsAddingMode(!isAddingMode)}
          >
            {isAddingMode ? (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Маркирай присъствия
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Добави членове
              </>
            )}
          </Button>
          <div>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="mr-2"
            >
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Запазване...
                </>
              ) : (
                "Запази"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
