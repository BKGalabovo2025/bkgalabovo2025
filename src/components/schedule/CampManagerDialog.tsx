"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Check, Plus, Tent, Hotel, Pill } from "lucide-react";
import { Member, ScheduleEvent, Attendee } from "@/types";
import { formatFullName } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

interface CampManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  members: Member[];
  onUpdateEvent: (
    eventId: string,
    data: Partial<ScheduleEvent>
  ) => Promise<void>;
  onUpdateAttendees: (eventId: string, attendees: Attendee[]) => Promise<void>;
}

export const CampManagerDialog: React.FC<CampManagerDialogProps> = ({
  isOpen,
  onClose,
  event,
  members,
  onUpdateEvent,
  onUpdateAttendees,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendeesMap, setAttendeesMap] = useState<Record<string, Attendee>>(
    {}
  );
  const [totalCampPrice, setTotalCampPrice] = useState<number>(0);
  const [guestNameInput, setGuestNameInput] = useState("");

  useEffect(() => {
    if (event && isOpen) {
      const map: Record<string, Attendee> = {};
      (event.attendees || [])
        .filter((a) => a.attended)
        .forEach((a) => {
          const key = a.memberId || `guest_${Date.now()}_${Math.random()}`;
          map[key] = { ...a, memberId: a.memberId || key };
        });
      setAttendeesMap(map);
      setTotalCampPrice(event.totalCampPrice || 0);
    }
  }, [event, isOpen]);

  const handleToggleMember = (member: Member) => {
    setAttendeesMap((prev) => {
      const next = { ...prev };
      if (next[member.id]) {
        delete next[member.id];
      } else {
        next[member.id] = {
          memberId: member.id,
          name: formatFullName(member),
          attended: true,
          ...(member.isGuest && { isGuest: true }),
        };
      }
      return next;
    });
  };

  const handleAddGuest = () => {
    if (!guestNameInput.trim()) return;
    const guestId = `guest_${Date.now()}`;
    setAttendeesMap((prev) => ({
      ...prev,
      [guestId]: {
        memberId: guestId,
        name: guestNameInput.trim(),
        attended: true,
        isGuest: true,
        guestName: guestNameInput.trim(),
      },
    }));
    setGuestNameInput("");
  };

  const updateAttendeeField = <K extends keyof Attendee>(
    id: string,
    field: K,
    value: Attendee[K]
  ) => {
    setAttendeesMap((prev) => {
      const attendee = prev[id];
      if (!attendee) return prev;
      return {
        ...prev,
        [id]: { ...attendee, [field]: value },
      };
    });
  };

  const handleDepositPayment = async (id: string, amount: number) => {
    if (!event || !user) return;
    const attendee = attendeesMap[id];
    if (!attendee) return;

    const currentDeposit = attendee.campDepositPaid || 0;
    updateAttendeeField(id, "campDepositPaid", currentDeposit + amount);
    toast.success("Капарото е маркирано като платено");
  };

  const handleRemainderPayment = async (id: string) => {
    if (!event || !user) return;
    const attendee = attendeesMap[id];
    if (!attendee) return;

    const attendeePrice = attendee.campPriceOverride ?? totalCampPrice;
    const deposit = attendee.campDepositPaid || 0;
    const remainder = attendeePrice - deposit;
    if (remainder <= 0) return;

    const currentRemainder = attendee.campRemainderPaid || 0;
    updateAttendeeField(id, "campRemainderPaid", currentRemainder + remainder);
    toast.success("Остатъкът е маркиран като платен");
  };

  const handleSubmit = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      if (totalCampPrice !== (event.totalCampPrice || 0)) {
        await onUpdateEvent(event.id, { totalCampPrice });
      }

      const attendeesList = Object.values(attendeesMap);
      await onUpdateAttendees(event.id, attendeesList);
      onClose();
    } catch (error) {
      console.error("Failed to update camp", error);
      toast.error("Грешка при запазване");
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

  const attendeesList = Object.values(attendeesMap);
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
        className="flex h-[90vh] max-h-200 w-[95vw] flex-col overflow-hidden rounded-2xl border-none bg-white p-0 shadow-xl sm:max-w-4xl dark:bg-zinc-950"
        aria-describedby={descriptionId}
      >
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50 p-4 sm:p-6 dark:border-zinc-900 dark:bg-zinc-900/50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Tent className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">
                  Управление на Лагер
                </DialogTitle>
                <DialogDescription
                  id={descriptionId}
                  className="mt-1 line-clamp-1 text-xs text-zinc-500"
                >
                  {event?.title || "Лагер"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-6 flex flex-col items-end justify-between gap-4 sm:flex-row">
            <div className="w-full space-y-1.5 sm:w-1/3">
              <label className="text-xs font-semibold tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                Обща цена (EUR)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={totalCampPrice || ""}
                onChange={(e) => setTotalCampPrice(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="flex w-full gap-2 sm:w-2/3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Търсене на член..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Име на гост..."
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  className="w-40"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddGuest}
                  title="Добави гост"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-8 p-4 sm:p-6">
            {/* Members Search Results (to add to camp) */}
            {searchTerm && (
              <div className="border-b border-zinc-100 pb-4 dark:border-zinc-900">
                <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
                  Резултати от търсенето
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMembers.slice(0, 10).map((member) => {
                    const isPresent = !!attendeesMap[member.id];
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleMember(member)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                          isPresent
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                            : "border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {formatFullName(member)}
                        </span>
                        {isPresent ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Plus className="size-4 text-zinc-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attendees Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">
                Участници ({attendeesList.length})
              </h3>
              <div className="space-y-3">
                {attendeesList.map((attendee) => {
                  const attendeePrice =
                    attendee.campPriceOverride ?? totalCampPrice;
                  const deposit = attendee.campDepositPaid || 0;
                  const remainderPaid = attendee.campRemainderPaid || 0;
                  const remainderToPay = attendeePrice - deposit;
                  const isFullyPaid =
                    deposit > 0 && remainderPaid >= remainderToPay;

                  return (
                    <div
                      key={attendee.memberId}
                      className="flex flex-col items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {/* Info & Medical */}
                      <div className="flex w-full flex-1 items-center gap-4 sm:w-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => {
                            setAttendeesMap((prev) => {
                              const next = { ...prev };
                              delete next[attendee.memberId];
                              return next;
                            });
                          }}
                        >
                          &times;
                        </Button>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {attendee.name}
                            </span>
                            {(attendee.isGuest ||
                              attendee.memberId?.startsWith("guest_")) && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase">
                                Гост
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-4">
                            <label className="group flex cursor-pointer items-center gap-2 text-xs">
                              <Checkbox
                                checked={!!attendee.campMedicalProvided}
                                onCheckedChange={(val) =>
                                  updateAttendeeField(
                                    attendee.memberId,
                                    "campMedicalProvided",
                                    !!val
                                  )
                                }
                              />
                              <span
                                className={`font-medium ${attendee.campMedicalProvided ? "text-emerald-600" : "text-rose-500 group-hover:text-rose-600"}`}
                              >
                                <Pill className="mr-1 inline size-3" />{" "}
                                Медицинско
                              </span>
                            </label>

                            <label className="group flex cursor-pointer items-center gap-2 text-xs">
                              <Checkbox
                                checked={!!attendee.isCampLeader}
                                onCheckedChange={(val) =>
                                  updateAttendeeField(
                                    attendee.memberId,
                                    "isCampLeader",
                                    !!val
                                  )
                                }
                              />
                              <span
                                className={`font-medium ${attendee.isCampLeader ? "text-amber-600" : "text-zinc-500"}`}
                              >
                                Ръководител
                              </span>
                            </label>

                            <div className="flex items-center gap-2">
                              <Hotel className="size-3 text-zinc-400" />
                              <Input
                                placeholder="Стая №"
                                value={attendee.campRoom || ""}
                                onChange={(e) =>
                                  updateAttendeeField(
                                    attendee.memberId,
                                    "campRoom",
                                    e.target.value
                                  )
                                }
                                className="h-6 w-20 px-2 py-0 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Finances */}
                      <div className="mt-4 flex w-full flex-col items-end gap-2 border-t border-zinc-100 pt-4 sm:mt-0 sm:w-auto sm:border-t-0 sm:pt-0 dark:border-zinc-800">
                        {/* Custom Price */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">Цена:</span>
                          <Input
                            type="number"
                            placeholder={totalCampPrice.toString()}
                            value={attendee.campPriceOverride ?? ""}
                            onChange={(e) =>
                              updateAttendeeField(
                                attendee.memberId,
                                "campPriceOverride",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            className="h-7 w-16 text-right font-mono text-xs"
                          />
                        </div>

                        {/* Deposit */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">Капаро:</span>
                          {deposit > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-sm font-medium text-emerald-600">
                                {deposit} €
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() =>
                                  updateAttendeeField(
                                    attendee.memberId,
                                    "campDepositPaid",
                                    0
                                  )
                                }
                                title="Изчисти капарото (Внимание: Не изтрива плащането от Отчети)"
                              >
                                &times;
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="0"
                                className="h-7 w-16 text-right font-mono text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleDepositPayment(
                                      attendee.memberId,
                                      Number(e.currentTarget.value)
                                    );
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    handleDepositPayment(
                                      attendee.memberId,
                                      Number(e.target.value)
                                    );
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Remainder */}
                        {deposit > 0 && attendeePrice > 0 && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500">
                              Остатък:
                            </span>
                            {isFullyPaid ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-sm font-medium text-emerald-600">
                                  Платен
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                  onClick={() =>
                                    updateAttendeeField(
                                      attendee.memberId,
                                      "campRemainderPaid",
                                      0
                                    )
                                  }
                                  title="Изчисти остатъка (Внимание: Не изтрива плащането от Отчети)"
                                >
                                  &times;
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-rose-500">
                                  {remainderToPay} €
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() =>
                                    handleRemainderPayment(attendee.memberId)
                                  }
                                >
                                  Доплати
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {attendeesList.length === 0 && (
                  <div className="rounded-xl border border-dashed py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
                    Няма добавени участници. Изберете от списъка долу или
                    добавете гост.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-6 dark:border-zinc-900">
          <div className="flex w-full items-center justify-between">
            <div className="text-xs font-medium text-zinc-500">
              <span className="text-zinc-900 dark:text-white">
                {attendeesList.length}
              </span>{" "}
              участници
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
