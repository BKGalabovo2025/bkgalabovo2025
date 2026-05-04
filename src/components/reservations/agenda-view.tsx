"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Reservation, BlockedSlot } from "@/types/reservation";
import {
  getReservationsForDay,
  getBlockedSlotsForDay,
  deleteReservation,
  deleteBlockedSlot,
  getWorkingHours,
  updateReservationStatus,
} from "@/lib/reservations";
import { cn } from "@/lib/utils";
import { 
  Loader2, Trash2, Pencil, Clock, User, 
  CheckCircle2, AlertCircle, Lock, Phone, 
  Coins, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { ReservationDialog } from "./reservation-dialog";
import { BlockSlotDialog } from "./block-slot-dialog";

// --- Sub-components --- //

interface CardProps<T> {
  item: T;
  onDelete: (id: string) => void;
  onSave: () => void;
}

const ReservationTicket: React.FC<CardProps<Reservation>> = ({
  item,
  onDelete,
  onSave,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const startTimeStr = item.startTime
    .toDate()
    .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = item.endTime
    .toDate()
    .toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

  const statusConfig = {
    paid: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-emerald-100 dark:border-emerald-500/10",
      side: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
      label: "Платено",
    },
    unpaid: {
      bg: "bg-white dark:bg-zinc-900",
      border: "border-amber-100 dark:border-amber-500/10",
      side: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      icon: AlertCircle,
      label: "Очаква плащане",
    },
    cancelled: {
      bg: "bg-zinc-50 dark:bg-zinc-950",
      border: "border-rose-100 dark:border-rose-500/10",
      side: "bg-rose-500",
      text: "text-rose-600 dark:text-rose-400",
      icon: User,
      label: "Отказано",
    },
  };

  const config = statusConfig[item.status] || statusConfig.unpaid;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")) {
      onDelete(item.id);
    }
  };

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;

    const newStatus = item.status === "paid" ? "unpaid" : "paid";
    setIsUpdating(true);
    
    try {
      await updateReservationStatus(item.id, newStatus);
      toast.success(newStatus === "paid" ? "Маркирано като платено" : "Променено на очаква плащане");
      onSave();
    } catch (error) {
      toast.error("Грешка при актуализиране на статуса");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={cn(
      "group relative flex flex-col rounded-[2.5rem] border shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden",
      config.bg, config.border
    )}>
      {/* Status Sidebar Accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 group-hover:w-3", config.side)} />
      
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex flex-col min-w-0">
            <h4 className="font-black text-[15px] text-zinc-900 dark:text-white uppercase tracking-tight leading-tight mb-2 break-words">
              {item.clientName}
            </h4>
            <div className="flex items-center gap-2.5 text-zinc-400">
              <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Phone size={12} className="text-blue-500" />
              </div>
              <span className="text-[11px] font-bold tabular-nums tracking-wide">{item.clientPhone}</span>
            </div>
          </div>
          
          <div className="flex gap-1.5 shrink-0">
             <ReservationDialog reservation={item} onSave={onSave}>
              <button className="h-9 w-9 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-200 group/edit">
                <Pencil className="w-4 h-4 text-zinc-400 group-hover/edit:text-blue-600" />
              </button>
            </ReservationDialog>
            <button onClick={handleDelete} className="h-9 w-9 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 group/del">
              <Trash2 className="w-4 h-4 text-zinc-400 group-hover/del:text-rose-600" />
            </button>
          </div>
        </div>

        <div className="space-y-5 mt-auto">
          {/* Time and Price Horizontal Bar */}
          <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700/50">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-blue-500" />
              <span className="text-xs font-black tabular-nums tracking-wider text-zinc-700 dark:text-zinc-300">
                {startTimeStr} — {endTimeStr}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">{item.totalPrice}</span>
                <span className="text-[10px] font-black uppercase text-amber-600/60 tracking-tighter">EUR</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStatusToggle}
            disabled={isUpdating}
            className={cn(
              "group/status relative flex items-center justify-center gap-3 h-12 px-6 rounded-[1.5rem] border-2 transition-all active:scale-95 overflow-hidden",
              item.status === "paid" 
                ? "bg-emerald-500 border-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600" 
                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800",
              "cursor-pointer"
            )}
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin opacity-50" />
            ) : (
              <config.icon className={cn(
                "w-5 h-5 transition-all duration-300 group-hover/status:scale-125 group-hover/status:rotate-12", 
                item.status === "paid" ? "text-white" : config.text
              )} />
            )}
            <span className={cn(
              "text-[11px] font-black uppercase tracking-[0.2em]", 
              item.status === "paid" ? "text-white" : config.text
            )}>
              {config.label}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const BlockedTicket: React.FC<CardProps<BlockedSlot> & { courtCount: number }> = ({ 
  item, onDelete, onSave, courtCount 
}) => {
  const startTimeStr = item.startTime.toDate().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = item.endTime.toDate().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Сигурни ли сте, че искате да изтриете този блокиран слот?")) {
      onDelete(item.id);
    }
  };

  return (
    <div className="group p-5 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 relative overflow-hidden transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900">
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <BlockSlotDialog slot={item} onSave={onSave} courtCount={courtCount}>
          <button className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <Pencil className="w-3 h-3 text-zinc-400 hover:text-blue-500" />
          </button>
        </BlockSlotDialog>
        <button onClick={handleDelete} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm">
          <Trash2 className="w-3 h-3 text-zinc-400 hover:text-rose-500" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
          <Lock className="w-4 h-4 text-zinc-400" />
        </div>
        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400 mb-1 leading-tight px-2">
          {item.title || "Блокирано"}
        </h4>
        <p className="text-[10px] font-bold text-zinc-400 tabular-nums">
          {startTimeStr} — {endTimeStr}
        </p>
      </div>
    </div>
  );
};

// --- Main Component --- //

interface AgendaViewProps {
  date: Date;
  courtCount: number;
  refreshKey: number; 
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  date,
  courtCount,
  refreshKey,
}) => {
  const [events, setEvents] = useState<{ reservations: Reservation[]; blockedSlots: BlockedSlot[] }>({
    reservations: [],
    blockedSlots: [],
  });
  const [workingHours, setWorkingHours] = useState<Record<number, { start: string; end: string; closed?: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshId, setRefreshId] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reservations, blockedSlots, hours] = await Promise.all([
          getReservationsForDay(date),
          getBlockedSlotsForDay(date),
          getWorkingHours(),
        ]);
        setEvents({ reservations, blockedSlots });
        setWorkingHours(hours);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Грешка при зареждане на данните.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [date, refreshId, refreshKey]);

  const handleDataChange = () => setRefreshId((prev) => prev + 1);

  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      toast.success("Резервацията е изтрита.");
      handleDataChange();
    } catch (error) {
      toast.error("Грешка при изтриване.");
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    try {
      await deleteBlockedSlot(id);
      toast.success("Блокираният слот е изтрит.");
      handleDataChange();
    } catch (error) {
      toast.error("Грешка при изтриване.");
    }
  };

  const courtData = useMemo(() => {
    const data: Record<number, { reservations: Reservation[]; blockedSlots: BlockedSlot[] }> = {};
    for (let i = 1; i <= courtCount; i++) {
      data[i] = { reservations: [], blockedSlots: [] };
    }

    events.reservations.forEach(res => {
      if (data[res.courtId]) data[res.courtId].reservations.push(res);
    });

    events.blockedSlots.forEach(slot => {
      const courts = slot.courtIds.length > 0 ? slot.courtIds : Array.from({ length: courtCount }, (_, i) => i + 1);
      courts.forEach(c => {
        if (data[c]) data[c].blockedSlots.push(slot);
      });
    });

    // Sort by time
    Object.keys(data).forEach(cId => {
      const id = parseInt(cId);
      data[id].reservations.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
      data[id].blockedSlots.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
    });

    return data;
  }, [events, courtCount]);

  const todayHours = workingHours[date.getDay()];

  return (
    <div className="mt-4 relative min-h-[600px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-[3rem]">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      )}

      {/* Working Hours Context Bar */}
      <div className="flex items-center justify-center mb-10">
        <div className={cn(
          "px-8 py-3 rounded-full border shadow-sm flex items-center gap-4 transition-all",
          todayHours?.closed 
            ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-900/20" 
            : "bg-blue-50/50 dark:bg-blue-600/5 border-blue-100 dark:border-blue-900/20"
        )}>
          {todayHours?.closed ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Clock className="w-4 h-4 text-blue-600" />}
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">График на залата:</span>
            <span className={cn(
              "text-sm font-black tabular-nums",
              todayHours?.closed ? "text-rose-600" : "text-blue-700 dark:text-blue-400"
            )}>
              {todayHours ? (todayHours.closed ? "ЗАТВОРЕНО" : `${todayHours.start} — ${todayHours.end}`) : "..."}
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <div className="flex items-center gap-2">
            <MapPin size={12} className="text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-500">Основна зала</span>
          </div>
        </div>
      </div>

      {todayHours?.closed ? (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-8 border border-rose-100 dark:border-rose-500/20 shadow-xl shadow-rose-500/10">
            <Lock className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-4xl font-black font-heading text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">
            Клубът е затворен
          </h3>
          <p className="text-zinc-500 text-lg font-medium max-w-[400px]">
            За съжаление за избрания ден няма обявено работно време. Моля, проверете друг ден.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
          {Object.entries(courtData).map(([id, data]) => {
            const courtId = parseInt(id);
            const allEvents = [...data.reservations, ...data.blockedSlots].sort(
              (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
            );

            return (
              <div key={courtId} className="space-y-4">
                {/* Sleek Court Header */}
                <div className="relative p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center group overflow-hidden transition-all hover:border-blue-500/30">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-50 dark:bg-zinc-800" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 group-hover:text-blue-500 transition-colors">Корт</span>
                  <span className="text-2xl font-black font-heading text-zinc-900 dark:text-white">{courtId}</span>
                </div>

                {/* Court Content Container */}
                <div className="min-h-[400px] p-2 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 space-y-3">
                  {allEvents.length > 0 ? (
                    allEvents.map(event => 
                      "clientName" in event ? (
                        <ReservationTicket 
                          key={event.id} 
                          item={event as Reservation} 
                          onDelete={handleDeleteReservation} 
                          onSave={handleDataChange} 
                        />
                      ) : (
                        <BlockedTicket 
                          key={event.id} 
                          item={event as BlockedSlot} 
                          onDelete={handleDeleteBlockedSlot} 
                          onSave={handleDataChange} 
                          courtCount={courtCount}
                        />
                      )
                    )
                  ) : (
                    <div className="h-32 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center opacity-30 transition-all hover:opacity-50">
                      <CheckCircle2 className="w-5 h-5 mb-2 text-zinc-400" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Свободен</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
