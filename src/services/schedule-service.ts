
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ScheduleEvent } from '@/types';

const scheduleCollectionRef = collection(db, 'scheduleEvents');

/**
 * Converts a Firestore document to a ScheduleEvent object.
 */
const fromFirestore = (doc: any): ScheduleEvent => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        start: (data.start as Timestamp).toDate().toISOString(),
        end: (data.end as Timestamp).toDate().toISOString(),
        type: data.type,
        description: data.description,
        coach: data.coach,
        location: data.location,
    };
};

/**
 * Fetches all schedule events from Firestore.
 */
export const getScheduleEvents = async (): Promise<ScheduleEvent[]> => {
    try {
        const snapshot = await getDocs(scheduleCollectionRef);
        return snapshot.docs.map(fromFirestore);
    } catch (error) {
        console.error("Error fetching schedule events: ", error);
        throw new Error('Failed to fetch events from the database.');
    }
};

/**
 * Adds a new event to the schedule.
 */
export const addScheduleEvent = async (eventData: Omit<ScheduleEvent, 'id'>) => {
    try {
        const newEvent = {
            ...eventData,
            start: new Date(eventData.start),
            end: new Date(eventData.end),
        };
        const docRef = await addDoc(scheduleCollectionRef, newEvent);
        return docRef.id;
    } catch (error) {
        console.error("Error adding schedule event: ", error);
        throw new Error('Failed to add event to the database.');
    }
};

/**
 * Updates an existing schedule event.
 */
export const updateScheduleEvent = async (id: string, eventData: Partial<ScheduleEvent>) => {
    try {
        const eventRef = doc(db, 'scheduleEvents', id);
        const updateData: any = { ...eventData };
        
        // Convert date strings back to Firestore Timestamps if they exist
        if (eventData.start) {
            updateData.start = new Date(eventData.start);
        }
        if (eventData.end) {
            updateData.end = new Date(eventData.end);
        }
        
        await updateDoc(eventRef, updateData);
    } catch (error) {
        console.error("Error updating schedule event: ", error);
        throw new Error('Failed to update event in the database.');
    }
};

/**
 * Deletes a schedule event from Firestore.
 */
export const deleteScheduleEvent = async (id: string) => {
    try {
        const eventRef = doc(db, 'scheduleEvents', id);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error("Error deleting schedule event: ", error);
        throw new Error('Failed to delete event from the database.');
    }
};
