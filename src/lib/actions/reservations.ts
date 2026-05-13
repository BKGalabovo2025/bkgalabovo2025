"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

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

export async function markReservationAsPaidAction(
  idToken: string,
  reservationId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    await db.collection("reservations").doc(reservationId).update({
      status: "paid",
      updatedAt: Timestamp.now(),
    });
    revalidatePath("/reservations");
    return { success: true, message: "Резервацията е маркирана като платена." };
  } catch (error: unknown) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при актуализиране на статус.",
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
      service: "gmail",
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
    const timeRange = `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #f4f4f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e4e4e7; }
          .header { border-bottom: 3px solid #18181b; padding-bottom: 24px; margin-bottom: 32px; }
          .title { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; color: #18181b; letter-spacing: -0.02em; }
          .doc-no { font-size: 10px; font-weight: bold; color: #71717a; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px; }
          .section-title { font-size: 10px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
          .donor-box { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 24px; }
          .table { width: 100%; border-collapse: collapse; margin: 24px 0; border: 2px solid #18181b; border-radius: 12px; overflow: hidden; }
          .table th { background: #18181b; color: white; text-align: left; padding: 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
          .table td { padding: 14px; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
          .total-row td { font-weight: 900; font-size: 18px; background: #fafafa; }
          .legal-box { background: #18181b; padding: 20px; border-radius: 16px; margin-top: 32px; color: white; }
          .legal-text { font-size: 11px; font-weight: 500; text-transform: uppercase; margin: 0; line-height: 1.5; color: #d4d4d8; }
          .footer { font-size: 10px; color: #71717a; text-align: center; margin-top: 40px; border-top: 1px solid #e4e4e7; padding-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">ДОКУМЕНТ ЗА ДАРЕНИЕ</h1>
            <p class="doc-no">№ ${reservationId.substring(0, 8).toUpperCase()} / ${new Date().toLocaleDateString("bg-BG")}</p>
          </div>
          
          <div class="content">
            <div class="legal-box">
              <p class="legal-text">
                С настоящия документ се потвърждава постъпило целево дарение от <strong>${reservation.clientName}</strong> (тел. ${reservation.clientPhone || "непосочен"}) в полза на СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“. Дарените средства ще бъдат използвани изцяло за поддържане на материално-техническата база (МТО) на клуба и неговите уставни цели, включително развитие на детско-юношеската школа по бадминтон.
              </p>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Описание</th>
                  <th>Детайли</th>
                  <th style="text-align: right;">Сума</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">Целево дарение в полза на СНЦ „Бадминтон клуб Гълъбово“ за ползване на бадминтон корт</td>
                  <td>${formattedDate}<br/>${timeRange} (${durationHours}ч.)</td>
                  <td style="text-align: right; font-weight: 900;">${formatPrice(reservation.totalPrice)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2">ОБЩА СТОЙНОСТ:</td>
                  <td style="text-align: right;">${formatPrice(reservation.totalPrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>${clubInfo.name}</strong><br>${clubInfo.address}</p>
            <p style="margin-top: 12px; font-weight: bold; color: #a1a1aa;">ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ ПОДПИС</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${clubInfo.name}" <${process.env.EMAIL_USER}>`,
      to: reservation.clientEmail,
      subject: `Документ за дарение - ${clubInfo.name}`,
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
