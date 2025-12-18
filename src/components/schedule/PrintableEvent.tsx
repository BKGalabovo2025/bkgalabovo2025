
// This component is designed specifically for printing.
import React from 'react';
import { ScheduleEvent, Member } from '@/types';
import { format, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';

interface PrintableEventProps {
    event: ScheduleEvent | null;
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

export const PrintableEvent = React.forwardRef<HTMLDivElement, PrintableEventProps>(({ event, members }, ref) => {
    if (!event) return null;

    const attendeeNames = (event.attendees || [])
        .map(attendeeId => {
            const member = members.find(m => m.id === attendeeId);
            return member ? `${member.firstName} ${member.lastName}` : null;
        })
        .filter(Boolean)
        .join(', ');

    return (
        <div ref={ref} className="p-8 font-sans">
            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                `}
            </style>
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{event.title}</h1>
                <p className="text-lg text-gray-500">Информация за събитие</p>
            </header>

            <div className="grid grid-cols-3 gap-x-8 text-sm">
                <div className="col-span-3 sm:col-span-1 mb-6">
                    <h3 className="font-semibold text-gray-600 border-b pb-2 mb-3">Тип на събитието</h3>
                    <p className="text-gray-800 capitalize">{event.type}</p>
                </div>
                <div className="col-span-3 sm:col-span-2 mb-6">
                    <h3 className="font-semibold text-gray-600 border-b pb-2 mb-3">Период</h3>
                    <p className="text-gray-800">
                        <strong className="font-medium">От:</strong> {formatDate(event.startDate)}<br/>
                        {event.endDate && <><strong className="font-medium">До:</strong> {formatDate(event.endDate)}</>}
                    </p>
                </div>
            </div>

            {event.location && (
                 <div className="mb-6">
                    <h3 className="font-semibold text-gray-600 border-b pb-2 mb-3">Място</h3>
                    <p className="text-gray-800">{event.location}</p>
                </div>
            )}

            {event.description && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-600 border-b pb-2 mb-3">Описание</h3>
                    <div className="prose prose-sm max-w-none text-gray-800">
                       {event.description}
                    </div>
                </div>
            )}

            {attendeeNames && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-600 border-b pb-2 mb-3">Присъстващи</h3>
                    <p className="text-gray-700 text-xs">{attendeeNames}</p>
                </div>
            )}
        </div>
    );
});

PrintableEvent.displayName = 'PrintableEvent';
