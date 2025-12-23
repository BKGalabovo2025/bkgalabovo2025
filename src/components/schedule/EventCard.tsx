
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Member, ScheduleEvent, ScheduleEventType } from '@/types';
import { format, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';
import { MoreVertical, Edit, Trash2, Users, Printer } from 'lucide-react';

const eventTypeDetails: Record<ScheduleEventType, { translation: string; color: string }> = {
    trening: { translation: 'Тренировка', color: 'blue' },
    sastezanie: { translation: 'Състезание', color: 'green' },
    lager: { translation: 'Лагер', color: 'purple' },
    sabitie: { translation: 'Събитие', color: 'red' },
};

interface EventCardProps {
    event: ScheduleEvent;
    members: Member[];
    onEdit: (event: ScheduleEvent) => void;
    onDelete: (eventId: string) => void;
    onManageAttendees: (event: ScheduleEvent) => void;
    onPrint: (event: ScheduleEvent) => void;
}

const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
        return format(parseISO(dateString), 'PPP p', { locale: bg });
    } catch {
        return 'Невалидна дата';
    }
};

const getBadgeColor = (type: ScheduleEventType): string => {
    return eventTypeDetails[type]?.color || 'gray';
};

export function EventCard({ event, members, onEdit, onDelete, onManageAttendees, onPrint }: EventCardProps) {
    const { id, title, type, startDate, endDate, location, description, attendees } = event;
    
    const getAttendeeNames = (attendeeIds: string[] = []): string => {
        if (!attendeeIds || attendeeIds.length === 0) return "Няма записани участници";
        return attendeeIds.map(id => {
            const member = members.find(m => m.id === id);
            return member ? `${member.firstName} ${member.lastName}` : '(неизвестен)';
        }).join(', ');
    };

    const badgeColor = getBadgeColor(type);
    const eventTypeTranslation = eventTypeDetails[type]?.translation || type;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-row justify-between items-start">
                <div>
                    <Badge variant="default" className={`bg-${badgeColor}-500 hover:bg-${badgeColor}-600`}>
                        {eventTypeTranslation}
                    </Badge>
                    <CardTitle className="mt-2 text-xl font-bold">{title}</CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => onManageAttendees(event)}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Присъствия</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(event)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Редактиране</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrint(event)}>
                            <Printer className="mr-2 h-4 w-4" />
                            <span>Принтиране</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(id)} className="text-red-500 focus:text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Изтриване</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <div>
                    <p className="text-sm font-semibold text-gray-700">Начало:</p>
                    <p className="text-sm text-gray-500">{formatDate(startDate)}</p>
                </div>
                {endDate && (
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Край:</p>
                        <p className="text-sm text-gray-500">{formatDate(endDate)}</p>
                    </div>
                )}
                {location && (
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Място:</p>
                        <p className="text-sm text-gray-500">{location}</p>
                    </div>
                )}
                {attendees && attendees.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-gray-700">Присъстващи ({attendees.length}):</p>
                        <p className="text-sm text-gray-500 truncate" title={getAttendeeNames(attendees)}>{getAttendeeNames(attendees)}</p>
                    </div>
                )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-gray-400 truncate w-full" title={description}>{description || "Няма допълнително описание."}</p>
            </CardFooter>
        </Card>
    );
}
