import { getDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { ScheduleEvent, Attendee } from "@/types";

const EVENTS_COLLECTION = "events";

interface AttendeeData {
  memberId: string;
  name: string;
  attended: boolean;
}

const docToScheduleEvent = (doc: DocumentSnapshot): ScheduleEvent | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};

  const attendees = (Array.isArray(data.attendees) ? data.attendees : [])
    .map((item: AttendeeData): Attendee | null => {
      if (!item || typeof item !== "object") return null;
      return {
        memberId: typeof item.memberId === "string" ? item.memberId : "",
        name: typeof item.name === "string" ? item.name : "Anonymous",
        attended: typeof item.attended === "boolean" ? item.attended : false,
      };
    })
    .filter(Boolean) as Attendee[];

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "Untitled Event",
    description: typeof data.description === "string" ? data.description : "",
    startDate:
      data.startDate instanceof Timestamp
        ? data.startDate.toDate().toISOString()
        : new Date().toISOString(),
    endDate:
      data.endDate instanceof Timestamp
        ? data.endDate.toDate().toISOString()
        : new Date().toISOString(),
    type: ["training", "competition", "camp", "event", "other"].includes(
      data.type
    )
      ? data.type
      : "other",
    location:
      typeof data.location === "string" ? data.location : "Unknown Location",
    attendees: attendees,
    attendeeMemberIds: Array.isArray(data.attendeeMemberIds)
      ? data.attendeeMemberIds
      : [],
  };
};

export const getEventsByMemberId = async (
  memberId: string
): Promise<ScheduleEvent[]> => {
  const db = getDb();
  const eventsCollection = collection(db, EVENTS_COLLECTION);

  // The query is simplified to avoid needing a composite index.
  // Sorting will be handled in the application code.
  const q = query(
    eventsCollection,
    where("attendeeMemberIds", "array-contains", memberId)
  );

  const snapshot = await getDocs(q);

  const events = snapshot.docs
    .map(docToScheduleEvent)
    .filter(Boolean) as ScheduleEvent[];

  // Sort events by date in descending order (newest first)
  events.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return events;
};
