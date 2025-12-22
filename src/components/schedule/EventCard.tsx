"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Users, Printer, Calendar as CalendarIcon, MapPin, Dumbbell, Trophy, Tent, Sparkles } from "lucide-react";
import { ScheduleEvent, Member, ScheduleEventType } from '@/types';
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

// Enhanced details object with icons and colors
const eventTypeDetails: Record<ScheduleEventType, { 
    translation: string; 
    icon: React.ElementType;
    badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary';
    bgColor: string;
    iconColor: string;
}> = {
    trening: { translation: 'Тренировка', icon: Dumbbell, badgeVariant: 'default', bgColor: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400' },
    sastezanie: { translation: 'Състезание', icon: Trophy, badgeVariant: 'destructive', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    lager: { translation: 'Лагер', icon: Tent, badgeVariant: 'secondary', bgColor: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400' },
    sabitie: { translation: 'Събитие', icon: Sparkles, badgeVariant: 'outline', bgColor: 'bg-purple-100 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-400' },
};

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
    const details = eventTypeDetails[event.type] || { translation: event.type, icon: CalendarIcon, badgeVariant: 'outline', bgColor: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400' };
    const IconComponent = details.icon;

    const attendeeNames = (event.attendees || [])
        .map(attendeeId => {
            const member = members.find(m => m.id === attendeeId);
            return member ? `${member.firstName} ${member.lastName}` : null;
        })
        .filter(name => name !== null);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                    {/* Icon and Title section */}
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${details.bgColor}`}>
                            <IconComponent className={`w-6 h-6 ${details.iconColor}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <CardTitle className="text-lg font-bold leading-tight">{event.title}</CardTitle>
                                <Badge variant={details.badgeVariant}>{details.translation}</Badge>
                            </div>
                            <div className="grid gap-1 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" /> 
                                    <span>{formatDateRange(event.startDate, event.endDate)}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-2 shrink-0">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(event)}><Edit className="mr-2 h-4 w-4" /><span>Редактирай</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageAttendees(event)}><Users className="mr-2 h-4 w-4" /><span>Присъстващи</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPrint(event)}><Printer className="mr-2 h-4 w-4" /><span>Принтирай</span></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(event.id)} className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4" /><span>Изтрий</span></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            {(event.description || attendeeNames.length > 0) && (
                <CardContent className="text-sm">
                    {event.description && 
                        <div className="mt-2 pt-4 border-t">
                             <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    }
                    {attendeeNames.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                            <h4 className="font-semibold mb-2">Присъстващи ({attendeeNames.length}):</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-xs">
                                {attendeeNames.join(', ')}
                            </p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
