"use client";

import React, { useState, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Derive base attendees from props
  const baseAttendees = useMemo(() => {
    if (!event?.attendees) return [];
    return event.attendees.map((a) => {
      const member = members.find((m) => m.id === a.memberId);
      return {
        ...a,
        name: member ? formatFullName(member) : "Неизвестен член",
      };
    });
  }, [event, members]);

  const [attendees, setAttendees] = useState(baseAttendees);

  const handleToggleAttended = (memberId: string) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.memberId === memberId ? { ...a, attended: !a.attended } : a
      )
    );
  };

  const handleMarkAllPresent = () => {
    setAttendees((prev) => prev.map((a) => ({ ...a, attended: true })));
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

  const registeredMemberIds = useMemo(
    () => new Set(attendees.map((a) => a.memberId)),
    [attendees]
  );

  const availableMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !registeredMemberIds.has(m.id) &&
          m.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [members, registeredMemberIds, searchTerm]
  );

  const attendeesToShow = useMemo(
    () =>
      attendees.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [attendees, searchTerm]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        key={event?.id}
        className="sm:max-w-xl rounded-4xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950"
      >
        <div className="p-10 pb-0">
          <DialogHeader>
            <DialogTitle className="text-3xl font-light tracking-tight text-zinc-950 dark:text-white">
              {isAddingMode
                ? "Добавяне на членове"
                : "Управление на присъствия"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-light mt-2">
              {isAddingMode
                ? `Търсете и добавете членове към събитието \"${
                    event?.title || ""
                  }\".`
                : `Маркирайте присъствалите на събитието \"${
                    event?.title || ""
                  }\".`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Търсене по име..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pl-4 shadow-none font-light"
              />
            </div>
            {!isAddingMode && attendees.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="h-12 px-6 rounded-xl border-zinc-100 dark:border-zinc-800 font-medium text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all shadow-none"
              >
                Всички присъстват
              </Button>
            )}
          </div>
        </div>

        <div className="px-10 py-8">
          {isAddingMode ? (
            <ScrollArea className="h-[400px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <div className="p-4 space-y-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatFullName(member)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddMemberToAttendees(member)}
                        className="h-10 px-6 rounded-xl border-zinc-100 dark:border-zinc-800 font-medium text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all shadow-none"
                      >
                        Добави
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                      Няма намерени членове
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[400px] rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
              <div className="p-4 space-y-2">
                {attendeesToShow.length > 0 ? (
                  attendeesToShow.map((attendee) => (
                    <div
                      key={attendee.memberId}
                      className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          id={`att-${attendee.memberId}`}
                          checked={attendee.attended}
                          onCheckedChange={() =>
                            handleToggleAttended(attendee.memberId)
                          }
                          className="h-5 w-5 rounded-md border-zinc-200 dark:border-zinc-800 data-[state=checked]:bg-zinc-950 data-[state=checked]:border-zinc-950"
                        />
                        <label
                          htmlFor={`att-${attendee.memberId}`}
                          className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
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
                        className="h-8 w-8 p-0 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="sr-only">Премахни</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                      Няма записани членове
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="p-10 pt-0 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-950">
          <Button
            variant="outline"
            onClick={() => setIsAddingMode(!isAddingMode)}
            className="w-full sm:w-auto h-12 px-6 rounded-xl border-zinc-100 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-none"
          >
            {isAddingMode ? (
              <>
                <UserCheck className="mr-3 h-4 w-4" strokeWidth={1.5} />
                Маркирай присъствия
              </>
            ) : (
              <>
                <UserPlus className="mr-3 h-4 w-4" strokeWidth={1.5} />
                Добави членове
              </>
            )}
          </Button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-medium text-[11px] uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-all"
            >
              Отказ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest shadow-none transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Запазване
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
