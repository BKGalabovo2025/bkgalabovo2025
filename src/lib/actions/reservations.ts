"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

const reservationSchema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(9),
  clientEmail: z.string().email().optional().or(z.literal("")),
  courtId: z.number().min(1).max(6),
  startTime: z.string(), // ISO string
  endTime: z.string(), // ISO string
  totalPrice: z.number(),
  currency: z.string().default("EUR"),
  status: z.string().default("unpaid"),
});

export async function createReservationAction(idToken: string, data: any) {
  try {
    await getAuthUser(idToken);
    const validated = reservationSchema.parse(data);

    const db = getAdminDb();
    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    // Conflict check - Reservations
    const reservationsRef = db.collection("reservations");
    const conflictingRes = await reservationsRef
      .where("courtId", "==", validated.courtId)
      .where("startTime", "<", endTime)
      .get();

    const hasConflict = conflictingRes.docs.some((doc) => {
      const res = doc.data();
      return res.endTime > startTime;
    });

    if (hasConflict) {
      return {
        success: false,
        message: "Избраният период се застъпва със съществуваща резервация.",
      };
    }

    // Conflict check - Blocked Slots
    const blockedRef = db.collection("blockedSlots");
    const blockedSlots = await blockedRef
      .where("startTime", "<", endTime)
      .get();
    const hasBlocked = blockedSlots.docs.some((doc) => {
      const slot = doc.data();
      const overlapsTime = slot.endTime > startTime;
      const appliesToCourt =
        slot.courtIds.length === 0 || slot.courtIds.includes(validated.courtId);
      return overlapsTime && appliesToCourt;
    });

    if (hasBlocked) {
      return {
        success: false,
        message: "Избраният период е блокиран от администратор.",
      };
    }

    const docData = {
      ...validated,
      startTime,
      endTime,
      createdAt: Timestamp.now(),
    };

    const newDoc = await reservationsRef.add(docData);

    revalidatePath("/reservations");
    return {
      success: true,
      message: "Резервацията е създадена успешно.",
      id: newDoc.id,
    };
  } catch (error: any) {
    console.error("Create Reservation Error:", error);
    return { success: false, message: error.message };
  }
}

export async function updateReservationAction(
  idToken: string,
  reservationId: string,
  data: any
) {
  try {
    await getAuthUser(idToken);
    const validated = reservationSchema.parse(data);

    const db = getAdminDb();
    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    const reservationsRef = db.collection("reservations");

    // Conflict check (excluding current)
    const conflictingRes = await reservationsRef
      .where("courtId", "==", validated.courtId)
      .where("startTime", "<", endTime)
      .get();

    const hasConflict = conflictingRes.docs.some((doc) => {
      if (doc.id === reservationId) return false;
      const res = doc.data();
      return res.endTime > startTime;
    });

    if (hasConflict) {
      return {
        success: false,
        message: "Промяната се застъпва със съществуваща резервация.",
      };
    }

    await reservationsRef.doc(reservationId).update({
      ...validated,
      startTime,
      endTime,
      updatedAt: Timestamp.now(),
    });

    revalidatePath("/reservations");
    return { success: true, message: "Резервацията е актуализирана успешно." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteReservationAction(
  idToken: string,
  reservationId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    await db.collection("reservations").doc(reservationId).delete();
    revalidatePath("/reservations");
    return { success: true, message: "Резервацията е изтрита." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createBlockedSlotAction(idToken: string, data: any) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    const startTime = Timestamp.fromDate(new Date(data.startTime));
    const endTime = Timestamp.fromDate(new Date(data.endTime));

    await db.collection("blockedSlots").add({
      ...data,
      startTime,
      endTime,
      createdAt: Timestamp.now(),
    });

    revalidatePath("/reservations");
    return { success: true, message: "Периодът е блокиран успешно." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
