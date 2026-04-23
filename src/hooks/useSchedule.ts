'use client';

import { useState, useCallback } from 'react';
import { ScheduleEvent } from '@/types';
import {
  getEventsByMemberId,
  addScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
  toggleEventAttendance,
} from '@/services/schedule-service';
import { useToast } from '@/hooks/use-toast';

export const useSchedule = (memberId: string) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!memberId) return;
    try {
      setLoading(true);
      const fetchedEvents = await getEventsByMemberId(memberId);
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error fetching schedule',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [memberId, toast]);

  const addEvent = async (event: Omit<ScheduleEvent, 'id'>) => {
    try {
      const newEvent = await addScheduleEvent(event);
      setEvents((prevEvents) => [newEvent, ...prevEvents]);
      toast({ title: 'Event Added', description: 'The new event has been added successfully.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({ title: 'Error Adding Event', description: errorMessage, variant: 'destructive' });
    }
  };

  const updateEvent = async (eventId: string, event: Partial<ScheduleEvent>) => {
    try {
      const updatedEvent = await updateScheduleEvent(eventId, event);
      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === eventId ? updatedEvent : e))
      );
      toast({ title: 'Event Updated', description: 'The event has been updated successfully.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({ title: 'Error Updating Event', description: errorMessage, variant: 'destructive' });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteScheduleEvent(eventId);
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
      toast({ title: 'Event Deleted', description: 'The event has been deleted successfully.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({ title: 'Error Deleting Event', description: errorMessage, variant: 'destructive' });
    }
  };

  const toggleAttendance = async (eventId: string, memberId: string) => {
    try {
      const updatedEvent = await toggleEventAttendance(eventId, memberId);
      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === eventId ? updatedEvent : e))
      );
      toast({ title: 'Attendance Updated', description: 'Your attendance has been updated.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({ title: 'Error Updating Attendance', description: errorMessage, variant: 'destructive' });
    }
  };

  return { events, loading, error, fetchEvents, addEvent, updateEvent, deleteEvent, toggleAttendance };
};
