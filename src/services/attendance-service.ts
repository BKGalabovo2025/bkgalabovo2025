"use client";

import { query, where, getDocs, orderBy } from "firebase/firestore";
import { getEventsCollection } from "@/lib/firebase-collections";
import { ScheduleEvent } from "@/types";

/**
 * Fetches all schedule events that a specific member is associated with.
 * This represents their attendance history.
 * @param memberId The ID of the member.
 * @returns A promise that resolves to an array of schedule events.
 */
export const getAttendancesByMemberId = async (
  memberId: string
): Promise<ScheduleEvent[]> => {
  if (!memberId) {
    console.error("Member ID is required to fetch attendances.");
    return [];
  }

  try {
    // Query for events where the memberId is in the 'attendeeMemberIds' array.
    // This finds every event the member was supposed to attend.
    const q = query(
      getEventsCollection(),
      where("attendeeMemberIds", "array-contains", memberId),
      orderBy("startDate", "desc") // Show the most recent events first
    );

    const querySnapshot = await getDocs(q);

    const attendances = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as ScheduleEvent[];

    return attendances;
  } catch (error) {
    console.error(`Error fetching attendances for member ${memberId}:`, error);
    // Return an empty array to prevent the UI from crashing on error.
    return [];
  }
};
