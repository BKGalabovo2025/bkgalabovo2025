'use client';

import React from 'react';
import { ScheduleEvent, ScheduleEventType } from '@/types';
import { Badge } from '@/components/ui/badge';

interface AttendanceListProps {
  events: ScheduleEvent[];
}

// Обект за превод на типовете събития
const eventTypeTranslations: Record<ScheduleEventType, string> = {
  training: 'Тренировка',
  sastezanie: 'Състезание',
  lager: 'Лагер',
  sabitie: 'Събитие',
};

// Функция за форматиране на датата
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('bg-BG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AttendanceList: React.FC<AttendanceListProps> = ({ events }) => {
  if (events.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Няма данни за присъствия.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 flex justify-between items-start">
          <div>
            <h3 className="font-bold">{event.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(event.startDate)} - {new Date(event.endDate).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {event.location && <p className="text-sm text-gray-500 dark:text-gray-400">Локация: {event.location}</p>}
            {event.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{event.description}</p>}
          </div>
          <Badge variant="outline">{eventTypeTranslations[event.type] || event.type}</Badge>
        </div>
      ))}
    </div>
  );
};

export default AttendanceList;
