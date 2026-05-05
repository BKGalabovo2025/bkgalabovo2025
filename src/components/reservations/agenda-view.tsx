"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { Reservation, BlockedSlot } from "@/types/reservation";
import {
  getReservationsForDay,
  getBlockedSlotsForDay,
  deleteReservation,
  deleteBlockedSlot,
} from "@/lib/reservations";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ReservationDialog } from "./reservation-dialog";
import { BlockSlotDialog } from "./block-slot-dialog";

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
  const startTimeStr = item.startTime
    .toDate()
    .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = item.endTime
    .toDate()
    .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

  const statusClasses = {
    paid: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50",
    unpaid:
      "bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50",
    cancelled: "bg-slate-50 border-slate-200 text-slate-400 opacity-60",
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
        "absolute w-[92%] left-1/2 -translate-x-1/2 p-3 rounded-xl border text-xs leading-tight transition-all duration-300 group hover:scale-[1.02] hover:shadow-md z-10",
        statusClasses[item.status]
      )}
      style={style}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex bg-white/50 backdrop-blur-sm rounded-lg border border-white/50">
        <ReservationDialog reservation={item} onSave={onSave}>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-white/80 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5 text-primary" />
          </Button>
        </ReservationDialog>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 hover:bg-rose-50 rounded-md"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </Button>
      </div>
      <p className="font-black truncate pr-4">{item.clientName}</p>
      <p className="font-medium mt-0.5 opacity-80">
        {startTimeStr} - {endTimeStr}
      </p>
      <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/50 text-[9px] font-black uppercase tracking-tighter">
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
      className="absolute w-[92%] left-1/2 -translate-x-1/2 p-3 rounded-xl border bg-slate-100 border-slate-300 text-slate-500 text-xs leading-tight shadow-inner group flex flex-col items-center justify-center text-center pattern-diagonal-stripes"
      style={style}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex bg-white/50 backdrop-blur-sm rounded-lg">
        <BlockSlotDialog slot={item} onSave={onSave} courtCount={courtCount}>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 hover:bg-white/80 rounded-md"
          >
            <Pencil className="w-3.5 h-3.5 text-primary" />
          </Button>
        </BlockSlotDialog>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 hover:bg-rose-50 rounded-md"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
        </Button>
      </div>
      <p className="font-black uppercase tracking-tighter opacity-80">
        {item.title}
      </p>
    </div>
  );
};

// --- Main Component --- //

interface AgendaViewProps {
  date: Date;
  courtCount: number;
  refreshKey: number; // Used for forcing re-renders
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  date,
  courtCount,
  refreshKey,
}) => {
  const [events, setEvents] = useState<{
    reservations: Reservation[];
    blockedSlots: BlockedSlot[];
  }>({ reservations: [], blockedSlots: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshId, setRefreshId] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reservations, blockedSlots] = await Promise.all([
          getReservationsForDay(date),
          getBlockedSlotsForDay(date),
        ]);
        setEvents({ reservations, blockedSlots });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Грешка при зареждане на данните.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [date, refreshId, refreshKey]); // Rerun on date, parent key, or internal refresh change

  const handleDataChange = () => setRefreshId((prev) => prev + 1);

  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      toast.success("Резервацията е изтрита.");
      handleDataChange();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Грешка при изтриване на резервацията.");
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    try {
      await deleteBlockedSlot(id);
      toast.success("Блокираният слот е изтрит.");
      handleDataChange();
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
    <div className="grid grid-cols-[auto,1fr] border-t border-l border-border mt-4 bg-muted/20 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      <div className="flex flex-col">
        {hours.map((hour) => (
          <div
            key={hour}
            className="h-24 text-right pr-2 pt-1 text-xs text-muted-foreground border-b border-r border-border bg-background"
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
              className="flex flex-col border-r border-slate-100 relative group/court"
            >
              <div className="text-center font-black py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-20 text-[10px] uppercase tracking-[0.2em] text-slate-400 group-hover/court:text-primary transition-colors">
                Корт {courtId}
              </div>
              <div className="relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-24 border-b border-border/60"
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
