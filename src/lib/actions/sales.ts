import "server-only";
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { SaleSchema } from "@/types/sale.types";
import { serverCache } from "@/lib/server-cache";

export type SaleActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: unknown;
};

/**
 * Creates a new sale using Server Actions.
 * Handles inventory updates and logging in a transaction.
 */
export async function createSaleAction(
  idToken: string,
  saleData: Record<string, unknown>
): Promise<SaleActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    // Validation
    const validatedFields = SaleSchema.omit({
      id: true,
      createdAt: true,
    }).safeParse(saleData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните на продажбата.",
      };
    }

    const data = validatedFields.data;
    const newSaleRef = adminDb.collection("sales").doc();

    await adminDb.runTransaction(async (transaction) => {
      // 1. Perform all reads first
      const productUpdates = [];
      for (const item of data.items) {
        const productRef = adminDb.collection("products").doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Продуктът с ID ${item.productId} не бе намерен.`);
        }

        const productData = productDoc.data()!;
        const currentStock = productData.stock || 0;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Недостатъчна наличност за ${item.name}.`);
        }

        productUpdates.push({
          ref: productRef,
          stock: newStock,
          item,
        });
      }

      // 2. Perform all writes next
      // a. Create the Sale record
      transaction.set(newSaleRef, {
        ...data,
        saleDate: Timestamp.fromDate(new Date(data.saleDate)),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: { uid: user.uid, email: user.email },
      });

      // b. Update products stock and create inventory events
      for (const update of productUpdates) {
        transaction.update(update.ref, { stock: update.stock });

        const eventRef = adminDb.collection("inventory_events").doc();
        transaction.set(eventRef, {
          id: eventRef.id,
          productId: update.item.productId,
          productName: update.item.name,
          type: "sale",
          quantityChange: -update.item.quantity,
          createdAt: new Date().toISOString(),
          userId: user.uid,
          userName: user.displayName || user.email,
          relatedSaleId: newSaleRef.id,
          clientName: data.clientName || "Неизвестен клиент",
        });
      }

      // c. Update member's lastPaymentDate if sale is paid and not a guest sale
      if (data.isPaid && data.memberId && data.memberId !== "GUEST_EXTERNAL") {
        const memberRef = adminDb.collection("members").doc(data.memberId);
        transaction.update(memberRef, {
          lastPaymentDate: new Date(data.saleDate).toISOString(),
        });
      }
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message: "Продажбата бе регистрирана успешно.",
      data: { id: newSaleRef.id },
    };
  } catch (error: unknown) {
    console.error("createSaleAction Error:", error);
    return {
      success: false,
      message: `Сървърна грешка: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

/**
 * Updates an existing sale.
 */
export async function updateSaleAction(
  id: string,
  idToken: string,
  saleData: Record<string, unknown>
): Promise<SaleActionState> {
  try {
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const validatedFields = SaleSchema.omit({
      id: true,
      createdAt: true,
    })
      .partial()
      .safeParse(saleData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Грешка при валидация на данните.",
      };
    }

    const data = validatedFields.data;
    const saleRef = adminDb.collection("sales").doc(id);

    const dataToUpdate: Record<string, unknown> = { ...data };
    if (data.saleDate) {
      dataToUpdate.saleDate = Timestamp.fromDate(new Date(data.saleDate));
    }
    dataToUpdate.updatedAt = FieldValue.serverTimestamp();

    const existingSaleSnap = await saleRef.get();
    const existingSale = existingSaleSnap.data();

    await saleRef.update(dataToUpdate);

    // If payment status changed to PAID, update attendances
    if (dataToUpdate.isPaid && existingSale && !existingSale.isPaid) {
      const paidEventIds: string[] = existingSale.paidEventIds || [];
      const targetMemberIds: string[] =
        existingSale.memberIdsForAttendance ||
        (existingSale.memberIdForAttendance
          ? [existingSale.memberIdForAttendance]
          : existingSale.memberId
            ? [existingSale.memberId]
            : []);

      const paymentType: "subscription" | "individual" =
        existingSale.paymentMode === "subscription"
          ? "subscription"
          : "individual";

      if (paidEventIds.length > 0 && targetMemberIds.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < paidEventIds.length; i += chunkSize) {
          const chunk = paidEventIds.slice(i, i + chunkSize);
          const attendanceBatch = adminDb.batch();

          for (const eventId of chunk) {
            const eventRef = adminDb.collection("events").doc(eventId);
            const eventSnap = await eventRef.get();

            if (!eventSnap.exists) continue;

            const eventData = eventSnap.data();
            const attendees: any[] = eventData?.attendees || [];
            const nowIso = new Date().toISOString();

            const updatedAttendees = attendees.map((attendee: any) => {
              if (targetMemberIds.includes(attendee.memberId)) {
                return {
                  ...attendee,
                  paymentStatus: "paid",
                  paymentType: paymentType,
                  paymentDate: nowIso,
                  saleId: saleRef.id,
                };
              }
              return attendee;
            });

            attendanceBatch.update(eventRef, { attendees: updatedAttendees });
          }

          await attendanceBatch.commit();
        }
      }

      // Update lastPaymentDate
      for (const tId of targetMemberIds) {
        if (tId !== "GUEST_EXTERNAL") {
          const mRef = adminDb.collection("members").doc(tId);
          const mSnap = await mRef.get();
          if (mSnap.exists) {
            await mRef.update({
              lastPaymentDate: new Date(
                (dataToUpdate.saleDate as any)?.toDate() || new Date()
              ).toISOString(),
            });
          }
        }
      }
    } else if (!dataToUpdate.isPaid && existingSale && existingSale.isPaid) {
      // If payment status changed to UNPAID, revert attendances
      const paidEventIds: string[] = existingSale.paidEventIds || [];
      const targetMemberIds: string[] =
        existingSale.memberIdsForAttendance ||
        (existingSale.memberIdForAttendance
          ? [existingSale.memberIdForAttendance]
          : existingSale.memberId
            ? [existingSale.memberId]
            : []);

      if (paidEventIds.length > 0 && targetMemberIds.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < paidEventIds.length; i += chunkSize) {
          const chunk = paidEventIds.slice(i, i + chunkSize);
          const attendanceBatch = adminDb.batch();

          for (const eventId of chunk) {
            const eventRef = adminDb.collection("events").doc(eventId);
            const eventSnap = await eventRef.get();

            if (!eventSnap.exists) continue;

            const eventData = eventSnap.data();
            const attendees: any[] = eventData?.attendees || [];

            const updatedAttendees = attendees.map((attendee: any) => {
              if (
                targetMemberIds.includes(attendee.memberId) &&
                attendee.saleId === saleRef.id
              ) {
                const rest = { ...attendee };
                delete rest.paymentStatus;
                delete rest.paymentType;
                delete rest.paymentDate;
                delete rest.saleId;
                return rest;
              }
              return attendee;
            });

            attendanceBatch.update(eventRef, { attendees: updatedAttendees });
          }

          await attendanceBatch.commit();
        }
      }
    }

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message: "Продажбата бе актуализирана успешно.",
    };
  } catch (error: unknown) {
    console.error("updateSaleAction Error:", error);
    return {
      success: false,
      message: "Грешка при актуализиране на продажбата.",
    };
  }
}

/**
 * Deletes a sale record.
 */
export async function deleteSaleAction(
  id: string,
  idToken: string
): Promise<SaleActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();
    const saleRef = adminDb.collection("sales").doc(id);

    let deletedSaleData: Record<string, any> = {};

    await adminDb.runTransaction(async (transaction) => {
      // 1. Fetch the sale first (Read phase)
      const saleDoc = await transaction.get(saleRef);
      if (!saleDoc.exists) {
        throw new Error("Продажбата не бе намерена.");
      }
      const saleData = saleDoc.data()!;
      deletedSaleData = saleData;
      const items = saleData.items || [];

      // 2. Fetch all products to restore their stock (Read phase)
      const productUpdates = [];
      for (const item of items) {
        if (!item.productId) continue;
        const productRef = adminDb.collection("products").doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (productDoc.exists) {
          const productData = productDoc.data()!;
          const currentStock = productData.stock || 0;
          const newStock = currentStock + (item.quantity || 0);

          productUpdates.push({
            ref: productRef,
            stock: newStock,
            item,
          });
        }
      }

      // 3. Perform writes (Write phase)
      // a. Delete the sale document
      transaction.delete(saleRef);

      // b. Update stock and write inventory correction events
      for (const update of productUpdates) {
        transaction.update(update.ref, { stock: update.stock });

        const eventRef = adminDb.collection("inventory_events").doc();
        transaction.set(eventRef, {
          id: eventRef.id,
          productId: update.item.productId,
          productName: update.item.name,
          type: "correction",
          quantityChange: update.item.quantity || 0,
          createdAt: new Date().toISOString(),
          userId: user.uid,
          userName: user.displayName || user.email,
          notes: `Анулирана продажба № ${id}`,
        });
      }
    });

    // 4. Revert attendance payment status if any events were linked to this sale
    // We do this outside the main transaction to avoid transaction limits if there are many events
    const paidEventIds: string[] = deletedSaleData.paidEventIds || [];
    const targetMemberIds: string[] =
      deletedSaleData.memberIdsForAttendance ||
      (deletedSaleData.memberIdForAttendance
        ? [deletedSaleData.memberIdForAttendance]
        : deletedSaleData.memberId
          ? [deletedSaleData.memberId]
          : []);

    if (paidEventIds.length > 0 && targetMemberIds.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < paidEventIds.length; i += chunkSize) {
        const chunk = paidEventIds.slice(i, i + chunkSize);
        const attendanceBatch = adminDb.batch();

        for (const eventId of chunk) {
          const eventRef = adminDb.collection("events").doc(eventId);
          const eventSnap = await eventRef.get();

          if (!eventSnap.exists) continue;

          const eventData = eventSnap.data();
          const attendees: any[] = eventData?.attendees || [];

          const updatedAttendees = attendees.map((att: any) => {
            if (targetMemberIds.includes(att.memberId) && att.saleId === id) {
              return {
                ...att,
                paymentStatus: "unpaid",
                paymentType: null,
                paymentDate: null,
                saleId: null,
              };
            }
            return att;
          });

          attendanceBatch.update(eventRef, { attendees: updatedAttendees });
        }

        await attendanceBatch.commit();
      }
    }

    // 5. If this is a general service sale, delete associated reservations and packages
    if (deletedSaleData.type === "general_service" || deletedSaleData.reservationId) {
      const reservationId = deletedSaleData.reservationId;
      
      const reservationsSnapshot = await adminDb
        .collection("reservations")
        .where("saleId", "==", id)
        .get();

      const packagesSnapshot = await adminDb
        .collection("client_packages")
        .where("saleId", "==", id)
        .get();

      const generalBatch = adminDb.batch();
      const resIds: string[] = [];

      reservationsSnapshot.docs.forEach((doc: any) => {
        generalBatch.delete(doc.ref);
        resIds.push(doc.id);
      });

      packagesSnapshot.docs.forEach((doc: any) => {
        generalBatch.delete(doc.ref);
      });

      if (reservationId && !resIds.includes(reservationId)) {
        resIds.push(reservationId);
      }
      
      if (resIds.length > 0) {
        // Find member declarations for these reservations
        // Chunk into groups of 30 due to Firestore limits
        for (let i = 0; i < resIds.length; i += 30) {
          const chunk = resIds.slice(i, i + 30);
          const declSnapshot = await adminDb
            .collection("member_declarations")
            .where("reservationId", "in", chunk)
            .get();
          
          declSnapshot.docs.forEach((doc: any) => {
            generalBatch.delete(doc.ref);
          });
        }
      }

      await generalBatch.commit();
    }

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message:
        "Продажбата бе изтрита успешно, а наличностите в магазина бяха възстановени.",
    };
  } catch (error: unknown) {
    console.error("deleteSaleAction Error:", error);
    return {
      success: false,
      message: `Грешка при изтриване на продажбата: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}


