/* eslint-disable sonarjs/no-nested-conditional */
import {
  getDocs,
  query,
  where,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ScheduleEvent, Attendee, ScheduleEventType } from "@/types";
import { toISOStringOrUndefined } from "@/lib/date-utils";
import { getEventsQuery } from "@/lib/firebase-collections";

export const docToScheduleEvent = (
  doc: DocumentSnapshot | QueryDocumentSnapshot
): ScheduleEvent | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};

  const attendees = (Array.isArray(data.attendees) ? data.attendees : [])
    .map((item: Omit<Attendee, "id">): Attendee | null => {
      if (!item || typeof item !== "object") return null;
      return {
        memberId: typeof item.memberId === "string" ? item.memberId : "",
        name: typeof item.name === "string" ? item.name : "Anonymous",
        attended: typeof item.attended === "boolean" ? item.attended : false,
        paymentStatus: item.paymentStatus,
        paymentType: item.paymentType,
        paymentDate: item.paymentDate,
        saleId: item.saleId,
      };
    })
    .filter(Boolean) as Attendee[];

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "Untitled Event",
    description: typeof data.description === "string" ? data.description : "",
    startDate:
      toISOStringOrUndefined(data.startDate) || new Date().toISOString(),
    endDate: toISOStringOrUndefined(data.endDate) || new Date().toISOString(),
    type: (["training", "competition", "camp", "event", "other"].includes(
      data.type
    )
      ? data.type
      : data.title === "РўСЂРµРЅРёСЂРѕРІРєР°"
        ? "training"
        : "other") as ScheduleEventType,
    location:
      typeof data.location === "string" ? data.location : "Unknown Location",
    attendees: attendees,
    attendeeMemberIds: Array.isArray(data.attendeeMemberIds)
      ? data.attendeeMemberIds
      : [],
  };
};

/**
 * РР·РІР»РёС‡Р° РІСЃРёС‡РєРё СЃСЉР±РёС‚РёСЏ Р·Р° РґР°РґРµРЅ РїРµСЂРёРѕРґ.
 * @param startDate РќР°С‡Р°Р»РЅР° РґР°С‚Р°.
 * @param endDate РљСЂР°Р№РЅР° РґР°С‚Р°.
 * @returns РњР°СЃРёРІ РѕС‚ СЃСЉР±РёС‚РёСЏ.
 */
export const getEventsForPeriod = async (
  startDate: Date,
  endDate: Date
): Promise<ScheduleEvent[]> => {
  console.log(
    `getEventsForPeriod: Querying from ${startDate.toISOString()} to ${endDate.toISOString()}`
  );
  const q = query(
    getEventsQuery(),
    where("startDate", ">=", startDate.toISOString()),
    where("startDate", "<=", endDate.toISOString())
  );

  const snapshot = await getDocs(q);

  const events = snapshot.docs
    .map(docToScheduleEvent)
    .filter(Boolean) as ScheduleEvent[];

  return events;
};

export const getEventsByMemberId = async (
  memberId: string
): Promise<ScheduleEvent[]> => {
  const q = query(
    getEventsQuery(),
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

