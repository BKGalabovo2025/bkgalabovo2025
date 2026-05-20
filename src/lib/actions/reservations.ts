"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";

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
  siteId: z.string(),
});

const blockedSlotSchema = z.object({
  title: z.string().min(3),
  startTime: z.string(), // ISO string
  endTime: z.string(), // ISO string
  courtIds: z.array(z.number()),
  siteId: z.string(),
});

export async function createReservationAction(
  idToken: string,
  data: Record<string, unknown>
) {
  try {
    await getAuthUser(idToken);
    const validated = reservationSchema.parse(data);

    const db = getAdminDb();
    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    // Conflict check - Reservations
    const reservationsRef = db.collection("reservations");
    const conflictingRes = await reservationsRef
      .where("siteId", "==", validated.siteId)
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
      .where("siteId", "==", validated.siteId)
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
  } catch (error: unknown) {
    console.error("Create Reservation Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на резервация.",
    };
  }
}

export async function updateReservationAction(
  idToken: string,
  reservationId: string,
  data: Record<string, unknown>
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
      .where("siteId", "==", validated.siteId)
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
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при актуализиране на резервация.",
    };
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
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на резервация.",
    };
  }
}

export async function createBlockedSlotAction(
  idToken: string,
  data: Record<string, unknown>
) {
  try {
    await getAuthUser(idToken);
    const validated = blockedSlotSchema.parse(data);
    const db = getAdminDb();

    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    await db.collection("blockedSlots").add({
      ...validated,
      startTime,
      endTime,
      createdAt: Timestamp.now(),
    });

    revalidatePath("/reservations");
    return { success: true, message: "Периодът е блокиран успешно." };
  } catch (error: unknown) {
    console.error("Create Blocked Slot Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при блокиране на период.",
    };
  }
}

export async function updateBlockedSlotAction(
  idToken: string,
  slotId: string,
  data: Record<string, unknown>
) {
  try {
    await getAuthUser(idToken);
    const validated = blockedSlotSchema.parse(data);
    const db = getAdminDb();

    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    await db
      .collection("blockedSlots")
      .doc(slotId)
      .update({
        ...validated,
        startTime,
        endTime,
        updatedAt: Timestamp.now(),
      });

    revalidatePath("/reservations");
    return {
      success: true,
      message: "Блокираният период е актуализиран успешно.",
    };
  } catch (error: unknown) {
    console.error("Update Blocked Slot Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при актуализиране на блокиран период.",
    };
  }
}

export async function deleteBlockedSlotAction(idToken: string, slotId: string) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    await db.collection("blockedSlots").doc(slotId).delete();
    revalidatePath("/reservations");
    return { success: true, message: "Блокираният период е изтрит." };
  } catch (error: unknown) {
    console.error("Delete Blocked Slot Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на блокиран период.",
    };
  }
}

export async function markReservationAsPaidAction(
  idToken: string,
  reservationId: string
) {
  try {
    const user = await getAuthUser(idToken);
    const db = getAdminDb();
    await db
      .collection("reservations")
      .doc(reservationId)
      .update({
        status: "paid",
        updatedAt: Timestamp.now(),
        updatedBy: {
          userId: user.uid,
          userName: user.name || user.email || "Unknown",
        },
      });
    revalidatePath("/reservations");
    return { success: true, message: "Резервацията е маркирана като платена." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при маркиране на резервация.",
    };
  }
}

export async function sendDonationReceiptEmailAction(
  idToken: string,
  reservationId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    const reservationDoc = await db
      .collection("reservations")
      .doc(reservationId)
      .get();
    if (!reservationDoc.exists) {
      return { success: false, message: "Резервацията не беше намерена." };
    }

    const reservation = reservationDoc.data();
    if (!reservation || !reservation.clientEmail) {
      return { success: false, message: "Клиентът няма посочен имейл адрес." };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const startTime = reservation.startTime.toDate();
    const endTime = reservation.endTime.toDate();
    const durationHours = Math.ceil(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    );
    const formattedDate = format(startTime, "dd.MM.yyyy", { locale: bg });
    const timeRange =
      format(startTime, "HH:mm") + " - " + format(endTime, "HH:mm");

    const htmlContent =
      "<html><body>" +
      "<h1>Документ за Дарение</h1>" +
      "<p>С настоящия документ се потвърждава постъпило целево дарение от <strong>" +
      reservation.clientName +
      "</strong>" +
      " (тел. " +
      (reservation.clientPhone || "непосочен") +
      ") в полза на " +
      clubInfo.name +
      ".</p>" +
      "<table border='1' cellpadding='8' style='border-collapse:collapse;width:100%'>" +
      "<tr><th>Описание</th><th>Дата</th><th>Сума</th></tr>" +
      "<tr><td>Целево дарение за ползване на бадминтон корт</td>" +
      "<td>" +
      formattedDate +
      " " +
      timeRange +
      " (" +
      durationHours +
      "ч.)</td>" +
      "<td>" +
      formatPrice(reservation.totalPrice) +
      "</td></tr>" +
      "<tr><td colspan='2'><strong>Обща стойност:</strong></td><td>" +
      formatPrice(reservation.totalPrice) +
      "</td></tr>" +
      "</table>" +
      "<p>" +
      clubInfo.name +
      " | " +
      clubInfo.address +
      "</p>" +
      "</body></html>";

    await transporter.sendMail({
      from: clubInfo.name + " <" + process.env.EMAIL_USER + ">",
      to: reservation.clientEmail,
      subject: "Документ за дарение - " + clubInfo.name,
      html: htmlContent,
    });

    return { success: true, message: "Имейлът е изпратен успешно." };
  } catch (error) {
    console.error("Send Email Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при изпращане на имейл.",
    };
  }
}
