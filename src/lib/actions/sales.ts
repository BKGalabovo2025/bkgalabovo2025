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
        message: "Р“СЂРµС€РєР° РїСЂРё РІР°Р»РёРґР°С†РёСЏ РЅР° РґР°РЅРЅРёС‚Рµ РЅР° РїСЂРѕРґР°Р¶Р±Р°С‚Р°.",
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
          throw new Error(`РџСЂРѕРґСѓРєС‚СЉС‚ СЃ ID ${item.productId} РЅРµ Р±Рµ РЅР°РјРµСЂРµРЅ.`);
        }

        const productData = productDoc.data()!;
        const currentStock = productData.stock || 0;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`РќРµРґРѕСЃС‚Р°С‚СЉС‡РЅР° РЅР°Р»РёС‡РЅРѕСЃС‚ Р·Р° ${item.name}.`);
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
          clientName: data.clientName || "РќРµРёР·РІРµСЃС‚РµРЅ РєР»РёРµРЅС‚",
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
      message: "РџСЂРѕРґР°Р¶Р±Р°С‚Р° Р±Рµ СЂРµРіРёСЃС‚СЂРёСЂР°РЅР° СѓСЃРїРµС€РЅРѕ.",
      data: { id: newSaleRef.id },
    };
  } catch (error: unknown) {
    console.error("createSaleAction Error:", error);
    return {
      success: false,
      message: `РЎСЉСЂРІСЉСЂРЅР° РіСЂРµС€РєР°: ${error instanceof Error ? error.message : "РќРµРёР·РІРµСЃС‚РЅР° РіСЂРµС€РєР°"}`,
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
        message: "Р“СЂРµС€РєР° РїСЂРё РІР°Р»РёРґР°С†РёСЏ РЅР° РґР°РЅРЅРёС‚Рµ.",
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
      message: "РџСЂРѕРґР°Р¶Р±Р°С‚Р° Р±Рµ Р°РєС‚СѓР°Р»РёР·РёСЂР°РЅР° СѓСЃРїРµС€РЅРѕ.",
    };
  } catch (error: unknown) {
    console.error("updateSaleAction Error:", error);
    return {
      success: false,
      message: "Р“СЂРµС€РєР° РїСЂРё Р°РєС‚СѓР°Р»РёР·РёСЂР°РЅРµ РЅР° РїСЂРѕРґР°Р¶Р±Р°С‚Р°.",
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
        throw new Error("РџСЂРѕРґР°Р¶Р±Р°С‚Р° РЅРµ Р±Рµ РЅР°РјРµСЂРµРЅР°.");
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
          notes: `РђРЅСѓР»РёСЂР°РЅР° РїСЂРѕРґР°Р¶Р±Р° в„– ${id}`,
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

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    serverCache.invalidatePattern("sales:");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message:
        "РџСЂРѕРґР°Р¶Р±Р°С‚Р° Р±Рµ РёР·С‚СЂРёС‚Р° СѓСЃРїРµС€РЅРѕ, Р° РЅР°Р»РёС‡РЅРѕСЃС‚РёС‚Рµ РІ РјР°РіР°Р·РёРЅР° Р±СЏС…Р° РІСЉР·СЃС‚Р°РЅРѕРІРµРЅРё.",
    };
  } catch (error: unknown) {
    console.error("deleteSaleAction Error:", error);
    return {
      success: false,
      message: `Р“СЂРµС€РєР° РїСЂРё РёР·С‚СЂРёРІР°РЅРµ РЅР° РїСЂРѕРґР°Р¶Р±Р°С‚Р°: ${error instanceof Error ? error.message : "РќРµРёР·РІРµСЃС‚РЅР° РіСЂРµС€РєР°"}`,
    };
  }
}


