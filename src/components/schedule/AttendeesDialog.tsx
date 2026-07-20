/* eslint-disable sonarjs/no-nested-conditional */
 
 
"use client";

import React, { useState, useMemo, useId, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Member, ScheduleEvent, Attendee } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Check } from "lucide-react";
import { formatFullName } from "@/lib/utils";

interface AttendeesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  members: Member[];
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
  const [attendeeIds, setAttendeeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (event && isOpen) {
      const presentIds = new Set(
        (event.attendees || []).filter((a) => a.attended).map((a) => a.memberId)
      );

      setAttendeeIds(presentIds);
    }
  }, [event, isOpen]);

  const handleToggleMember = (member: Member) => {
    const regDate = member.registrationDate
      ? new Date(member.registrationDate)
      : null;
    const eventDate = event?.startDate ? new Date(event.startDate) : null;

    if (regDate) regDate.setHours(0, 0, 0, 0);
    if (eventDate) eventDate.setHours(0, 0, 0, 0);

    const isBeforeRegistration = regDate && eventDate && eventDate < regDate;

    if (isBeforeRegistration) return; // Блокираме маркирането, ако събитието е преди регистрацията

    setAttendeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
      } else {
        next.add(member.id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      const attendees: Attendee[] = Array.from(attendeeIds).map((id) => {
        const member = members.find((m) => m.id === id);
        const existingAttendee = event.attendees?.find(
          (a) => a.memberId === id
        );

        return {
          memberId: id,
          name: member ? formatFullName(member) : "Unknown",
          attended: true,
          // Preserve existing payment data to avoid wiping it on UI updates
          ...(existingAttendee?.paymentStatus && {
            paymentStatus: existingAttendee.paymentStatus,
          }),
          ...(existingAttendee?.paymentType && {
            paymentType: existingAttendee.paymentType,
          }),
          ...(existingAttendee?.paymentDate && {
            paymentDate: existingAttendee.paymentDate,
          }),
          ...(existingAttendee?.saleId && { saleId: existingAttendee.saleId }),
        };
      });

      await onUpdateAttendees(event.id, attendees);
      onClose();
    } catch (error) {
      console.error("Failed to update attendees", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return members;
    return members.filter((m) =>
      formatFullName(m).toLowerCase().includes(search)
    );
  }, [members, searchTerm]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aPresent = attendeeIds.has(a.id);
      const bPresent = attendeeIds.has(b.id);
      if (aPresent && !bPresent) return -1;
      if (!aPresent && bPresent) return 1;
      return formatFullName(a).localeCompare(formatFullName(b));
    });
  }, [filteredMembers, attendeeIds]);

  const descriptionId = useId();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        key={event?.id}
        className="flex h-[80vh] max-h-200 w-[95vw] flex-col overflow-hidden rounded-2xl border-none bg-white p-0 shadow-xl sm:max-w-lg dark:bg-zinc-950"
        aria-describedby={descriptionId}
      >
        <div className="shrink-0 border-b border-zinc-100 p-4 pb-0 sm:p-6 dark:border-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">
              Присъстващи
            </DialogTitle>
            <DialogDescription
              id={descriptionId}
              className="mt-1 line-clamp-1 text-xs text-zinc-500"
            >
              {event?.title || "Събитие"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Търсене..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50 pl-10 text-sm transition-all focus:bg-white"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2 sm:p-4">
            {sortedMembers.length > 0 ? (
              sortedMembers.map((member) => {
                const isPresent = attendeeIds.has(member.id);

                // Проверяваме дали събитието е преди датата на регистрация на члена
                const regDate = member.registrationDate
                  ? new Date(member.registrationDate)
                  : null;
                const eventDate = event?.startDate
                  ? new Date(event.startDate)
                  : null;

                if (regDate) regDate.setHours(0, 0, 0, 0);
                if (eventDate) eventDate.setHours(0, 0, 0, 0);

                const isBeforeRegistration =
                  regDate && eventDate && eventDate < regDate;

                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      if (!isBeforeRegistration) {
                        handleToggleMember(member);
                      }
                    }}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
                      isBeforeRegistration
                        ? "cursor-not-allowed bg-zinc-50/50 text-zinc-400 opacity-40 dark:bg-zinc-900/10 dark:text-zinc-600"
                        : isPresent
                          ? "cursor-pointer bg-primary/10 text-primary"
                          : "cursor-pointer text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-all ${
                          isBeforeRegistration
                            ? "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                            : isPresent
                              ? "border-primary bg-primary text-white"
                              : "border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        {isPresent && !isBeforeRegistration && (
                          <Check className="size-3 stroke-3" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate text-sm font-medium">
                          {formatFullName(member)}
                        </span>
                        {member.status === "inactive" && (
                          <span className="shrink-0 rounded-full border border-amber-500/10 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium tracking-wide text-amber-600 uppercase dark:bg-amber-950/20 dark:text-amber-400">
                            Неактивен
                          </span>
                        )}
                      </div>
                    </div>
                    {isBeforeRegistration ? (
                      <span className="shrink-0 rounded-full border border-rose-500/10 bg-rose-500/10 px-2 py-0.5 text-[9px] font-medium tracking-wide text-rose-600 uppercase dark:bg-rose-950/20 dark:text-rose-400">
                        преди рег. ({regDate.toLocaleDateString("bg-BG")})
                      </span>
                    ) : isPresent ? (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
                        Тук
                      </span>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <p className="text-xs text-zinc-400">Няма намерени членове</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-6 dark:border-zinc-900">
          <div className="flex w-full items-center justify-between">
            <div className="text-xs font-medium text-zinc-500">
              <span className="text-zinc-900 dark:text-white">
                {attendeeIds.size}
              </span>{" "}
              присъстващи
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-9 rounded-lg px-4 text-xs font-medium"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-9 rounded-lg bg-zinc-900 px-6 text-xs font-medium text-white hover:bg-zinc-800"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Запази"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
