'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Reservation, BlockedSlot } from '@/types/reservation';
import {
    getReservationsForDay, 
    getBlockedSlotsForDay, 
    deleteReservation, 
    deleteBlockedSlot
} from '@/lib/reservations';
import { cn } from '@/lib/utils';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ReservationDialog } from './reservation-dialog';
import { BlockSlotDialog } from './block-slot-dialog';


// --- Helper Functions & Constants --- //
const AGENDA_START_HOUR = 8;
const HOUR_HEIGHT_REM = 6;
const hours = Array.from({ length: 15 }, (_, i) => AGENDA_START_HOUR + i);

const calculateEventStyle = (startTime: Timestamp, endTime: Timestamp) => {
  const start = startTime.toDate();
  const end = endTime.toDate();
  const startOffsetMinutes = (start.getHours() - AGENDA_START_HOUR) * 60 + start.getMinutes();
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

const ReservationCard: React.FC<CardProps<Reservation>> = ({ item, onDelete, onSave }) => {
  const style = calculateEventStyle(item.startTime, item.endTime);
  const startTimeStr = item.startTime.toDate().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = item.endTime.toDate().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });

  const statusClasses = {
    paid: 'bg-green-100/80 border-green-500 text-green-800',
    unpaid: 'bg-yellow-100/80 border-yellow-500 text-yellow-800',
    cancelled: 'bg-red-100/80 border-red-500 text-red-800 opacity-70',
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Сигурни ли сте, че искате да изтриете тази резервация?")) {
          onDelete(item.id);
      }
  }

  return (
    <div
      className={cn("absolute w-[95%] left-1/2 -translate-x-1/2 p-2 rounded-lg border text-xs leading-tight shadow-md transition-all duration-300 group", statusClasses[item.status])}
      style={style}
    >
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex">
        <ReservationDialog reservation={item} onSave={onSave}>
             <Button variant="ghost" size="icon" className="w-6 h-6">
                <Pencil className="w-4 h-4 text-blue-500" />
            </Button>
        </ReservationDialog>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
      <p className="font-bold">{item.clientName}</p>
      <p>{startTimeStr} - {endTimeStr}</p>
      <p className="font-semibold capitalize mt-1">{item.status === 'paid' ? 'Платено' : 'Неплатено'}</p>
    </div>
  );
};

const BlockedSlotCard: React.FC<CardProps<BlockedSlot> & {courtCount: number}> = ({ item, onDelete, onSave, courtCount }) => {
  const style = calculateEventStyle(item.startTime, item.endTime);

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Сигурни ли сте, че искате да изтриете този блокиран слот?")) {
          onDelete(item.id);
      }
  }

  return (
    <div
      className="absolute w-[95%] left-1/2 -translate-x-1/2 p-2 rounded-lg border bg-slate-200/80 border-slate-400 text-slate-600 text-xs leading-tight shadow-inner group"
      style={style}
    >
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex">
        <BlockSlotDialog slot={item} onSave={onSave} courtCount={courtCount}>
            <Button variant="ghost" size="icon" className="w-6 h-6">
                <Pencil className="w-4 h-4 text-blue-500" />
            </Button>
        </BlockSlotDialog>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
      <p className="font-bold text-center">{item.title}</p>
    </div>
  );
};

// --- Main Component --- //

interface AgendaViewProps {
    date: Date;
    courtCount: number;
    key: number; // Used for forcing re-renders
}

export const AgendaView: React.FC<AgendaViewProps> = ({ date, courtCount, key }) => {
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
      }
      finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [date, refreshId, key]); // Rerun on date, parent key, or internal refresh change

  const handleDataChange = () => setRefreshId(prev => prev + 1);

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
    const grouped: { [key: number]: { reservations: Reservation[]; blockedSlots: BlockedSlot[] } } = {};
    for (let i = 1; i <= courtCount; i++) {
      grouped[i] = { reservations: [], blockedSlots: [] };
    }
    events.reservations.forEach(res => {
      if (grouped[res.courtId]) grouped[res.courtId].reservations.push(res);
    });
    events.blockedSlots.forEach(slot => {
        const courtsToBlock = slot.courtIds.length > 0 ? slot.courtIds : Array.from({length: courtCount}, (_, i) => i + 1);
        courtsToBlock.forEach(courtId => {
            if (grouped[courtId]) grouped[courtId].blockedSlots.push(slot);
        });
    });
    return grouped;
  }, [events, courtCount]);

  return (
    <div className="grid grid-cols-[auto,1fr] border-t border-l border-border mt-4 bg-muted/20 relative">
      {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20"><Loader2 className="w-8 h-8 animate-spin"/></div>}
      <div className="flex flex-col">
        {hours.map(hour => <div key={hour} className="h-24 text-right pr-2 pt-1 text-xs text-muted-foreground border-b border-r border-border bg-background">{`${String(hour).padStart(2, '0')}:00`}</div>)}
      </div>
      <div style={{ gridTemplateColumns: `repeat(${courtCount}, 1fr)`}} className="grid w-full">
        {Object.keys(eventsByCourt).map(courtIdStr => {
          const courtId = parseInt(courtIdStr, 10);
          const courtEvents = eventsByCourt[courtId];

          return (
            <div key={courtId} className="flex flex-col border-r border-border relative">
              <div className="text-center font-semibold py-2 border-b border-border sticky top-0 bg-background/95 z-10">Корт {courtId}</div>
              <div className='relative'>
                {hours.map(hour => <div key={hour} className="h-24 border-b border-border/60"></div>)}
                {courtEvents.reservations.map(res => <ReservationCard key={res.id} item={res} onDelete={handleDeleteReservation} onSave={handleDataChange}/>)}
                {courtEvents.blockedSlots.map(slot => <BlockedSlotCard key={slot.id} item={slot} onDelete={handleDeleteBlockedSlot} onSave={handleDataChange} courtCount={courtCount}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
