'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
// renderToString is now loaded dynamically
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarPlus, Loader2 } from 'lucide-react';
import { EventCard } from '@/components/schedule/EventCard';
import { CreateEventDialog } from '@/components/schedule/CreateEventDialog';
import { EditEventDialog } from '@/components/schedule/EditEventDialog';
import { AttendeesDialog } from '@/components/schedule/AttendeesDialog';
import { MonthlyScheduleDialog } from '@/components/schedule/MonthlyScheduleDialog';
import { PrintableEvent } from '@/components/schedule/PrintableEvent';
import { ScheduleEvent, Member } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/components/ui/use-toast";

export default function SchedulePage() {
    const { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, updateAttendees, isLoading: isLoadingEvents, error: eventsError } = useEvents();
    const { members, isLoading: isLoadingMembers, error: membersError } = useMembers();
    const { toast } = useToast();
    
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isAttendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isMonthlyDialogOpen, setMonthlyDialogOpen] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

    // --- Final, Correct, DOM-less, Dynamically Imported Print Logic ---
    const triggerPrint = async (event: ScheduleEvent) => {
        // 1. Dynamically import renderToString to avoid CJS/ESM conflicts.
        const { renderToString } = await import('react-dom/server');

        // 2. Generate HTML string directly from the component, in memory.
        const printableComponent = <PrintableEvent event={event} members={members as Member[]} />;
        const printContent = renderToString(printableComponent);

        // 3. Open a new window.
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({ title: "Грешка при принтиране", description: "Прозорецът за печат е блокиран от браузъра. Моля, разрешете изскачащите прозорци.", variant: "destructive" });
            return;
        }

        // 4. Gather all current styles from the main document.
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
        const stylesHTML = styles.map(style => style.outerHTML).join('');

        // 5. Write the styles and the generated HTML to the new window.
        printWindow.document.write(`
            <html>
                <head>
                    <title>Печат на събитие</title>
                    ${stylesHTML}
                </head>
                <body style="margin: 20px;">
                    ${printContent}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // 6. Trigger the browser's print dialog and then close the window.
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // --- Event Handlers & Dialog Openers ---
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
    
    const isLoading = isLoadingEvents || isLoadingMembers;
    const error = eventsError || membersError;

    return (
        <div className="container mx-auto p-4">
            {/* No hidden print container is needed anymore. */}

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
                            onPrint={triggerPrint}
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
                allMembers={members as Member[]} 
            />
            <MonthlyScheduleDialog
                isOpen={isMonthlyDialogOpen}
                onClose={() => setMonthlyDialogOpen(false)}
                onGenerate={handleGenerateMonthly}
            />

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
