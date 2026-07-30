"use client";

import { Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import {
  deleteBlockedSlotAction,
  deleteReservationAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";
import {
  subscribeToBlockedSlotsForDay,
  subscribeToReservationsForDay,
} from "@/lib/reservations";
import { getAllRecoveryServices } from "@/services/club-service";
import { useAppStore } from "@/store/use-app-store";
import { ClubService } from "@/types";
import { BlockedSlot, Reservation } from "@/types/reservation";

import { AgendaBlockedItem } from "./agenda-blocked-item";
import { AgendaReservationItem } from "./agenda-reservation-item";

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
      <div className="flex min-h-100 w-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="size-10 animate-spin text-primary/30"
            strokeWidth={1.5}
          />
          <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
            Синхронизиране...
          </p>
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <Clock className="size-6 text-zinc-300" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
          Няма планирани събития
        </h3>
        <p className="mx-auto max-w-xs text-sm text-zinc-400">
          За избраната дата няма открити резервации или блокирани часове.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      {sortedItems.map((item, index) => {
        if (item.type === "reservation") {
          return (
            <AgendaReservationItem
              key={item.data.id}
              reservation={item.data}
              services={services}
              effectiveBranch={effectiveBranch}
              mode={mode}
              onMarkAsPaid={handleMarkAsPaid}
              onDelete={handleDeleteReservation}
            />
          );
        }

        return (
          <AgendaBlockedItem
            key={`blocked-${item.data.id}-${index}`}
            slot={item.data}
            effectiveBranch={effectiveBranch}
            courtCount={courtCount}
            onDelete={handleDeleteBlockedSlot}
          />
        );
      })}
    </div>
  );
}
