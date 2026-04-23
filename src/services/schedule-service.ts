import { getDb } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  getDoc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ScheduleEvent, Attendee } from "@/types";

const EVENTS_COLLECTION = "events";

interface AttendeeData {
  memberId: string;
  name: string;
  attended: boolean;
}

const docToScheduleEvent = (doc: DocumentSnapshot | QueryDocumentSnapshot): ScheduleEvent | null => {
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

  const q = query(
    eventsCollection,
    where("attendeeMemberIds", "array-contains", memberId)
  );

  const snapshot = await getDocs(q);

  const events = snapshot.docs
    .map(docToScheduleEvent)
    .filter(Boolean) as ScheduleEvent[];

  events.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return events;
};

export const addScheduleEvent = async (event: Omit<ScheduleEvent, 'id'>): Promise<ScheduleEvent> => {
  const db = getDb();
  const eventsCollection = collection(db, EVENTS_COLLECTION);
  const docRef = await addDoc(eventsCollection, event);
  return { id: docRef.id, ...event };
}

export const updateScheduleEvent = async (eventId: string, event: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
  const db = getDb();
  const eventDoc = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventDoc, event);
  const updatedDoc = await getDoc(eventDoc);
  return docToScheduleEvent(updatedDoc)!;
}

export const deleteScheduleEvent = async (eventId: string): Promise<void> => {
  const db = getDb();
  const eventDoc = doc(db, EVENTS_COLLECTION, eventId);
  await deleteDoc(eventDoc);
}

export const toggleEventAttendance = async (eventId: string, memberId: string): Promise<ScheduleEvent> => {
  const db = getDb();
  const eventDoc = doc(db, EVENTS_COLLECTION, eventId);

  await runTransaction(db, async (transaction) => {
    const eventSnapshot = await transaction.get(eventDoc);
    if (!eventSnapshot.exists()) {
      throw new Error("Event not found!");
    }

    const eventData = eventSnapshot.data() as ScheduleEvent;
    const attendee = eventData.attendees.find(a => a.memberId === memberId);

    if (attendee) {
      attendee.attended = !attendee.attended;
    } else {
      // This part might need adjustment based on how members are added to events
      // For now, let's assume we can't add new attendees this way.
      throw new Error("Member not found in event attendees.");
    }

    transaction.update(eventDoc, { attendees: eventData.attendees });
  });

  const updatedDoc = await getDoc(eventDoc);
  return docToScheduleEvent(updatedDoc)!;
}
