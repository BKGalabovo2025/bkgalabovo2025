
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { ScheduleEvent } from '@/types';
import { useToast } from '@/components/ui/use-toast';

type NewEvent = Omit<ScheduleEvent, 'id'>;

const toISOStringOrUndefined = (date: any): string | undefined => {
    if (!date) return undefined;
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    return date;
};

export const useEvents = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const eventsCollection = collection(db, 'events');
        const q = query(eventsCollection, orderBy('startDate', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: toISOStringOrUndefined(data.startDate),
                    endDate: toISOStringOrUndefined(data.endDate),
                } as ScheduleEvent;
            });
            setEvents(eventsData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching events:", err);
            setError(err);
            setIsLoading(false);
            toast({
                title: "Грешка при зареждане на събитията",
                description: "Не може да се установи връзка със сървъра.",
                variant: "destructive",
            });
        });

        return () => unsubscribe();
    }, [toast]);

    const addEvent = useCallback(async (event: NewEvent) => {
        try {
            await addDoc(collection(db, 'events'), event);
            toast({
                title: "Събитието е създадено успешно",
                description: `"${event.title}" беше добавено към графика.`,
            });
        } catch (err) {
            console.error("Error adding event:", err);
            toast({
                title: "Грешка при добавяне на събитие",
                description: "Действието се провали. Моля, опитайте отново.",
                variant: "destructive",
            });
            throw err;
        }
    }, [toast]);
    
    const addMultipleEvents = useCallback(async (events: NewEvent[]) => {
        const batch = writeBatch(db);
        const eventsCollection = collection(db, 'events');
        events.forEach(event => {
            const docRef = doc(eventsCollection);
            batch.set(docRef, event);
        });
        try {
            await batch.commit();
            toast({
                title: "Графикът е генериран",
                description: `Успешно бяха създадени ${events.length} събития.`,
            });
        } catch (err) {
            console.error("Error adding multiple events:", err);
            toast({
                title: "Грешка при генериране на графика",
                description: "Действието се провали. Моля, опитайте отново.",
                variant: "destructive",
            });
            throw err;
        }
    }, [toast]);

    const updateEvent = useCallback(async (eventId: string, eventData: Partial<NewEvent>) => {
        let originalEvents: ScheduleEvent[] = [];

        setEvents(currentEvents => {
            originalEvents = currentEvents;
            const optimisticPayload = {
                ...eventData,
                startDate: toISOStringOrUndefined(eventData.startDate),
                endDate: toISOStringOrUndefined(eventData.endDate),
            };
            return currentEvents.map(e => 
                e.id === eventId ? { ...e, ...optimisticPayload } as ScheduleEvent : e
            );
        });

        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, eventData);
            toast({ title: "Събитието е обновено" });
        } catch (err) {
            setEvents(originalEvents);
            console.error("Error updating event:", err);
            toast({
                title: "Грешка при обновяване",
                description: "Промените не бяха запазени. Моля, опитайте отново.",
                variant: "destructive",
            });
            throw err;
        }
    }, [toast]);

    const deleteEvent = useCallback(async (eventId: string) => {
        let originalEvents: ScheduleEvent[] = [];
        let eventTitle: string | undefined = '';

        setEvents(currentEvents => {
            originalEvents = currentEvents;
            eventTitle = currentEvents.find(e => e.id === eventId)?.title;
            return currentEvents.filter(e => e.id !== eventId);
        });

        try {
            const eventRef = doc(db, 'events', eventId);
            await deleteDoc(eventRef);
            toast({
                title: "Събитието е изтрито",
                description: eventTitle ? `"${eventTitle}" беше премахнато.` : ''
            });
        } catch (err) {
            setEvents(originalEvents);
            console.error("Error deleting event:", err);
            toast({ title: "Грешка при изтриване", variant: "destructive" });
            throw err;
        }
    }, [toast]);
    
    const updateAttendees = useCallback(async (eventId: string, attendeeIds: string[]) => {
        let originalEvents: ScheduleEvent[] = [];
        
        setEvents(currentEvents => {
            originalEvents = currentEvents;
            return currentEvents.map(e => e.id === eventId ? { ...e, attendees: attendeeIds } as ScheduleEvent : e)
        });

        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, { attendees: attendeeIds });
            toast({
                title: "Присъствията са обновени",
                description: "Списъкът с присъстващи е запазен.",
            });
        } catch (err) {
            setEvents(originalEvents);
            console.error("Error updating attendees:", err);
            toast({
                title: "Грешка при обновяване на присъствия",
                variant: "destructive",
            });
            throw err;
        }
    }, [toast]);

    return { events, addEvent, addMultipleEvents, updateEvent, deleteEvent, updateAttendees, isLoading, error };
};
