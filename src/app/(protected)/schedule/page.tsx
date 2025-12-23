'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { PlusCircle, Repeat, Loader2 } from 'lucide-react';
import { EventCard } from '@/components/schedule/EventCard';
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

const eventTypeTranslations: Record<ScheduleEventType, string> = {
    trening: 'Тренировка',
    sastezanie: 'Състезание',
    lager: 'Лагер',
    sabitie: 'Събитие',
};

export default function SchedulePage() {
    const { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, updateAttendees, isLoading: isLoadingEvents, error: eventsError } = useEvents();
    const { members, isLoading: isLoadingMembers, error: membersError } = useMembers();
    const { toast } = useToast();
    
    const [activeTab, setActiveTab] = useState('upcoming');
    const [filterType, setFilterType] = useState<ScheduleEventType | 'all'>('all');

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isAttendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

    const triggerPrint = async (event: ScheduleEvent) => {
        const { renderToString } = await import('react-dom/server');
        const printableComponent = <PrintableEvent event={event} members={members as Member[]} />;
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

    const filteredAndSortedEvents = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return events
            .filter(event => event.startDate && !isNaN(new Date(event.startDate).getTime()))
            .filter(event => {
                const eventStartDate = new Date(event.startDate);
                const isUpcoming = eventStartDate >= now;

                if (activeTab === 'upcoming' && !isUpcoming) return false;
                if (activeTab === 'past' && isUpcoming) return false;
                if (filterType !== 'all' && event.type !== filterType) return false;

                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.startDate).getTime();
                const dateB = new Date(b.startDate).getTime();
                return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
            });
    }, [events, activeTab, filterType]);
    
    const isLoading = isLoadingEvents || isLoadingMembers;
    const error = eventsError || membersError;

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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <TabsList>
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

                <TabsContent value="upcoming">
                   {renderEventsGrid(filteredAndSortedEvents, isLoading, error)}
                </TabsContent>
                <TabsContent value="past">
                    {renderEventsGrid(filteredAndSortedEvents, isLoading, error)}
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

    function renderEventsGrid(eventsToShow: ScheduleEvent[], isLoading: boolean, error: Error | null) {
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

        if (eventsToShow.length === 0) {
            return (
                <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4">
                    <h3 className="text-xl font-semibold">
                        {filterType === 'all' 
                            ? `Няма ${activeTab === 'upcoming' ? 'предстоящи' : 'минали'} събития`
                            : `Няма ${activeTab === 'upcoming' ? 'предстоящи' : 'минали'} събития от тип "${eventTypeTranslations[filterType as ScheduleEventType]}"`}
                    </h3>
                    <p className="text-muted-foreground mt-2">Можете да промените филтрите или да създадете ново събитие.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsToShow.map(event => (
                    <EventCard 
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
        );
    }
}
