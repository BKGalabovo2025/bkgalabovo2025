import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { getSiteConfig } from "@/config/sites";
import { Reservation, BlockedSlot } from "@/types/reservation";

const db = getDb();
const reservationsCollection = collection(db, "reservations");
const blockedSlotsCollection = collection(db, "blockedSlots");

// --- Helper Functions --- //

const getDayBoundaries = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    startOfDay: Timestamp.fromDate(startOfDay),
    endOfDay: Timestamp.fromDate(endOfDay),
  };
};

// --- Public API --- //

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getReservationsForDay = async (
  date: Date,
  siteId?: string
): Promise<Reservation[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    reservationsCollection,
    where("siteId", "==", siteId || getSiteConfig().id),
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Reservation, "id">),
  }));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deleteReservation = async (reservationId: string) => {
  const docRef = doc(db, "reservations", reservationId);
  await deleteDoc(docRef);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getBlockedSlotsForDay = async (
  date: Date,
  siteId?: string
): Promise<BlockedSlot[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    blockedSlotsCollection,
    where("siteId", "==", siteId || getSiteConfig().id),
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<BlockedSlot, "id">),
  }));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deleteBlockedSlot = async (slotId: string) => {
  const docRef = doc(db, "blockedSlots", slotId);
  await deleteDoc(docRef);
};

export const subscribeToReservationsForDay = (
  date: Date,
  callback: (reservations: Reservation[]) => void,
  siteId?: string
) => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    reservationsCollection,
    where("siteId", "==", siteId || getSiteConfig().id),
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const reservations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Reservation, "id">),
      }));
      callback(reservations);
    },
    (err) => {
      console.error("Error subscribing to reservations:", err);
    }
  );
};

export const subscribeToBlockedSlotsForDay = (
  date: Date,
  callback: (slots: BlockedSlot[]) => void,
  siteId?: string
) => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    blockedSlotsCollection,
    where("siteId", "==", siteId || getSiteConfig().id),
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const slots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<BlockedSlot, "id">),
      }));
      callback(slots);
    },
    (err) => {
      console.error("Error subscribing to blocked slots:", err);
    }
  );
};
