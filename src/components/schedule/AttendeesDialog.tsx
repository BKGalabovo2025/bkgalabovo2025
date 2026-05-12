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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttendeeIds(presentIds);
    }
  }, [event, isOpen]);

  const handleToggleMember = (member: Member) => {
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
        return {
          memberId: id,
          name: member ? formatFullName(member) : "Unknown",
          attended: true,
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
        className="sm:max-w-lg w-[95vw] rounded-2xl border-none shadow-xl p-0 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col h-[80vh] max-h-[800px]"
        aria-describedby={descriptionId}
      >
        <div className="p-4 sm:p-6 pb-0 shrink-0 border-b border-zinc-100 dark:border-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white">
              Присъстващи
            </DialogTitle>
            <DialogDescription
              id={descriptionId}
              className="text-xs text-zinc-500 mt-1 line-clamp-1"
            >
              {event?.title || "Събитие"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Търсене..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50 pl-10 text-sm focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 sm:p-4 space-y-1">
            {sortedMembers.length > 0 ? (
              sortedMembers.map((member) => {
                const isPresent = attendeeIds.has(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleMember(member)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all cursor-pointer group ${
                      isPresent
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-zinc-50 text-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center transition-all shrink-0 ${
                          isPresent
                            ? "bg-primary border-primary text-white"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {isPresent && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                      <span className="text-sm font-medium truncate">
                        {formatFullName(member)}
                      </span>
                    </div>
                    {isPresent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 px-1.5 py-0.5 rounded text-primary">
                        Тук
                      </span>
                    )}
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

        <DialogFooter className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 shrink-0">
          <div className="flex items-center justify-between w-full">
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
                className="h-9 rounded-lg px-6 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
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
