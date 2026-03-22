
import { getDb } from "@/lib/firebase";
import {
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, DocumentSnapshot
} from "firebase/firestore";
import { ScheduleEvent, Attendee } from '@/types';

const EVENTS_COLLECTION = 'events';

interface AttendeeData {
    memberId: string;
    name: string;
    attended: boolean;
}

const docToScheduleEvent = (doc: DocumentSnapshot): ScheduleEvent | null => {
    if (!doc.id || !doc.exists()) return null;
    const data = doc.data() || {};

    const attendees = (Array.isArray(data.attendees) ? data.attendees : []).map((item: AttendeeData): Attendee | null => {
        if (!item || typeof item !== 'object') return null;
        return {
            memberId: typeof item.memberId === 'string' ? item.memberId : '',
            name: typeof item.name === 'string' ? item.name : 'Anonymous',
            attended: typeof item.attended === 'boolean' ? item.attended : false,
        };
    }).filter(Boolean) as Attendee[];

    return {
        id: doc.id,
        title: typeof data.title === 'string' ? data.title : 'Untitled Event',
        description: typeof data.description === 'string' ? data.description : '',
        startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : new Date().toISOString(),
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : new Date().toISOString(),
        type: ['training', 'competition', 'camp', 'event', 'other'].includes(data.type) ? data.type : 'other',
        location: typeof data.location === 'string' ? data.location : 'Unknown Location',
        attendees: attendees,
        attendeeMemberIds: Array.isArray(data.attendeeMemberIds) ? data.attendeeMemberIds : [],
    };
};

const getScheduleEvents = async (): Promise<ScheduleEvent[]> => {
    const db = getDb();
    const eventsCollection = collection(db, EVENTS_COLLECTION);
    const q = query(eventsCollection, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToScheduleEvent).filter(Boolean) as ScheduleEvent[];
};

const getScheduleEventById = async (eventId: string): Promise<ScheduleEvent | null> => {
    const db = getDb();
    const eventDoc = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    return docToScheduleEvent(eventDoc);
};


const addScheduleEvent = async (eventData: Omit<ScheduleEvent, 'id'>): Promise<string> => {
    const db = getDb();
    const dataWithTimestamps = {
        ...eventData,
        startDate: Timestamp.fromDate(new Date(eventData.startDate)),
        endDate: Timestamp.fromDate(new Date(eventData.endDate)),
        attendeeMemberIds: (eventData.attendees || []).map(a => a.memberId),
    };
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), dataWithTimestamps);
    return docRef.id;
};

const updateScheduleEvent = async (eventId: string, eventData: Partial<Omit<ScheduleEvent, 'id'>>): Promise<void> => {
    const db = getDb();
    const eventDoc = doc(db, EVENTS_COLLECTION, eventId);
    const dataToUpdate: { [key: string]: unknown } = { ...eventData };
    if (eventData.startDate) {
        dataToUpdate.startDate = Timestamp.fromDate(new Date(eventData.startDate));
    }
    if (eventData.endDate) {
        dataToUpdate.endDate = Timestamp.fromDate(new Date(eventData.endDate));
    }
    if (eventData.attendees) {
        dataToUpdate.attendeeMemberIds = eventData.attendees.map(a => a.memberId);
    }
    await updateDoc(eventDoc, dataToUpdate);
};

const deleteScheduleEvent = async (eventId: string): Promise<void> => {
    const db = getDb();
    const eventDoc = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventDoc);
};

export const getEventsByMemberId = async (memberId: string): Promise<ScheduleEvent[]> => {
    const db = getDb();
    const eventsCollection = collection(db, EVENTS_COLLECTION);
    
    // The query is simplified to avoid needing a composite index.
    // Sorting will be handled in the application code.
    const q = query(
        eventsCollection,
        where("attendeeMemberIds", "array-contains", memberId)
    );
    
    const snapshot = await getDocs(q);
    
    const events = snapshot.docs.map(docToScheduleEvent).filter(Boolean) as ScheduleEvent[];

    // Sort events by date in descending order (newest first)
    events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return events;
};
