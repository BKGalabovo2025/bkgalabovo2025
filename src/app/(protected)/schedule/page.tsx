'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { PlusCircle, Repeat, Loader2 } from 'lucide-react';
import { CreateEventDialog } from '@/components/schedule/CreateEventDialog';
import { EditEventDialog } from '@/components/schedule/EditEventDialog';
import { AttendeesDialog } from '@/components/schedule/AttendeesDialog';
import { MonthlyScheduleDialog } from '@/components/schedule/MonthlyScheduleDialog';
import { PrintableEvent } from '@/components/schedule/PrintableEvent';
import { ScheduleEvent, Member, ScheduleEventType } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventListItem } from '@/components/schedule/EventListItem';

const eventTypeTranslations: Record<ScheduleEventType, string> = {
    training: 'Тренировка',
    sastezanie: 'Състезание',
    lager: 'Лагер',
    sabitie: 'Събитие',
};

const tabTranslations: Record<string, string> = {
    current: 'текущи',
    upcoming: 'предстоящи',
    past: 'минали'
};

const EVENTS_PER_PAGE = 20;

export default function SchedulePage() {
    const { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, updateAttendees, isLoading: isLoadingEvents, error: eventsError } = useEvents();
    const { members, loading: isLoadingMembers, error: membersError } = useMembers();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState('current');
    const [filterType, setFilterType] = useState<ScheduleEventType | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isAttendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const triggerPrint = async (event: ScheduleEvent) => {
        const { renderToString } = await import('react-dom/server');
        const printableComponent = <PrintableEvent event={event} members={members as Member[]} eventTypeTranslations={eventTypeTranslations} />;
        const printContent = renderToString(printableComponent);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({ title: "Грешка при принтиране", description: "Прозорецът за печат е блокиран от браузъра.", variant: "destructive" });
            return;
        }
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
        const stylesHTML = styles.map(style => style.outerHTML).join('');
        printWindow.document.write(`<html><head><title>Печат на събитие</title>${stylesHTML}</head><body style="margin: 20px;">${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleAddEvent = async (newEvent: Omit<ScheduleEvent, 'id' | 'color'>) => {
        await addEvent(newEvent as ScheduleEvent);
    };

    const handleGenerateMonthly = async (newEvents: Omit<ScheduleEvent, 'id'>[]) => {
        await addMultipleEvents(newEvents as ScheduleEvent[]);
    };

    const handleUpdateEvent = async (eventId: string, eventData: Partial<ScheduleEvent>) => {
        await updateEvent(eventId, eventData);
    };
    
    const handleUpdateAttendees = async (eventId: string, attendeeIds: string[]) => {
        await updateAttendees(eventId, attendeeIds);
    };

    const openEditDialog = (event: ScheduleEvent) => {
        setSelectedEvent(event);
        setEditDialogOpen(true);
    };

    const openAttendeesDialog = (event: ScheduleEvent) => {
        setSelectedEvent(event);
        setAttendeesDialogOpen(true);
    };

    const openDeleteDialog = (eventId: string) => {
        setEventToDeleteId(eventId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (eventToDeleteId) {
            await deleteEvent(eventToDeleteId);
        }
        setDeleteDialogOpen(false);
        setEventToDeleteId(null);
    };

    const filteredEvents = useMemo(() => {
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfCurrentMonth.setHours(23, 59, 59, 999);

        const filtered = (events || [])
            .filter(event => event.startDate && !isNaN(new Date(event.startDate).getTime()))
            .filter(event => {
                if (filterType !== 'all' && event.type !== filterType) return false;

                const eventDate = new Date(event.startDate);
                switch (activeTab) {
                    case 'current':
                        return eventDate >= startOfCurrentMonth && eventDate <= endOfCurrentMonth;
                    case 'upcoming':
                        return eventDate > endOfCurrentMonth;
                    case 'past':
                        return eventDate < startOfCurrentMonth;
                    default:
                        return true;
                }
            });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.startDate).getTime();
            const dateB = new Date(b.startDate).getTime();
            return activeTab === 'past' ? dateB - dateA : dateA - dateB;
        });
    }, [events, activeTab, filterType]);

    const paginatedEvents = useMemo(() => {
        if (activeTab !== 'past') return filteredEvents;
        const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
        const endIndex = startIndex + EVENTS_PER_PAGE;
        return filteredEvents.slice(startIndex, endIndex);
    }, [filteredEvents, currentPage, activeTab]);
    
    const isLoading = isLoadingEvents || isLoadingMembers;
    const combinedError = eventsError || membersError;
    let errorObject: Error | null = null;
    if (combinedError) {
        if (typeof combinedError === 'string') {
            errorObject = new Error(combinedError);
        } else {
            errorObject = combinedError;
        }
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h1 className="text-3xl font-bold">График на събитията</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setMonthlyDialogOpen(true)}>
                        <Repeat className="mr-2 h-4 w-4" />
                        Шаблонен график
                    </Button>
                     <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Създай събитие
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="current" className="w-full">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <TabsList>
                        <TabsTrigger value="current">Текущи</TabsTrigger>
                        <TabsTrigger value="upcoming">Предстоящи</TabsTrigger>
                        <TabsTrigger value="past">Минали</TabsTrigger>
                    </TabsList>
                    <div className="w-full sm:w-auto md:w-[240px]">
                         <Select onValueChange={(value) => setFilterType(value as ScheduleEventType | 'all')} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="Филтрирай по тип" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всички типове</SelectItem>
                                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="current">
                   {renderEventsList(filteredEvents, isLoading, errorObject)}
                </TabsContent>
                <TabsContent value="upcoming">
                   {renderEventsList(filteredEvents, isLoading, errorObject)}
                </TabsContent>
                <TabsContent value="past">
                    {renderEventsList(paginatedEvents, isLoading, errorObject, filteredEvents.length)}
                </TabsContent>
            </Tabs>
            
            {/* Dialogs */}
            <CreateEventDialog isOpen={isCreateDialogOpen} onClose={() => setCreateDialogOpen(false)} onAddEvent={handleAddEvent} />
            <EditEventDialog isOpen={isEditDialogOpen} onClose={() => setEditDialogOpen(false)} event={selectedEvent} onUpdateEvent={handleUpdateEvent} />
            <AttendeesDialog isOpen={isAttendeesDialogOpen} onClose={() => setAttendeesDialogOpen(false)} event={selectedEvent} onUpdateAttendees={handleUpdateAttendees} members={members as Member[]} />
            <MonthlyScheduleDialog isOpen={isMonthlyDialogOpen} onClose={() => setMonthlyDialogOpen(false)} onGenerate={handleGenerateMonthly} />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Наистина ли искате да изтриете това събитие?</AlertDialogTitle>
                        <AlertDialogDescription>Това действие не може да бъде отменено.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    function renderEventsList(eventsToShow: ScheduleEvent[], isLoading: boolean, error: Error | null, totalEvents?: number) {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Зареждане на данни...</span>
                </div>
            );
        }

        if (error) {
            return <p className="text-red-500 text-center py-10">Грешка при зареждане: {error.message}</p>;
        }
        
        const finalTotalEvents = totalEvents ?? eventsToShow.length;

        if (finalTotalEvents === 0) {
            return (
                <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4">
                    <h3 className="text-xl font-semibold">
                        {filterType === 'all' 
                            ? `Няма ${tabTranslations[activeTab]} събития`
                            : `Няма ${tabTranslations[activeTab]} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
                    </h3>
                    <p className="text-muted-foreground mt-2">Можете да промените филтрите или да създадете ново събитие.</p>
                </div>
            );
        }
        
        const groupedEvents = (eventsToShow || []).reduce((acc: Record<string, ScheduleEvent[]>, event: ScheduleEvent) => {
            const month = new Date(event.startDate).toLocaleString('bg-BG', { month: 'long', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(event);
            return acc;
        }, {});

        return (
            <div>
                <div className="space-y-6">
                    {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                        <div key={month}>
                            <h2 className="text-xl font-semibold mb-3 capitalize">{month}</h2>
                            <div className="space-y-2">
                                {(monthEvents as ScheduleEvent[]).map((event: ScheduleEvent) => (
                                    <EventListItem 
                                        key={event.id} 
                                        event={event} 
                                        members={members as Member[]}
                                        onEdit={openEditDialog}
                                        onDelete={openDeleteDialog}
                                        onManageAttendees={openAttendeesDialog}
                                        onPrint={triggerPrint}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {activeTab === 'past' && finalTotalEvents > EVENTS_PER_PAGE && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Предишна
                        </Button>
                        <span>
                            Страница {currentPage} от {Math.ceil(finalTotalEvents / EVENTS_PER_PAGE)}
                        </span>
                        <Button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage * EVENTS_PER_PAGE >= finalTotalEvents}
                        >
                            Следваща
                        </Button>
                    </div>
                )}
            </div>
        );
    }
}
