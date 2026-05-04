import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  getDoc,
  setDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Reservation, BlockedSlot } from "@/types/reservation";
import { getSalesCollection } from "@/lib/firebase-collections";
import { Sale } from "@/types";

const db = getDb();
export const reservationsCollection = collection(db, "reservations");
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

const checkForConflicts = async (
  startTime: Timestamp,
  endTime: Timestamp,
  courtIds: number[],
  excludeId?: string
): Promise<boolean> => {
  // 1. Check for conflicting reservations
  const reservationQuery = query(
    reservationsCollection,
    where("startTime", "<", endTime)
  );
  const conflictingReservations = await getDocs(reservationQuery);
  for (const doc of conflictingReservations.docs) {
    if (doc.id !== excludeId) {
      const reservation = doc.data();
      if (
        courtIds.includes(reservation.courtId) &&
        reservation.endTime > startTime
      ) {
        console.error("Conflict with reservation:", doc.data());
        return true; // Conflict found
      }
    }
  }

  // 2. Check for conflicting blocked slots
  const blockedSlotQuery = query(
    blockedSlotsCollection,
    where("startTime", "<", endTime)
  );
  const conflictingSlots = await getDocs(blockedSlotQuery);
  for (const doc of conflictingSlots.docs) {
    if (doc.id === excludeId) continue; // Don't check against self

    const slot = doc.data() as BlockedSlot;
    if (slot.endTime > startTime) {
      // Check for overlap in memory
      const isBlockedForAll = slot.courtIds.length === 0;
      const overlapsWithCourt = courtIds.some((id) =>
        slot.courtIds.includes(id)
      );

      if (isBlockedForAll || overlapsWithCourt) {
        console.error("Conflict with blocked slot:", slot);
        return true; // Conflict found
      }
    }
  }

  return false; // No conflicts
};

const sendConfirmationEmail = async (
  reservationId: string,
  data: Omit<Reservation, "id" | "createdAt">
): Promise<boolean> => {
  if (!data.clientEmail) {
    return true; // No email to send, so technically not a failure
  }

  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.clientEmail,
        subject: "Потвърждение на резервация - Бадминтон Клуб Гълъбово",
        template: "reservationConfirmation",
        data: {
          clientName: data.clientName,
          startTime: data.startTime.toDate(), // Serialize date
          endTime: data.endTime.toDate(), // Serialize date
          courtId: data.courtId,
          reservationId: reservationId,
        },
      }),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[Email] Failed to send email for ${reservationId}:`, error);
    return false;
  }
};

// --- Public API --- //

export const createReservation = async (
  reservationData: Omit<Reservation, "id" | "createdAt">
) => {
  const hasConflict = await checkForConflicts(
    reservationData.startTime,
    reservationData.endTime,
    [reservationData.courtId]
  );
  if (hasConflict) {
    throw new Error(
      "Избраният период се застъпва със съществуваща резервация или блокиран час."
    );
  }

  const docRef = await addDoc(reservationsCollection, {
    ...reservationData,
    createdAt: Timestamp.now(),
  });

  // After successful creation, try to send an email but don't block the process if it fails
  const emailSent = await sendConfirmationEmail(docRef.id, reservationData);

  return { id: docRef.id, emailSent };
};

export const updateReservation = async (
  id: string,
  data: Omit<Reservation, "id" | "createdAt" | "status">
) => {
  const hasConflict = await checkForConflicts(
    data.startTime,
    data.endTime,
    [data.courtId],
    id
  );
  if (hasConflict) {
    throw new Error(
      "Промяната се застъпва със съществуваща резервация или блокиран час."
    );
  }
  const docRef = doc(db, "reservations", id);
  await updateDoc(docRef, data);
};

export const updateReservationStatus = async (
  id: string,
  status: Reservation["status"]
) => {
  const docRef = doc(db, "reservations", id);
  await updateDoc(docRef, { status });

  // Handle sales sync based on status
  if (status === "paid") {
    try {
      const resSnap = await getDoc(docRef);
      if (resSnap.exists()) {
        const resData = resSnap.data() as Reservation;
        
        // 1. Check if a sale already exists for this reservation to prevent duplicates
        const salesRef = getSalesCollection();
        const q = query(salesRef, where("relatedReservationId", "==", id));
        const existingSales = await getDocs(q);

        if (existingSales.empty) {
          await recordReservationAsSale(id, resData);
        } else {
          console.log(`Sale already exists for reservation ${id}. Skipping duplication.`);
        }
      }
    } catch (error) {
      console.error("Failed to record reservation as sale:", error);
    }
  } else if (status === "unpaid") {
    // If toggled back to unpaid, remove the associated sale records from finances
    try {
      const salesRef = getSalesCollection();
      const q = query(salesRef, where("relatedReservationId", "==", id));
      const existingSales = await getDocs(q);
      
      const deletePromises = existingSales.docs.map(saleDoc => 
        deleteDoc(doc(db, "sales", saleDoc.id))
      );
      
      await Promise.all(deletePromises);
      if (existingSales.docs.length > 0) {
        console.log(`Removed ${existingSales.docs.length} associated sale(s) for reservation ${id} as it was marked unpaid.`);
      }
    } catch (error) {
      console.error("Failed to remove sale for unpaid reservation:", error);
    }
  }
};

/**
 * Internal helper to record a paid reservation in the sales collection.
 */
const recordReservationAsSale = async (reservationId: string, data: Reservation) => {
  const salesRef = getSalesCollection();
  
  // Calculate duration in hours to show correct quantity in the receipt
  const durationMs = data.endTime.toMillis() - data.startTime.toMillis();
  const durationHours = Math.max(1, Math.round(durationMs / (1000 * 60 * 60))); 
  const unitPrice = data.totalPrice / durationHours;

  // Create a sale record linked to this reservation
  const saleData: Omit<Sale, "id"> = {
    memberId: "GUEST_EXTERNAL", // Placeholder for non-member reservations
    saleDate: Timestamp.now().toDate().toISOString(),
    items: [
      {
        productId: `COURT_${data.courtId}`,
        name: `Наем на Корт ${data.courtId}`,
        quantity: durationHours,
        price: unitPrice,
      }
    ],
    status: "completed",
    isPaid: true,
    totalAmount: data.totalPrice,
    currency: "EUR",
    relatedReservationId: reservationId, // Crucial for tracking and preventing duplicates
    clientName: data.clientName,
    createdAt: Timestamp.now().toDate().toISOString(),
  };

  await addDoc(salesRef, saleData);
};

export const getReservationsForDay = async (
  date: Date
): Promise<Reservation[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    reservationsCollection,
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Reservation, "id">),
  }));
};

export const getReservationHistory = async (limitCount = 100): Promise<Reservation[]> => {
  const q = query(
    reservationsCollection,
    orderBy("startTime", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Reservation, "id">),
  }));
};

export const deleteReservation = async (reservationId: string) => {
  const docRef = doc(db, "reservations", reservationId);
  await deleteDoc(docRef);
};

export const createBlockedSlot = async (
  slotData: Omit<BlockedSlot, "id" | "createdAt">
) => {
  const courtIdsToCheck =
    slotData.courtIds.length > 0 ? slotData.courtIds : [1, 2, 3, 4, 5, 6];
  const hasConflict = await checkForConflicts(
    slotData.startTime,
    slotData.endTime,
    courtIdsToCheck
  );
  if (hasConflict) {
    throw new Error(
      "Избраният период се застъпва със съществуваща резервация."
    );
  }
  const docRef = await addDoc(blockedSlotsCollection, {
    ...slotData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBlockedSlot = async (
  id: string,
  data: Omit<BlockedSlot, "id" | "createdAt">
) => {
  const courtIdsToCheck =
    data.courtIds.length > 0 ? data.courtIds : [1, 2, 3, 4, 5, 6];
  const hasConflict = await checkForConflicts(
    data.startTime,
    data.endTime,
    courtIdsToCheck,
    id
  );
  if (hasConflict) {
    throw new Error(
      "Промяната се застъпва със съществуваща резервация или блокиран час."
    );
  }
  const docRef = doc(db, "blockedSlots", id);
  await updateDoc(docRef, data);
};

export const getBlockedSlotsForDay = async (
  date: Date
): Promise<BlockedSlot[]> => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);
  const q = query(
    blockedSlotsCollection,
    where("startTime", ">=", startOfDay),
    where("startTime", "<", endOfDay)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<BlockedSlot, "id">),
  }));
};

export const deleteBlockedSlot = async (slotId: string) => {
  const docRef = doc(db, "blockedSlots", slotId);
  await deleteDoc(docRef);
};

/**
 * Working Hours Settings
 */
const WORKING_HOURS_DOC_ID = "working_hours";

export async function getWorkingHours(): Promise<Record<number, { start: string; end: string; closed?: boolean }>> {
  const docRef = doc(db, "settings", WORKING_HOURS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as Record<number, { start: string; end: string; closed?: boolean }>;
  }

  // Default values if not set
  const defaults = {
    1: { start: "08:00", end: "22:00", closed: false },
    2: { start: "08:00", end: "22:00", closed: false },
    3: { start: "08:00", end: "22:00", closed: false },
    4: { start: "08:00", end: "22:00", closed: false },
    5: { start: "08:00", end: "22:00", closed: false },
    6: { start: "09:00", end: "21:00", closed: false },
    0: { start: "09:00", end: "20:00", closed: false },
  };
  
  await setDoc(docRef, defaults);
  return defaults;
}

export async function updateWorkingHours(hours: Record<number, { start: string; end: string; closed?: boolean }>) {
  const docRef = doc(db, "settings", WORKING_HOURS_DOC_ID);
  await setDoc(docRef, hours, { merge: true });
}
