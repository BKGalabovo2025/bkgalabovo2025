// This component is designed specifically for printing.
import React from 'react';
import { ScheduleEvent, Member } from '@/types';
import { format, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';

interface PrintableEventProps {
    event: ScheduleEvent;
    members: Member[];
}

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
        return format(parseISO(dateStr), "d MMMM yyyy 'г.', HH:mm 'ч.'", { locale: bg });
    } catch {
        return 'Невалидна дата';
    }
};

// This is now a simple functional component, no need for forwardRef.
export const PrintableEvent: React.FC<PrintableEventProps> = ({ event, members }) => {
    if (!event) return null;

    const attendeeNames = (event.attendees || [])
        .map(attendeeId => {
            const member = members.find(m => m.id === attendeeId);
            return member ? `${member.firstName} ${member.lastName}` : null;
        })
        .filter(Boolean)
        .join(', ');

    return (
        <div className="p-4 font-sans text-sm">
            <h1 className="text-xl font-bold mb-4 border-b pb-2">Детайли за събитието</h1>
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                <p className="font-semibold col-span-1">Заглавие:</p>
                <p className="col-span-2">{event.title}</p>

                <p className="font-semibold col-span-1">Начало:</p>
                <p className="col-span-2">{formatDate(event.start)}</p>

                <p className="font-semibold col-span-1">Край:</p>
                <p className="col-span-2">{formatDate(event.end)}</p>

                <p className="font-semibold col-span-1">Място:</p>
                <p className="col-span-2">{event.location || 'Няма посочено'}</p>

                <p className="font-semibold col-span-1">Тип:</p>
                <p className="col-span-2">{event.type || 'Няма посочен'}</p>

                {attendeeNames && (
                    <>
                        <p className="font-semibold col-span-1 mt-2">Присъстващи:</p>
                        <p className="col-span-2 mt-2">{attendeeNames}</p>
                    </>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-6 pt-2 border-t">Генерирано на: {format(new Date(), "d MMMM yyyy 'г.' HH:mm 'ч.'", { locale: bg })}</p>
        </div>
    );
};
