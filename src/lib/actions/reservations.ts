"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";
import { serverCache } from "@/lib/server-cache";

const reservationSchema = z.object({
  clientName: z.string().min(2),
  clientPhone: z.string().min(9),
  clientEmail: z.string().email().optional().or(z.literal("")),
  courtId: z.number().min(1).max(6).optional(),
  startTime: z.string(), // ISO string
  endTime: z.string(), // ISO string
  totalPrice: z.number(),
  currency: z.string().default("EUR"),
  status: z.string().default("unpaid"),
  siteId: z.string(),
  memberId: z.string().optional(),
  paymentMethod: z.string().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  selectedZone: z.string().optional(),
  usedResources: z.any().optional(),
  isExclusive: z.boolean().optional(),
  bufferAfter: z.number().optional(),
  price: z.number().optional(),
  finalPrice: z.number().optional(),
  client2Name: z.string().optional(),
  client2Phone: z.string().optional(),
  client2Zone: z.string().optional(),
});

const blockedSlotSchema = z.object({
  title: z.string().min(3),
  startTime: z.string(), // ISO string
  endTime: z.string(), // ISO string
  courtIds: z.array(z.number()),
  siteId: z.string(),
});

async function createSaleForReservation(
  db: any,
  user: any,
  reservationId: string,
  reservation: any,
  paymentMethod?: string
) {
  const saleRef = db.collection("sales").doc();
  const totalPrice = reservation.totalPrice ?? reservation.price ?? 0;

  const startTime =
    reservation.startTime instanceof Timestamp
      ? reservation.startTime.toDate()
      : new Date(reservation.startTime);
  const endTime =
    reservation.endTime instanceof Timestamp
      ? reservation.endTime.toDate()
      : new Date(reservation.endTime);

  const durationHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const quantity = Math.max(1, Math.round(durationHours));
  const unitPrice = totalPrice / quantity;

  const courtId = reservation.courtId;
  const productName = courtId
    ? `Наем на Корт № ${courtId}`
    : `Възстановяване: ${reservation.serviceName || "Услуга"}`;

  const saleData = {
    siteId: reservation.siteId || "bkgalabovo",
    memberId: reservation.memberId || "GUEST_EXTERNAL",
    saleDate: Timestamp.fromDate(startTime),
    items: [
      {
        productId: courtId
          ? `court_rental_${courtId}`
          : `recovery_session_${reservation.serviceId || "generic"}`,
        name: productName,
        quantity: quantity,
        price: unitPrice,
      },
    ],
    status: "completed",
    isPaid: true,
    totalAmount: totalPrice,
    currency: "EUR",
    paymentMethod: paymentMethod || reservation.paymentMethod || "Cash",
    clientName: reservation.clientName || "Външен клиент",
    type: "general_service",
    reservationId: reservationId,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: { uid: user.uid, email: user.email },
  };

  await saleRef.set(saleData);

  // Update lastPaymentDate if not a guest
  if (reservation.memberId && reservation.memberId !== "GUEST_EXTERNAL") {
    const memberRef = db.collection("members").doc(reservation.memberId);
    await memberRef.update({
      lastPaymentDate: startTime.toISOString(),
    });
  }

  return saleRef.id;
}

async function deleteSaleForReservation(db: any, reservationId: string) {
  const salesRef = db.collection("sales");
  const salesSnapshot = await salesRef
    .where("reservationId", "==", reservationId)
    .get();

  if (!salesSnapshot.empty) {
    const batch = db.batch();
    salesSnapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

async function findOrCreateGuestProfile(
  db: any,
  user: any,
  clientName: string,
  clientPhone: string,
  clientEmail?: string,
  siteId?: string
): Promise<string> {
  const phone = clientPhone?.trim() || "";
  const email = clientEmail?.trim() || "";
  const nameParts = clientName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Външен";
  const lastName = nameParts.slice(1).join(" ") || "Клиент";
  const branchId = siteId || "bkgalabovo";

  // 1. Try searching by phone number (if provided and valid)
  if (phone) {
    const phoneSnapshot = await db
      .collection("members")
      .where("phone", "==", phone)
      .limit(1)
      .get();
    if (!phoneSnapshot.empty) {
      return phoneSnapshot.docs[0].id;
    }
  }

  // 2. Try searching by email (if provided)
  if (email) {
    const emailSnapshot = await db
      .collection("members")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!emailSnapshot.empty) {
      return emailSnapshot.docs[0].id;
    }
  }

  // 3. Try searching by first and last name
  const nameSnapshot = await db
    .collection("members")
    .where("firstName", "==", firstName)
    .where("lastName", "==", lastName)
    .limit(1)
    .get();
  if (!nameSnapshot.empty) {
    return nameSnapshot.docs[0].id;
  }

  // 4. Create a new guest profile
  const newMemberRef = db.collection("members").doc();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const guestData = {
    firstName,
    lastName,
    name: fullName,
    phone,
    email,
    isGuest: true,
    memberType: "guest",
    branchId,
    status: "active",
    hasSignedDeclaration: false,
    hasMedicalCertificate: false,
    isLicensed: false,
    registrationDate: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: { uid: user.uid, email: user.email },
  };

  await newMemberRef.set(guestData);
  return newMemberRef.id;
}

export async function createReservationAction(
  idToken: string,
  data: Record<string, unknown>
) {
  try {
    const user = await getAuthUser(idToken);
    const validated = reservationSchema.parse(data);

    const db = getAdminDb();
    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    // Conflict check - Reservations
    const reservationsRef = db.collection("reservations");
    let hasConflict = false;

    if (validated.courtId) {
      const conflictingRes = await reservationsRef
        .where("siteId", "==", validated.siteId)
        .where("courtId", "==", validated.courtId)
        .where("startTime", "<", endTime)
        .get();

      hasConflict = conflictingRes.docs.some((doc: any) => {
        const res = doc.data();
        return res.endTime > startTime;
      });
    }

    if (hasConflict) {
      return {
        success: false,
        message: "Избраният период се застъпва със съществуваща резервация.",
      };
    }

    // Inventory check for Recovery Zone
    if (validated.siteId === "recoveryzone" && validated.usedResources) {
      const siteDoc = await db.collection("sites").doc("recoveryzone").get();
      if (siteDoc.exists) {
        const siteInfo = siteDoc.data() || {};
        if (siteInfo.inventory) {
          const maxComp = siteInfo.inventory.compressors || 0;
          const maxLegs = siteInfo.inventory.attachments?.legs || 0;
          const maxArms = siteInfo.inventory.attachments?.arms || 0;
          const maxHips = siteInfo.inventory.attachments?.hips || 0;

          const overlappingRes = await reservationsRef
            .where("siteId", "==", "recoveryzone")
            .where("startTime", "<", endTime)
            .get();

          let usedComp = 0;
          let usedLegs = 0;
          let usedArms = 0;
          let usedHips = 0;

          overlappingRes.docs.forEach((doc: any) => {
            const res = doc.data();
            if (res.endTime > startTime && res.usedResources) {
              usedComp += res.usedResources.compressors || 0;
              usedLegs += res.usedResources.attachments?.legs || 0;
              usedArms += res.usedResources.attachments?.arms || 0;
              usedHips += res.usedResources.attachments?.hips || 0;
            }
          });

          const reqComp = validated.usedResources.compressors || 0;
          const reqLegs = validated.usedResources.attachments?.legs || 0;
          const reqArms = validated.usedResources.attachments?.arms || 0;
          const reqHips = validated.usedResources.attachments?.hips || 0;

          if (usedComp + reqComp > maxComp)
            return {
              success: false,
              message: `Няма достатъчно компресори (търсени ${reqComp}, свободни ${Math.max(0, maxComp - usedComp)}).`,
            };
          if (usedLegs + reqLegs > maxLegs)
            return {
              success: false,
              message: `Няма достатъчно приставки КРАКА (свободни ${Math.max(0, maxLegs - usedLegs)}).`,
            };
          if (usedArms + reqArms > maxArms)
            return {
              success: false,
              message: `Няма достатъчно приставки РЪЦЕ (свободни ${Math.max(0, maxArms - usedArms)}).`,
            };
          if (usedHips + reqHips > maxHips)
            return {
              success: false,
              message: `Няма достатъчно приставки ТАЗ (свободни ${Math.max(0, maxHips - usedHips)}).`,
            };
        }
      }
    }

    // Conflict check - Blocked Slots
    let hasBlocked = false;
    if (validated.courtId) {
      const blockedRef = db.collection("blockedSlots");
      const blockedSlots = await blockedRef
        .where("siteId", "==", validated.siteId)
        .where("startTime", "<", endTime)
        .get();
      hasBlocked = blockedSlots.docs.some((doc: any) => {
        const slot = doc.data();
        const overlapsTime = slot.endTime > startTime;
        const appliesToCourt =
          slot.courtIds.length === 0 ||
          slot.courtIds.includes(validated.courtId!);
        return overlapsTime && appliesToCourt;
      });
    }

    if (hasBlocked) {
      return {
        success: false,
        message: "Избраният период е блокиран от администратор.",
      };
    }

    let finalMemberId = validated.memberId;
    if (!finalMemberId || finalMemberId === "GUEST_EXTERNAL") {
      finalMemberId = await findOrCreateGuestProfile(
        db,
        user,
        validated.clientName,
        validated.clientPhone,
        validated.clientEmail,
        validated.siteId
      );
    }

    if (validated.client2Name) {
      await findOrCreateGuestProfile(
        db,
        user,
        validated.client2Name,
        validated.client2Phone || "",
        "",
        validated.siteId
      );
    }

    const docData = {
      ...validated,
      memberId: finalMemberId,
      startTime,
      endTime,
      createdAt: Timestamp.now(),
    };

    const newDoc = await reservationsRef.add(docData);
    const reservationId = newDoc.id;

    let saleId = "";
    if (validated.status === "paid") {
      saleId = await createSaleForReservation(
        db,
        user,
        reservationId,
        {
          ...validated,
          memberId: finalMemberId,
        },
        validated.paymentMethod
      );
      await reservationsRef.doc(reservationId).update({
        saleId,
        updatedAt: Timestamp.now(),
      });
    }

    revalidatePath("/reservations");
    // cache imported at top
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message: "Резервацията е създадена успешно.",
      id: reservationId,
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
    const user = await getAuthUser(idToken);
    const validated = reservationSchema.parse(data);

    const db = getAdminDb();
    const startTime = Timestamp.fromDate(new Date(validated.startTime));
    const endTime = Timestamp.fromDate(new Date(validated.endTime));

    const reservationsRef = db.collection("reservations");
    const reservationDoc = await reservationsRef.doc(reservationId).get();
    if (!reservationDoc.exists) {
      throw new Error("Резервацията не е намерена.");
    }
    const oldReservation = reservationDoc.data()!;

    // Conflict check (excluding current)
    let hasConflict = false;
    if (validated.courtId) {
      const conflictingRes = await reservationsRef
        .where("siteId", "==", validated.siteId)
        .where("courtId", "==", validated.courtId)
        .where("startTime", "<", endTime)
        .get();

      hasConflict = conflictingRes.docs.some((doc: any) => {
        if (doc.id === reservationId) return false;
        const res = doc.data();
        return res.endTime > startTime;
      });
    }

    if (hasConflict) {
      return {
        success: false,
        message: "Промяната се застъпва със съществуваща резервация.",
      };
    }

    let finalMemberId = validated.memberId;
    if (!finalMemberId || finalMemberId === "GUEST_EXTERNAL") {
      finalMemberId = await findOrCreateGuestProfile(
        db,
        user,
        validated.clientName,
        validated.clientPhone,
        validated.clientEmail,
        validated.siteId
      );
    }

    let saleId = oldReservation.saleId || "";

    if (validated.status === "paid") {
      await deleteSaleForReservation(db, reservationId);
      saleId = await createSaleForReservation(
        db,
        user,
        reservationId,
        {
          ...validated,
          memberId: finalMemberId,
        },
        validated.paymentMethod
      );
    } else if (
      validated.status !== "paid" &&
      oldReservation.status === "paid"
    ) {
      await deleteSaleForReservation(db, reservationId);
      saleId = "";
    }

    await reservationsRef.doc(reservationId).update({
      ...validated,
      memberId: finalMemberId,
      startTime,
      endTime,
      saleId,
      updatedAt: Timestamp.now(),
    });

    revalidatePath("/reservations");
    // cache imported at top
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

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

    await deleteSaleForReservation(db, reservationId);

    await db.collection("reservations").doc(reservationId).delete();
    revalidatePath("/reservations");

    // cache imported at top
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

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

    const reservationDoc = await db
      .collection("reservations")
      .doc(reservationId)
      .get();
    if (!reservationDoc.exists) {
      throw new Error("Резервацията не е намерена.");
    }
    const reservation = reservationDoc.data()!;

    if (reservation.packageGroupId) {
      return await updatePackageReservationsAction(
        idToken,
        reservation.packageGroupId,
        {
          status: "paid",
          paymentMethod: "Cash",
        }
      );
    }

    let finalMemberId = reservation.memberId;
    if (!finalMemberId || finalMemberId === "GUEST_EXTERNAL") {
      finalMemberId = await findOrCreateGuestProfile(
        db,
        user,
        reservation.clientName,
        reservation.clientPhone,
        reservation.clientEmail,
        reservation.siteId
      );
    }

    const saleId = await createSaleForReservation(
      db,
      user,
      reservationId,
      {
        ...reservation,
        memberId: finalMemberId,
      },
      "Cash"
    );

    await db
      .collection("reservations")
      .doc(reservationId)
      .update({
        status: "paid",
        memberId: finalMemberId,
        saleId,
        updatedAt: Timestamp.now(),
        updatedBy: {
          userId: user.uid,
          userName: user.name || user.email || "Unknown",
        },
      });

    revalidatePath("/reservations");
    // cache imported at top
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

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

export async function createPackageReservationsAction(
  idToken: string,
  reservationsData: Record<string, unknown>[],
  paymentMethod?: string
) {
  try {
    const user = await getAuthUser(idToken);
    const db = getAdminDb();

    if (!reservationsData || reservationsData.length === 0) {
      throw new Error("Няма данни за резервации.");
    }

    const packageGroupId = db.collection("reservations").doc().id;
    let saleId = "";

    const parsedReservations = reservationsData.map((r) =>
      reservationSchema.parse(r)
    );
    const firstRes = parsedReservations[0];

    // Inventory cache for Recovery Zone
    let maxComp = 0;
    let maxLegs = 0;
    let maxArms = 0;
    let maxHips = 0;
    let hasInventoryCheck = false;

    if (firstRes.siteId === "recoveryzone") {
      const siteDoc = await db.collection("sites").doc("recoveryzone").get();
      if (siteDoc.exists) {
        const siteInfo = siteDoc.data() || {};
        if (siteInfo.inventory) {
          maxComp = siteInfo.inventory.compressors || 0;
          maxLegs = siteInfo.inventory.attachments?.legs || 0;
          maxArms = siteInfo.inventory.attachments?.arms || 0;
          maxHips = siteInfo.inventory.attachments?.hips || 0;
          hasInventoryCheck = true;
        }
      }
    }

    // Validation pass for all days before creating anything
    for (let i = 0; i < parsedReservations.length; i++) {
      const r = parsedReservations[i];
      const rStartTime = Timestamp.fromDate(new Date(r.startTime));
      const rEndTime = Timestamp.fromDate(new Date(r.endTime));

      // Court Conflict Check
      if (r.courtId) {
        const conflictingRes = await db
          .collection("reservations")
          .where("siteId", "==", r.siteId)
          .where("courtId", "==", r.courtId)
          .where("startTime", "<", rEndTime)
          .get();

        const conflict = conflictingRes.docs.some((doc: any) => {
          const res = doc.data();
          return res.endTime > rStartTime;
        });

        if (conflict) {
          throw new Error(
            `Ден ${i + 1} се застъпва със съществуваща резервация.`
          );
        }

        const blockedRef = db.collection("blockedSlots");
        const blockedSlots = await blockedRef
          .where("siteId", "==", r.siteId)
          .where("startTime", "<", rEndTime)
          .get();

        const hasBlocked = blockedSlots.docs.some((doc: any) => {
          const slot = doc.data();
          const overlapsTime = slot.endTime > rStartTime;
          const appliesToCourt =
            slot.courtIds.length === 0 || slot.courtIds.includes(r.courtId!);
          return overlapsTime && appliesToCourt;
        });

        if (hasBlocked) {
          throw new Error(`Ден ${i + 1} е блокиран от администратор.`);
        }
      }

      // Inventory Check
      if (hasInventoryCheck && r.usedResources) {
        const overlappingRes = await db
          .collection("reservations")
          .where("siteId", "==", "recoveryzone")
          .where("startTime", "<", rEndTime)
          .get();

        let usedComp = 0;
        let usedLegs = 0;
        let usedArms = 0;
        let usedHips = 0;

        overlappingRes.docs.forEach((doc: any) => {
          const res = doc.data();
          if (res.endTime > rStartTime && res.usedResources) {
            usedComp += res.usedResources.compressors || 0;
            usedLegs += res.usedResources.attachments?.legs || 0;
            usedArms += res.usedResources.attachments?.arms || 0;
            usedHips += res.usedResources.attachments?.hips || 0;
          }
        });

        const reqComp = r.usedResources.compressors || 0;
        const reqLegs = r.usedResources.attachments?.legs || 0;
        const reqArms = r.usedResources.attachments?.arms || 0;
        const reqHips = r.usedResources.attachments?.hips || 0;

        if (usedComp + reqComp > maxComp)
          throw new Error(
            `Ден ${i + 1}: Няма достатъчно компресори (търсени ${reqComp}, свободни ${Math.max(0, maxComp - usedComp)}).`
          );
        if (usedLegs + reqLegs > maxLegs)
          throw new Error(
            `Ден ${i + 1}: Няма достатъчно приставки КРАКА (свободни ${Math.max(0, maxLegs - usedLegs)}).`
          );
        if (usedArms + reqArms > maxArms)
          throw new Error(
            `Ден ${i + 1}: Няма достатъчно приставки РЪЦЕ (свободни ${Math.max(0, maxArms - usedArms)}).`
          );
        if (usedHips + reqHips > maxHips)
          throw new Error(
            `Ден ${i + 1}: Няма достатъчно приставки ТАЗ (свободни ${Math.max(0, maxHips - usedHips)}).`
          );
      }
    }

    let finalMemberId = firstRes.memberId;
    if (!finalMemberId || finalMemberId === "GUEST_EXTERNAL") {
      finalMemberId = await findOrCreateGuestProfile(
        db,
        user,
        firstRes.clientName,
        firstRes.clientPhone,
        firstRes.clientEmail,
        firstRes.siteId
      );
    }

    if (firstRes.client2Name) {
      await findOrCreateGuestProfile(
        db,
        user,
        firstRes.client2Name,
        firstRes.client2Phone || "",
        "",
        firstRes.siteId
      );
    }

    if (firstRes.status === "paid") {
      saleId = await createSaleForReservation(
        db,
        user,
        packageGroupId,
        {
          ...firstRes,
          memberId: finalMemberId,
        },
        paymentMethod || "Cash"
      );
    }

    const batch = db.batch();

    // Create a ClientPackage record
    const clientPackageRef = db
      .collection("client_packages")
      .doc(packageGroupId);
    batch.set(clientPackageRef, {
      siteId: firstRes.siteId || "recoveryzone",
      memberId: finalMemberId,
      clientName: firstRes.clientName,
      clientPhone: firstRes.clientPhone || "",
      client2Name: firstRes.client2Name || "",
      client2Phone: firstRes.client2Phone || "",
      serviceId: firstRes.serviceId || "",
      packageName: firstRes.serviceName || "Пакет",
      sessionsTotal: parsedReservations.length,
      sessionsRemaining: parsedReservations.length,
      purchaseDate: Timestamp.now(),
      status: "active",
      pricePaid: firstRes.totalPrice ?? firstRes.price ?? 0,
      currency: "EUR",
      saleId: saleId,
    });

    for (const r of parsedReservations) {
      const resRef = db.collection("reservations").doc();
      const startTime = Timestamp.fromDate(new Date(r.startTime));
      const endTime = Timestamp.fromDate(new Date(r.endTime));

      batch.set(resRef, {
        ...r,
        memberId: finalMemberId,
        packageGroupId,
        saleId,
        startTime,
        endTime,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: {
          userId: user.uid,
          userName: user.name || user.email || "Unknown",
        },
      });
    }

    await batch.commit();

    revalidatePath("/reservations");
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return { success: true, message: "Пакетът е създаден успешно." };
  } catch (error: unknown) {
    console.error("Create Package Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на пакета.",
    };
  }
}

export async function updatePackageReservationsAction(
  idToken: string,
  packageGroupId: string,
  data: any
) {
  try {
    const user = await getAuthUser(idToken);
    const db = getAdminDb();

    const reservationsSnap = await db
      .collection("reservations")
      .where("packageGroupId", "==", packageGroupId)
      .get();

    if (reservationsSnap.empty) {
      throw new Error("Пакетът не е намерен.");
    }

    const firstRes = reservationsSnap.docs[0].data();
    const finalMemberId =
      data.memberId !== undefined ? data.memberId : firstRes.memberId;
    let saleId = firstRes.saleId || "";

    if (data.status === "paid" && firstRes.status !== "paid") {
      saleId = await createSaleForReservation(
        db,
        user,
        packageGroupId,
        {
          ...firstRes,
          memberId: finalMemberId,
        },
        data.paymentMethod || "Cash"
      );
    } else if (data.status === "unpaid" && firstRes.status === "paid") {
      if (saleId) {
        await deleteSaleForReservation(db, packageGroupId);
        const saleSnap = await db.collection("sales").doc(saleId).get();
        if (saleSnap.exists) {
          await saleSnap.ref.delete();
        }
        saleId = "";
      }
    }

    const batch = db.batch();

    const sharedFields = [
      "clientName",
      "clientPhone",
      "clientEmail",
      "client2Name",
      "client2Phone",
      "selectedZone",
      "client2Zone",
      "memberId",
      "notes",
    ];

    reservationsSnap.docs.forEach((doc: any) => {
      const updatePayload: any = {
        updatedAt: Timestamp.now(),
        updatedBy: {
          userId: user.uid,
          userName: user.name || user.email || "Unknown",
        },
      };

      if (data.status !== undefined) {
        updatePayload.status = data.status;
        updatePayload.saleId = saleId;
      }
      if (data.paymentMethod !== undefined) {
        updatePayload.paymentMethod = data.paymentMethod;
      }

      for (const field of sharedFields) {
        if (data[field] !== undefined) {
          updatePayload[field] = data[field];
        }
      }

      batch.update(doc.ref, updatePayload);
    });

    await batch.commit();

    revalidatePath("/reservations");
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return { success: true, message: "Пакетът е актуализиран успешно." };
  } catch (error: unknown) {
    console.error("Update Package Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при актуализиране на пакета.",
    };
  }
}

export async function getPackageReservationsAction(
  idToken: string,
  packageGroupId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();
    const snap = await db
      .collection("reservations")
      .where("packageGroupId", "==", packageGroupId)
      .get();

    if (snap.empty) return { success: true, data: [] };

    const reservations = snap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate().toISOString(),
        endTime: data.endTime?.toDate().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });
    // Sort by startTime
    reservations.sort((a: any, b: any) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });

    return { success: true, data: JSON.parse(JSON.stringify(reservations)) };
  } catch (error: unknown) {
    console.error("Get Package Error:", error);
    return { success: false, data: [] };
  }
}

export async function checkRecoveryInventoryAction(
  siteId: string,
  startTimeIso: string,
  endTimeIso: string,
  reqResources: {
    compressors: number;
    attachments: { legs: number; arms: number; hips: number };
  },
  ignoreReservationId?: string
) {
  try {
    if (siteId !== "recoveryzone") return { success: true };
    const db = getAdminDb();
    const siteDoc = await db.collection("sites").doc("recoveryzone").get();
    if (!siteDoc.exists) return { success: true };
    const siteInfo = siteDoc.data() || {};
    if (!siteInfo.inventory) return { success: true };

    const maxComp = siteInfo.inventory.compressors || 0;
    const maxLegs = siteInfo.inventory.attachments?.legs || 0;
    const maxArms = siteInfo.inventory.attachments?.arms || 0;
    const maxHips = siteInfo.inventory.attachments?.hips || 0;

    const startTime = Timestamp.fromDate(new Date(startTimeIso));
    const endTime = Timestamp.fromDate(new Date(endTimeIso));

    const overlappingRes = await db
      .collection("reservations")
      .where("siteId", "==", "recoveryzone")
      .where("startTime", "<", endTime)
      .get();

    let usedComp = 0;
    let usedLegs = 0;
    let usedArms = 0;
    let usedHips = 0;

    overlappingRes.docs.forEach((doc: any) => {
      if (ignoreReservationId && doc.id === ignoreReservationId) return;
      const res = doc.data();
      if (res.endTime > startTime && res.usedResources) {
        usedComp += res.usedResources.compressors || 0;
        usedLegs += res.usedResources.attachments?.legs || 0;
        usedArms += res.usedResources.attachments?.arms || 0;
        usedHips += res.usedResources.attachments?.hips || 0;
      }
    });

    const reqComp = reqResources.compressors || 0;
    const reqLegs = reqResources.attachments?.legs || 0;
    const reqArms = reqResources.attachments?.arms || 0;
    const reqHips = reqResources.attachments?.hips || 0;

    if (usedComp + reqComp > maxComp)
      return {
        success: false,
        message: "���� ���������� ���������� (������� , �������� ).",
      };
    if (usedLegs + reqLegs > maxLegs)
      return {
        success: false,
        message: "���� ���������� ��������� ����� (�������� ).",
      };
    if (usedArms + reqArms > maxArms)
      return {
        success: false,
        message: "���� ���������� ��������� ���� (�������� ).",
      };
    if (usedHips + reqHips > maxHips)
      return {
        success: false,
        message: "���� ���������� ��������� ��� (�������� ).",
      };

    return { success: true };
  } catch (error: any) {
    return { success: false, message: "������ ��� �������� �� ���������." };
  }
}
