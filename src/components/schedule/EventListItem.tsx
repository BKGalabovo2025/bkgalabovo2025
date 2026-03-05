'use client';

import React from 'react';
import { ScheduleEvent, Member, ScheduleEventType, Attendee } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Users, Printer, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EventListItemProps {
    event: ScheduleEvent;
    members: Member[];
    onEdit: (event: ScheduleEvent) => void;
    onDelete: (eventId: string) => void;
    onManageAttendees: (event: ScheduleEvent) => void;
    onPrint: (event: ScheduleEvent) => void;
}

const eventTypeDetails: Record<ScheduleEventType, { translation: string; color: string }> = {
    training: { translation: 'Тренировка', color: 'bg-blue-500' },
    competition: { translation: 'Състезание', color: 'bg-red-500' },
    camp: { translation: 'Лагер', color: 'bg-green-500' },
    event: { translation: 'Събитие', color: 'bg-yellow-500' },
    other: { translation: 'Друго', color: 'bg-gray-500' },
};

const getInitials = (name: string) => {
    if (!name) {
        return '??';
    }
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export const EventListItem: React.FC<EventListItemProps> = ({ event, members, onEdit, onDelete, onManageAttendees, onPrint }) => {
    const { translation, color } = eventTypeDetails[event.type] || { translation: 'Събитие', color: 'bg-gray-500' };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const dayOfWeek = d.toLocaleDateString('bg-BG', { weekday: 'short' });
        return `${day}.${month}.${year} (${dayOfWeek})`;
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    };

    const attendees: (Member & { attended: boolean })[] = (event.attendees || []).map((attendee: Attendee) => {
        const member = members.find(m => m.id === attendee.memberId);
        return member ? { ...member, attended: attendee.attended } : null;
    }).filter(Boolean) as (Member & { attended: boolean })[];

    const MAX_VISIBLE_AVATARS = 5;
    const visibleAttendees = attendees.slice(0, MAX_VISIBLE_AVATARS);
    const hiddenAttendeesCount = attendees.length - visibleAttendees.length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4 flex-grow">
                    <div className={`w-2 h-12 rounded-full ${color}`}></div>
                    <div className="flex-grow">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                            <div className="flex items-center gap-1"><CalendarIcon size={14} /><span>{formatDate(event.startDate)}</span></div>
                            <div className="flex items-center gap-1"><Clock size={14} /><span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span></div>
                            <div className="flex items-center gap-1"><Tag size={14} /><span>{translation}</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onManageAttendees(event)} title="Управление на присъстващи"><Users className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onPrint(event)} title="Принтирай"><Printer className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(event)} title="Редактирай"><Edit className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)} title="Изтрий"><Trash2 className="h-5 w-5 text-red-500" /></Button>
                </div>
            </div>
            {attendees.length > 0 && (
                 <div 
                    className="px-3 pb-2 pt-1 border-t border-gray-200 dark:border-gray-700 mt-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => onManageAttendees(event)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onManageAttendees(event);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    <strong className="text-sm font-medium">Присъстващи:</strong>
                    <div className="flex items-center -space-x-2">
                        <TooltipProvider>
                            {visibleAttendees.map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 border-2 border-white dark:border-gray-800">
                                            {getInitials(member.name)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name || 'Име липсва'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                        {hiddenAttendeesCount > 0 && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center text-xs font-bold text-gray-800 dark:text-gray-100 border-2 border-white dark:border-gray-800">
                                +{hiddenAttendeesCount}
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </div>
    );
};
