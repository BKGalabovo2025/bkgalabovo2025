'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, Loader2 } from 'lucide-react';
import { EventCard } from '@/components/schedule/EventCard';
import { CreateEventDialog } from '@/components/schedule/CreateEventDialog';
import { EditEventDialog } from '@/components/schedule/EditEventDialog';
import { AttendeesDialog } from '@/components/schedule/AttendeesDialog';
import { MonthlyScheduleDialog } from '@/components/schedule/MonthlyScheduleDialog';
import { PrintableEvent } from '@/components/schedule/PrintableEvent'; // Import the printable component
import { ScheduleEvent, Member } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SchedulePage() {
    const { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, updateAttendees, isLoading: isLoadingEvents, error: eventsError } = useEvents();
    const { members, isLoading: isLoadingMembers, error: membersError } = useMembers();
    
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isAttendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

    // --- Print Logic ---
    const printRef = useRef<HTMLDivElement>(null);
    const [eventToPrint, setEventToPrint] = useState<ScheduleEvent | null>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => setEventToPrint(null), // Clean up after printing
    });

    const triggerPrint = (event: ScheduleEvent) => {
        setEventToPrint(event);
        // The `useReactToPrint` hook needs a moment for the state to update
        // and the component to render before it can be triggered.
        setTimeout(handlePrint, 100);
    };

    // --- Event Handlers ---
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

    // --- Dialog Openers ---
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
    
    const isLoading = isLoadingEvents || isLoadingMembers;
    const error = eventsError || membersError;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h1 className="text-3xl font-bold">График на събитията</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setMonthlyDialogOpen(true)}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Генерирай месечен
                    </Button>
                     <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Създай събитие
                    </Button>
                </div>
            </div>

            {/* Hidden component for printing */}
            <div className="hidden">
                {eventToPrint && <PrintableEvent ref={printRef} event={eventToPrint} members={members as Member[]} />}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Зареждане на данни...</span>
                </div>
            )}
            {error && <p className="text-red-500">Грешка при зареждане: {error.message}</p>}

            {!isLoading && events.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Няма предстоящи събития</h3>
                    <p className="text-muted-foreground mt-2">Натиснете бутоните, за да създадете ново събитие или да генерирате график.</p>
                </div>
            )}

            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <EventCard 
                            key={event.id} 
                            event={event} 
                            members={members as Member[]}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                            onManageAttendees={openAttendeesDialog}
                            onPrint={triggerPrint} // Pass print handler
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <CreateEventDialog 
                isOpen={isCreateDialogOpen} 
                onClose={() => setCreateDialogOpen(false)} 
                onAddEvent={handleAddEvent} 
            />
            <EditEventDialog 
                isOpen={isEditDialogOpen} 
                onClose={() => setEditDialogOpen(false)} 
                event={selectedEvent}
                onUpdateEvent={handleUpdateEvent}
            />
            <AttendeesDialog
                isOpen={isAttendeesDialogOpen}
                onClose={() => setAttendeesDialogOpen(false)}
                event={selectedEvent}
                onUpdateAttendees={handleUpdateAttendees}
                allMembers={members as Member[]} // Pass all members to the dialog
            />
            <MonthlyScheduleDialog
                isOpen={isMonthlyDialogOpen}
                onClose={() => setMonthlyDialogOpen(false)}
                onGenerate={handleGenerateMonthly}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Наистина ли искате да изтриете това събитие?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Това действие не може да бъде отменено. Данните за събитието ще бъдат изтрити перманентно.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
