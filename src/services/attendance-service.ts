'use client';

import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getDb } from '@/lib/firebase'; 
import { ScheduleEvent } from '@/types';

const db = getDb(); // Get the database instance by calling the function

/**
 * Fetches all schedule events that a specific member is associated with.
 * This represents their attendance history.
 * @param memberId The ID of the member.
 * @returns A promise that resolves to an array of schedule events.
 */
export const getAttendancesByMemberId = async (memberId: string): Promise<ScheduleEvent[]> => {
  if (!memberId) {
    console.error("Member ID is required to fetch attendances.");
    return [];
  }

  try {
    const eventsCollectionRef = collection(db, 'events');

    // Query for events where the memberId is in the 'attendeeMemberIds' array.
    // This finds every event the member was supposed to attend.
    const q = query(
      eventsCollectionRef,
      where('attendeeMemberIds', 'array-contains', memberId),
      orderBy('startDate', 'desc') // Show the most recent events first
    );

    const querySnapshot = await getDocs(q);

    const attendances = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleEvent[];

    return attendances;
  } catch (error) {
    console.error(`Error fetching attendances for member ${memberId}:`, error);
    // Return an empty array to prevent the UI from crashing on error.
    return [];
  }
};
