"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Users, Printer } from "lucide-react";
import { ScheduleEvent, Member } from '@/types';
import { format, parseISO } from 'date-fns';
import { bg } from 'date-fns/locale';

interface EventCardProps {
    event: ScheduleEvent;
    members: Member[];
    onEdit: (event: ScheduleEvent) => void;
    onDelete: (eventId: string) => void;
    onManageAttendees: (event: ScheduleEvent) => void;
    onPrint: (event: ScheduleEvent) => void;
}

const formatDateRange = (start?: string, end?: string | null) => {
    if (!start) return "Няма начална дата";
    
    const startDate = parseISO(start);
    const endDate = end ? parseISO(end) : null;
    const formatStr = "d MMM yyyy, HH:mm 'ч.'";

    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
        return `${format(startDate, formatStr, { locale: bg })} - ${format(endDate, formatStr, { locale: bg })}`;
    } else if (endDate) {
        return `${format(startDate, "d MMM yyyy, HH:mm", { locale: bg })} - ${format(endDate, "HH:mm", { locale: bg })} 'ч.'`;
    } else {
        return format(startDate, formatStr, { locale: bg });
    }
};

export function EventCard({ event, members, onEdit, onDelete, onManageAttendees, onPrint }: EventCardProps) {
    const eventColor = {
        'тренировка': 'bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700',
        'състезание': 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-700',
        'лагер': 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-700',
        'събитие': 'bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700',
    }[event.type] || 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

    const attendeeNames = (event.attendees || [])
        .map(attendeeId => {
            const member = members.find(m => m.id === attendeeId);
            return member ? `${member.firstName} ${member.lastName}` : null;
        })
        .filter(name => name !== null);

    return (
        <Card className={`overflow-hidden ${eventColor}`}>
            <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold">{event.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDateRange(event.startDate, event.endDate)}
                    </CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(event)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Редактирай</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageAttendees(event)}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Присъстващи</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrint(event)}>
                            <Printer className="mr-2 h-4 w-4" />
                            <span>Принтирай</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-500 focus:text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Изтрий</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="text-sm">
                {event.location && <p className="text-gray-700 dark:text-gray-200 mb-2"><strong>Място:</strong> {event.location}</p>}
                {event.description && <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">{event.description}</p>}

                {attendeeNames.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold mb-2">Присъстващи:</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">
                            {attendeeNames.join(', ')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}