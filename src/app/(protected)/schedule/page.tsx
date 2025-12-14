
'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventDropArg } from '@fullcalendar/interaction';
import { ScheduleEvent } from '@/types';
import { getScheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from '@/services/schedule-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EventForm, EventFormData } from '@/components/schedule/event-form';
import { useToast } from '@/hooks/use-toast';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core/index.js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const SchedulePage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<ScheduleEvent> | undefined>(undefined);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await getScheduleEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      toast({ title: 'Грешка при зареждане на събитията', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
        setSelectedEvent(event);
        setIsModalOpen(true);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    try {
        await updateScheduleEvent(event.id, { start: event.startStr, end: event.endStr });
        toast({ title: 'Събитието е актуализирано успешно!' });
        fetchEvents();
    } catch (error) {
        toast({ title: 'Грешка при актуализация', description: (error as Error).message, variant: 'destructive' });
        dropInfo.revert(); // Revert the change on failure
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
  };

  const handleSaveEvent = async (data: EventFormData) => {
    setIsSaving(true);
    try {
      if (selectedEvent?.id) {
        // Update existing event
        await updateScheduleEvent(selectedEvent.id, data);
        toast({ title: 'Събитието е записано успешно!' });
      } else {
        // Create new event
        await addScheduleEvent(data);
        toast({ title: 'Събитието е създадено успешно!' });
      }
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      toast({ title: 'Грешка при запис', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent?.id) {
        setIsSaving(true);
        try {
            await deleteScheduleEvent(selectedEvent.id);
            toast({ title: 'Събитието е изтрито.' });
            handleCloseModal();
            fetchEvents();
        } catch (error) {
            toast({ title: 'Грешка при изтриване', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">График и събития</h1>
        <Button onClick={() => {
            setSelectedEvent({ start: new Date().toISOString() });
            setIsModalOpen(true);
        }}>Добави събитие</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="p-4 bg-white rounded-lg shadow">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            editable={true}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="auto"
            locale="bg"
            buttonText={{
              today: 'Днес',
              month: 'Месец',
              week: 'Седмица',
              day: 'Ден',
            }}
          />
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.id ? 'Редакция на събитие' : 'Ново събитие'}</DialogTitle>
          </DialogHeader>
          <EventForm 
            event={selectedEvent} 
            onSave={handleSaveEvent} 
            onClose={handleCloseModal} 
            isSaving={isSaving}
          />
          {selectedEvent?.id && (
            <DialogFooter className='pt-4'>
                <Button variant="destructive" onClick={handleDeleteEvent} disabled={isSaving}>Изтрий</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;
