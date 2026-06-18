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
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/context/auth-context";
import { getAllRecoveryServices } from "@/services/club-service";
import { ClubService } from "@/types";

import { AgendaReservationItem } from "./agenda-reservation-item";
import { AgendaBlockedItem } from "./agenda-blocked-item";

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
