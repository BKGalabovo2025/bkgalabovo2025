"use client";

import { useEffect, useState, useMemo } from "react";
import { Reservation, BlockedSlot } from "@/types/reservation";
import {
  subscribeToReservationsForDay,
  subscribeToBlockedSlotsForDay,
} from "@/lib/reservations";
import {
  deleteReservationAction,
  deleteBlockedSlotAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Trash2,
  Pencil,
  Lock,
  Clock,
  User,
  Phone,
  Tag,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ReservationDialog } from "./reservation-dialog";
import { BlockSlotDialog } from "./block-slot-dialog";
import { DonationReceiptDialog } from "./donation-receipt-dialog";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { getAllRecoveryServices } from "@/services/club-service";
import { ClubService } from "@/types";

interface AgendaViewProps {
  date: Date;
  courtCount: number;
  refreshKey: number;
  mode?: "courts" | "recovery";
}

type AgendaItem =
  | { type: "reservation"; data: Reservation }
  | { type: "blocked"; data: BlockedSlot };

export function AgendaView({
  date,
  courtCount,
  refreshKey: _refreshKey,
  mode,
}: AgendaViewProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ClubService[]>([]);
  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();

  const effectiveBranch = mode === "recovery" ? "recoveryzone" : activeBranch;

  useEffect(() => {
    if (mode === "recovery") {
      getAllRecoveryServices().then((data) => setServices(data));
    }
  }, [mode]);

  useEffect(() => {
    const unsubReservations = subscribeToReservationsForDay(
      date,
      (res) => {
        setReservations(res);
        setIsLoading(false);
      },
      effectiveBranch
    );

    const unsubBlocked = subscribeToBlockedSlotsForDay(
      date,
      (slots) => {
        setBlockedSlots(slots);
        setIsLoading(false);
      },
      effectiveBranch
    );

    return () => {
      unsubReservations();
      unsubBlocked();
    };
  }, [date, effectiveBranch]);

  const sortedItems = useMemo(() => {
    const items: AgendaItem[] = [
      ...reservations.map((r) => ({ type: "reservation" as const, data: r })),
      ...blockedSlots.map((s) => ({ type: "blocked" as const, data: s })),
    ];

    return items.sort((a, b) => {
      const timeA = a.data.startTime.toDate().getTime();
      const timeB = b.data.startTime.toDate().getTime();
      if (timeA !== timeB) return timeA - timeB;
      // Secondary sort by court
      const courtA =
        (a.type === "reservation" ? a.data.courtId : a.data.courtIds[0]) ?? 0;
      const courtB =
        (b.type === "reservation" ? b.data.courtId : b.data.courtIds[0]) ?? 0;
      return courtA - courtB;
    });
  }, [reservations, blockedSlots]);

  const handleDeleteReservation = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await deleteReservationAction(token, id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Грешка при изтриване.");
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await deleteBlockedSlotAction(token, id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Грешка при изтриване.");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await markReservationAsPaidAction(token, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Грешка при актуализиране на плащане.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-10 w-10 animate-spin text-primary/30"
            strokeWidth={1.5}
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
            Синхронизиране...
          </p>
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800">
          <Clock className="w-6 h-6 text-zinc-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">
          Няма планирани събития
        </h3>
        <p className="text-zinc-400 text-sm max-w-xs mx-auto">
          За избраната дата няма открити резервации или блокирани часове.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      {sortedItems.map((item, index) => {
        const isReservation = item.type === "reservation";
        const data = item.data;
        const startTime = data.startTime.toDate();
        const endTime = data.endTime.toDate();

        return (
          <div
            key={isReservation ? data.id : `blocked-${data.id}-${index}`}
            className={cn(
              "group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-4xl border transition-all duration-300",
              isReservation
                ? "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-primary/20 hover:shadow-xl hover:shadow-black/5"
                : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 border-dashed"
            )}
          >
            {/* Time Column */}
            <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:w-32 shrink-0">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-4 h-4" strokeWidth={2.5} />
                <span className="font-black text-sm tracking-tight">
                  {startTime.toLocaleTimeString("bg-BG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 md:hidden" />
              <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                до{" "}
                {endTime.toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isReservation && (data as Reservation).bufferAfter ? (
                <span className="text-[9px] text-amber-500/80 font-bold tracking-tight">
                  + {(data as Reservation).bufferAfter} мин. почистване
                </span>
              ) : null}
            </div>

            {/* Content Column */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
              {/* Court Badge */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center min-w-12 h-12 px-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-black/10">
                  <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">
                    {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
                  </span>
                  <span className="text-sm font-bold leading-none whitespace-nowrap">
                    {isReservation
                      ? effectiveBranch === "bkgalabovo"
                        ? (data as Reservation).courtId
                        : (() => {
                            const res = data as Reservation;
                            const svcName =
                              res.serviceName ||
                              services.find((s) => s.id === res.serviceId)
                                ?.name;
                            return svcName
                              ? `${svcName}${res.selectedZone ? ` (${res.selectedZone})` : ""}`
                              : "Услуга";
                          })()
                      : (data as BlockedSlot).courtIds.length > 0
                        ? `Корт ${(data as BlockedSlot).courtIds.join(", ")}`
                        : "Всички кортове"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {isReservation ? (
                      effectiveBranch === "bkgalabovo" ? (
                        <User className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-primary" />
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-zinc-400" />
                    )}
                    <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                      {isReservation
                        ? (data as Reservation).client2Name
                          ? `${(data as Reservation).clientName} & ${(data as Reservation).client2Name}`
                          : (data as Reservation).clientName
                        : (data as BlockedSlot).title}
                    </h4>
                  </div>
                  {isReservation && (
                    <div className="flex items-center gap-4 text-zinc-500 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 opacity-50" />
                        {(data as Reservation).client2Phone
                          ? `${(data as Reservation).clientPhone} / ${(data as Reservation).client2Phone}`
                          : (data as Reservation).clientPhone}
                      </div>
                      {(data as Reservation).clientEmail && (
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Tag className="w-3 h-3 opacity-50" />
                          {(data as Reservation).clientEmail}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Price */}
              <div className="md:ml-auto flex items-center gap-6">
                {isReservation ? (
                  <>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                        Статус
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                          (data as Reservation).status === "paid"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800"
                        )}
                      >
                        {(data as Reservation).status === "paid"
                          ? "Платено"
                          : "Неплатено"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end min-w-[80px]">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
                        Сума
                      </span>
                      <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                        {formatPrice(
                          (data as Reservation).totalPrice ??
                            (data as Reservation).price ??
                            0
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Блокиран период
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-900">
              {isReservation && (data as Reservation).status !== "paid" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-all"
                  onClick={() => handleMarkAsPaid(data.id)}
                  title="Маркирай като платено"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              )}

              {isReservation && (data as Reservation).status === "paid" && (
                <DonationReceiptDialog reservation={data as Reservation}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all"
                    title="Издай документ"
                  >
                    <FileText className="w-5 h-5" />
                  </Button>
                </DonationReceiptDialog>
              )}

              {isReservation ? (
                <ReservationDialog
                  reservation={data as Reservation}
                  mode={mode}
                  onSave={() => {}}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <Pencil className="w-4 h-4 text-zinc-400" />
                  </Button>
                </ReservationDialog>
              ) : (
                <BlockSlotDialog
                  slot={data as BlockedSlot}
                  courtCount={courtCount}
                  onSave={() => {}}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <Pencil className="w-4 h-4 text-zinc-400" />
                  </Button>
                </BlockSlotDialog>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all"
                onClick={() =>
                  isReservation
                    ? handleDeleteReservation(data.id)
                    : handleDeleteBlockedSlot(data.id)
                }
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
