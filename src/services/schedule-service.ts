
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { ScheduleEvent } from '@/types';

const scheduleCollectionRef = collection(db, 'scheduleEvents');

const getEventColor = (type: string) => {
    switch (type) {
        case 'training': return '#6d28d9';
        case 'competition': return '#be123c';
        case 'camp': return '#047857';
        case 'event': return '#c2410c';
        default: return '#4b5563';
    }
}

const fromFirestore = (doc: any): ScheduleEvent | null => {
    const data = doc.data();
    // Rigorous check for data integrity
    if (!data.title || !data.start || !data.end || !(data.start instanceof Timestamp) || !(data.end instanceof Timestamp)) {
        console.warn(`Skipping invalid event document due to missing or invalid fields: ${doc.id}`);
        return null;
    }
    const startDate = data.start.toDate();
    const endDate = data.end.toDate();
    // Critical validation to prevent RangeError
    if (startDate >= endDate) {
        console.warn(`Skipping event with end date before start date: ${doc.id}`);
        return null;
    }
    return {
        id: doc.id,
        title: data.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: data.type,
        description: data.description,
        coach: data.coach,
        location: data.location,
        color: data.color || getEventColor(data.type),
    };
};

export const getScheduleEvents = async (): Promise<ScheduleEvent[]> => {
    try {
        const snapshot = await getDocs(scheduleCollectionRef);
        // Process documents and filter out any null (invalid) entries
        return snapshot.docs.reduce((acc: ScheduleEvent[], doc) => {
            const event = fromFirestore(doc);
            if (event) acc.push(event);
            return acc;
        }, []);
    } catch (error) {
        console.error("Error fetching schedule events: ", error);
        throw new Error('Failed to fetch events from the database.');
    }
};

const validateAndPrepareEvent = (eventData: Omit<ScheduleEvent, 'id'> | Partial<ScheduleEvent>) => {
    const start = eventData.start ? new Date(eventData.start) : null;
    const end = eventData.end ? new Date(eventData.end) : null;

    // Centralized validation before any database operation
    if (start && end && start >= end) {
        throw new Error('Event end time must be after start time.');
    }

    const preparedData: any = { ...eventData };
    if (start) preparedData.start = Timestamp.fromDate(start);
    if (end) preparedData.end = Timestamp.fromDate(end);
    if (eventData.type && !eventData.color) preparedData.color = getEventColor(eventData.type);

    // Remove non-firestore fields from the final object
    delete preparedData.id; 

    return preparedData;
}

export const addScheduleEvent = async (eventData: Omit<ScheduleEvent, 'id'>) => {
    try {
        const newEvent = validateAndPrepareEvent(eventData);
        const docRef = await addDoc(scheduleCollectionRef, newEvent);
        return docRef.id;
    } catch (error) {
        console.error("Error adding schedule event: ", error);
        throw error;
    }
};

export const addMultipleScheduleEvents = async (eventsData: Omit<ScheduleEvent, 'id'>[]) => {
    try {
        const batch = writeBatch(db);
        eventsData.forEach(eventData => {
            // The same robust validation is applied to each event in the batch
            const newEvent = validateAndPrepareEvent(eventData);
            const docRef = doc(collection(db, "scheduleEvents"));
            batch.set(docRef, newEvent);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding multiple schedule events: ", error);
        throw error;
    }
};

export const updateScheduleEvent = async (id: string, eventData: Partial<ScheduleEvent>) => {
    try {
        const updatedEvent = validateAndPrepareEvent(eventData);
        const eventRef = doc(db, 'scheduleEvents', id);
        await updateDoc(eventRef, updatedEvent);
    } catch (error) {
        console.error("Error updating schedule event: ", error);
        throw error;
    }
};

export const deleteScheduleEvent = async (id: string) => {
    try {
        const eventRef = doc(db, 'scheduleEvents', id);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error("Error deleting schedule event: ", error);
        throw new Error('Failed to delete event from the database.');
    }
};
