/* eslint-disable sonarjs/no-nested-conditional */
import {
  DocumentSnapshot,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";

import { toISOStringOrUndefined } from "@/lib/date-utils";
import { getEventsQuery } from "@/lib/firebase-collections";
import { Attendee, ScheduleEvent, ScheduleEventType } from "@/types";

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
        // Camp-specific fields
        campDepositPaid: item.campDepositPaid,
        campDepositSaleId: item.campDepositSaleId,
        campRemainderPaid: item.campRemainderPaid,
        campRemainderSaleId: item.campRemainderSaleId,
        campInsurancePaid: item.campInsurancePaid,
        campInsuranceSaleId: item.campInsuranceSaleId,
        campPriceOverride: item.campPriceOverride,
        campMedicalProvided: item.campMedicalProvided,
        campRoom: item.campRoom,
        isGuest: item.isGuest,
        guestName: item.guestName,
        isCampLeader: item.isCampLeader,
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
    isCancelled: !!data.isCancelled,
    totalCampPrice: data.totalCampPrice,
    campInsurancePrice: data.campInsurancePrice,
    campSessions: Array.isArray(data.campSessions) ? data.campSessions : [],
  };
};

import { doc, updateDoc } from "firebase/firestore";

import { getDb } from "@/lib/firebase";

export const updateCampSessions = async (
  id: string,
  sessions: import("@/types").CampSession[]
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  const eventRef = doc(db, "events", id);
  // Firestore rejects `undefined` values — strip them by serialising through JSON
  const sanitized = JSON.parse(
    JSON.stringify(sessions)
  ) as import("@/types").CampSession[];
  await updateDoc(eventRef, { campSessions: sanitized });
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

export const getCamps = async (): Promise<ScheduleEvent[]> => {
  const q = query(getEventsQuery(), where("type", "==", "camp"));

  const snapshot = await getDocs(q);

  const events = snapshot.docs
    .map(docToScheduleEvent)
    .filter(Boolean) as ScheduleEvent[];

  events.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return events;
};

export const getEventById = async (
  id: string
): Promise<ScheduleEvent | null> => {
  const q = query(getEventsQuery(), where("__name__", "==", id));

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return docToScheduleEvent(snapshot.docs[0]);
};
