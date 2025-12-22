
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { ScheduleEvent } from '@/types';

const eventsCollection = collection(db, 'events');

/**
 * Fetches all events a specific member has attended.
 * @param memberId The ID of the member.
 * @returns A promise that resolves to an array of ScheduleEvent objects.
 */
export const getEventsByMemberId = async (memberId: string): Promise<ScheduleEvent[]> => {
    const q = query(
        eventsCollection, 
        where("attendees", "array-contains", memberId),
        orderBy("startDate", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }) as ScheduleEvent);
};
