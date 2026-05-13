"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { Reservation, BlockedSlot } from "@/types/reservation";
import {
  subscribeToReservationsForDay,
  subscribeToBlockedSlotsForDay,
} from "@/lib/reservations";
import {
  deleteReservationAction,
  deleteBlockedSlotAction,
} from "@/lib/actions/reservations";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatTimeRange } from "@/lib/date-utils";
import { ReservationDialog } from "./reservation-dialog";
import { BlockSlotDialog } from "./block-slot-dialog";
import { useAppStore } from "@/store/use-app-store";
import { useAuth } from "@/context/auth-context";

// --- Helper Functions & Constants --- //
const AGENDA_START_HOUR = 8;
const HOUR_HEIGHT_REM = 6;
const hours = Array.from({ length: 15 }, (_, i) => AGENDA_START_HOUR + i);

const calculateEventStyle = (startTime: Timestamp, endTime: Timestamp) => {
  const start = startTime.toDate();
  const end = endTime.toDate();
  const startOffsetMinutes =
    (start.getHours() - AGENDA_START_HOUR) * 60 + start.getMinutes();
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const top = (startOffsetMinutes / 60) * HOUR_HEIGHT_REM;
  const height = (durationMinutes / 60) * HOUR_HEIGHT_REM;
  return { top: `${top}rem`, height: `${height}rem` };
};

// --- Sub-components --- //

interface CardProps<T> {
  item: T;
  onDelete: (id: string) => void;
  onSave: () => void;
}

const ReservationCard: React.FC<CardProps<Reservation>> = ({
  item,
  onDelete,
  onSave,
}) => {
  const style = calculateEventStyle(item.startTime, item.endTime);
  const timeRange = formatTimeRange(
    item.startTime.toDate(),
    item.endTime.toDate()
  );

  const statusClasses = {
    paid: "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 shadow-none",
    unpaid:
      "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20 text-amber-600 shadow-none",
    cancelled:
      "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 opacity-60",
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")
    ) {
      onDelete(item.id);
    }
  };

  return (
    <div
      className={cn(
        "absolute w-[94%] left-1/2 -translate-x-1/2 p-4 rounded-xl border text-[11px] leading-tight transition-all duration-300 group hover:border-primary/30 z-10",
        statusClasses[item.status]
      )}
      style={style}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg border border-zinc-100 dark:border-zinc-800">
        <ReservationDialog reservation={item} onSave={onSave}>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-white dark:hover:bg-zinc-800 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
          </Button>
        </ReservationDialog>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
        </Button>
      </div>
      <p className="font-medium text-zinc-900 text-[13px] truncate pr-8 mb-1">
        {item.clientName}
      </p>
      <p className="font-light text-zinc-500 text-[10px] uppercase tracking-widest">
        {timeRange}
      </p>
      <div className="mt-4 inline-flex items-center px-2 py-0.5 rounded-full bg-white/80 dark:bg-zinc-900/80 text-[8px] font-medium uppercase tracking-widest2 border border-inherit">
        {item.status === "paid" ? "Платено" : "Неплатено"}
      </div>
    </div>
  );
};

const BlockedSlotCard: React.FC<
  CardProps<BlockedSlot> & { courtCount: number }
> = ({ item, onDelete, onSave, courtCount }) => {
  const style = calculateEventStyle(item.startTime, item.endTime);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Сигурни ли сте, че искате да изтриете този блокиран слот?"
      )
    ) {
      onDelete(item.id);
    }
  };

  return (
    <div
      className="absolute w-[94%] left-1/2 -translate-x-1/2 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-900/30 text-zinc-400 text-[10px] leading-tight shadow-none group flex flex-col items-center justify-center text-center pattern-diagonal-stripes border-dashed z-0"
      style={style}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg border border-zinc-100 dark:border-zinc-800">
        <BlockSlotDialog slot={item} onSave={onSave} courtCount={courtCount}>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-white dark:hover:bg-zinc-800 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
          </Button>
        </BlockSlotDialog>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.5} />
        </Button>
      </div>
      <p className="font-medium text-[9px] uppercase tracking-widest3 opacity-40">
        {item.title}
      </p>
    </div>
  );
};

// --- Main Component --- //

interface AgendaViewProps {
  date: Date;
  courtCount: number;
  refreshKey: number; // Used for forcing re-renders (legacy, but kept for compatibility)
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  date,
  courtCount,
  refreshKey: _refreshKey,
}) => {
  const [events, setEvents] = useState<{
    reservations: Reservation[];
    blockedSlots: BlockedSlot[];
  }>({ reservations: [], blockedSlots: [] });
  const [isLoading, setIsLoading] = useState(true);

  const { activeBranch } = useAppStore();
  const { getFreshToken } = useAuth();

  useEffect(() => {
    // Subscribe to reservations
    const unsubReservations = subscribeToReservationsForDay(
      date,
      (reservations) => {
        setEvents((prev) => ({ ...prev, reservations }));
        setIsLoading(false);
      },
      activeBranch
    );

    // Subscribe to blocked slots
    const unsubBlocked = subscribeToBlockedSlotsForDay(
      date,
      (blockedSlots) => {
        setEvents((prev) => ({ ...prev, blockedSlots }));
        setIsLoading(false);
      },
      activeBranch
    );

    return () => {
      unsubReservations();
      unsubBlocked();
    };
  }, [date, activeBranch]); // Re-subscribe when date or activeBranch changes

  const handleDataChange = () => {
    // With real-time listeners, we don't need to do much here,
    // but we can trigger a toast or something if needed.
  };

  const handleDeleteReservation = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await deleteReservationAction(token, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Грешка при изтриване на резервацията.");
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    const token = await getFreshToken(true);
    if (!token) return;
    try {
      const result = await deleteBlockedSlotAction(token, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting blocked slot:", error);
      toast.error("Грешка при изтриване.");
    }
  };

  const eventsByCourt = useMemo(() => {
    const grouped: {
      [key: number]: {
        reservations: Reservation[];
        blockedSlots: BlockedSlot[];
      };
    } = {};
    for (let i = 1; i <= courtCount; i++) {
      grouped[i] = { reservations: [], blockedSlots: [] };
    }
    events.reservations.forEach((res) => {
      if (grouped[res.courtId]) grouped[res.courtId].reservations.push(res);
    });
    events.blockedSlots.forEach((slot) => {
      const courtsToBlock =
        slot.courtIds.length > 0
          ? slot.courtIds
          : Array.from({ length: courtCount }, (_, i) => i + 1);
      courtsToBlock.forEach((courtId) => {
        if (grouped[courtId]) grouped[courtId].blockedSlots.push(slot);
      });
    });
    return grouped;
  }, [events, courtCount]);

  return (
    <div className="grid grid-cols-[auto,1fr] mt-0 bg-white dark:bg-zinc-950 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-20">
          <Loader2
            className="w-10 h-10 animate-spin text-primary opacity-20"
            strokeWidth={1}
          />
        </div>
      )}
      <div className="flex flex-col border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/30">
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-24 w-20 flex items-center justify-center text-[10px] font-medium uppercase tracking-widest2 text-zinc-400 border-b border-zinc-100 dark:border-zinc-900"
          >{`${String(hour).padStart(2, "0")}:00`}</div>
        ))}
      </div>
      <div
        style={{ gridTemplateColumns: `repeat(${courtCount}, 1fr)` }}
        className="grid w-full"
      >
        {Object.keys(eventsByCourt).map((courtIdStr) => {
          const courtId = parseInt(courtIdStr, 10);
          const courtEvents = eventsByCourt[courtId];

          return (
            <div
              key={courtId}
              className="flex flex-col border-r border-zinc-100 dark:border-zinc-900 relative group/court"
            >
              <div className="text-center font-medium py-8 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-20 text-[11px] uppercase tracking-[0.4em] text-zinc-400 group-hover/court:text-primary transition-all">
                Корт {courtId}
              </div>
              <div className="relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-24 border-b border-zinc-100/30 dark:border-zinc-900/30"
                  ></div>
                ))}
                {courtEvents.reservations.map((res) => (
                  <ReservationCard
                    key={res.id}
                    item={res}
                    onDelete={handleDeleteReservation}
                    onSave={handleDataChange}
                  />
                ))}
                {courtEvents.blockedSlots.map((slot) => (
                  <BlockedSlotCard
                    key={slot.id}
                    item={slot}
                    onDelete={handleDeleteBlockedSlot}
                    onSave={handleDataChange}
                    courtCount={courtCount}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
