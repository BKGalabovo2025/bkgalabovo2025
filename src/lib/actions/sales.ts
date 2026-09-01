"use server";
import "server-only";

import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";

import { logAuditEvent } from "@/lib/audit-logger";
import { getAuthUser, getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { ClubService, Family, Member, Sale } from "@/types";
import { SaleSchema } from "@/types/sale.types";

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

    // Audit log
    await logAuditEvent({
      action: "create_sale",
      targetCollection: "sales",
      targetId: newSaleRef.id,
      siteId: (data.siteId as string) || "bkgalabovo",
      details: `Регистрирана продажба № ${newSaleRef.id} за ${data.totalAmount || 0} лв. (${data.paymentMethod || "В брой"})`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        clientName: data.clientName,
        itemsCount: data.items?.length || 0,
      },
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
    if (
      deletedSaleData.type === "general_service" ||
      deletedSaleData.reservationId
    ) {
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

    // 6. Delete associated service history events
    const historyBatch = adminDb.batch();

    const serviceHistorySnapshot = await adminDb
      .collection("serviceHistory")
      .where("relatedSaleId", "==", id)
      .get();
    serviceHistorySnapshot.docs.forEach((doc: any) => {
      historyBatch.delete(doc.ref);
    });

    const generalServiceHistorySnapshot = await adminDb
      .collection("generalServiceHistory")
      .where("relatedSaleId", "==", id)
      .get();
    generalServiceHistorySnapshot.docs.forEach((doc: any) => {
      historyBatch.delete(doc.ref);
    });

    await historyBatch.commit();

    // Audit log
    await logAuditEvent({
      action: "delete_sale",
      targetCollection: "sales",
      targetId: id,
      siteId: (deletedSaleData?.siteId as string) || "bkgalabovo",
      details: `Анулирана/изтрита продажба № ${id} за ${deletedSaleData?.totalAmount || 0} лв.`,
      userId: user.uid,
      userEmail: user.email || undefined,
      metadata: {
        totalAmount: deletedSaleData?.totalAmount,
        clientName: deletedSaleData?.clientName,
      },
    });

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

// Помощна функция за преобразуване на Firestore документи с конвертиране на Timestamps в ISO низове
function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: any): any => {
    if (!val) return val;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: any = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps(val[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
}

/**
 * �?звлича всички продажби на сървъра.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getInventorySalesServerAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const sales = await getCachedSalesForBranch(activeBranch);

    return {
      success: true,
      data: sales,
    };
  } catch (error: unknown) {
    console.error("Error getInventorySalesServerAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при извличане на продажбите.",
    };
  }
}

/**
 * �?звлича пълните детайли по разписка на сървъра.
 */
/* eslint-disable sonarjs/cognitive-complexity */
export async function getReceiptDetailsServerAction(saleId: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const adminDb = getAdminDb();
    const saleSnap = await adminDb.collection("sales").doc(saleId).get();

    if (!saleSnap.exists) {
      return {
        success: false,
        error: "Продажбата не е намерена.",
      };
    }

    const sale = snapToData<Sale>(saleSnap);
    if (!sale) {
      console.error("Sale data is incomplete:", sale);
      return {
        success: false,
        error: "Непълни данни за продажбата.",
      };
    }

    const isGuest = sale.memberId === "GUEST_EXTERNAL";
    const isWalkIn = !sale.memberId || sale.memberId === "Walk-in Customer";
    const shouldFetchMember = !isGuest && !isWalkIn && sale.memberId;

    // Паралелно извличане на основните свързани документи
    const memberSnap = shouldFetchMember
      ? await adminDb.collection("members").doc(sale.memberId).get()
      : null;

    let member =
      memberSnap && memberSnap.exists ? snapToData<Member>(memberSnap) : null;

    if (!member) {
      if (sale.memberId === "GUEST_EXTERNAL") {
        member = {
          id: "GUEST_EXTERNAL",
          firstName: "Външен",
          lastName: "гост",
          email: "",
          phone: "",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          siteId: sale.siteId || "bkgalabovo",
        } as unknown as Member;
      } else {
        member = {
          id: sale.memberId || "Walk-in Customer",
          firstName: "Външен",
          lastName: "клиент",
          email: "",
          phone: "",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          siteId: sale.siteId || "bkgalabovo",
        } as unknown as Member;
      }
    }

    // �?звличане на свързана услуга (ако е необходимо)
    const service: ClubService | null = null;

    // �?звличане на свързано лице (родител/дете)
    let relatedMember: Member | null = null;
    if (member.relatedMemberId) {
      const relatedSnap = await adminDb
        .collection("members")
        .doc(member.relatedMemberId)
        .get();
      relatedMember = snapToData<Member>(relatedSnap);
    }

    // �?звличане на семейство и други членове на семейството
    let family: Family | null = null;
    const familyMembers: Member[] = [];

    const familyQuerySnapshot = await adminDb
      .collection("families")
      .where("memberIds", "array-contains", sale.memberId)
      .limit(1)
      .get();

    if (!familyQuerySnapshot.empty) {
      const familyDoc = familyQuerySnapshot.docs[0];
      family = snapToData<Family>(familyDoc);

      if (family && family.memberIds && family.memberIds.length > 0) {
        const otherMemberIds = family.memberIds.filter(
          (id) => id !== sale.memberId
        );
        if (otherMemberIds.length > 0) {
          // Взимаме останалите членове на семейството
          const otherMembersPromises = otherMemberIds.map((id) =>
            adminDb.collection("members").doc(id).get()
          );
          const otherMembersSnaps = await Promise.all(otherMembersPromises);
          otherMembersSnaps.forEach((mSnap) => {
            const m = snapToData<Member>(mSnap);
            if (m) familyMembers.push(m);
          });
        }
      }
    }

    return {
      success: true,
      data: {
        sale,
        member,
        relatedMember,
        service,
        family,
        familyMembers,
      },
    };
  } catch (error: unknown) {
    console.error("Error getReceiptDetailsServerAction:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при извличане на детайлите за разписката.",
    };
  }
}

/**
 * Извлича продажбите за конкретен тип услуга.
 * Обединява getTrainingServiceSalesAction, getRecoveryServiceSalesAction и getGeneralServiceSalesAction.
 */
export async function getServiceSalesAction(
  serviceType: "training_service" | "recovery_service" | "general_service",
  activeBranch: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    let query: admin.firestore.Query = adminDb
      .collection("sales")
      .where("type", "==", serviceType);

    if (activeBranch && activeBranch !== "bkgalabovo") {
      query = query.where("siteId", "==", activeBranch);
    }

    const snapshot = await query.get();
    const sales = snapshot.docs
      .map((doc) => snapToData<Sale>(doc))
      .filter((s): s is Sale => s !== null)
      .sort(
        (a, b) =>
          new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );

    return { success: true, data: sales };
  } catch (error: unknown) {
    console.error("Error getServiceSalesAction [%s]:", serviceType, error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при зареждане на продажби.",
    };
  }
}

export async function createCampFeeSaleAction(
  eventId: string,
  eventTitle: string,
  memberId: string,
  memberName: string,
  amount: number,
  feeTypeLabel: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Неоторизиран достъп.");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const saleRef = adminDb.collection("sales").doc();
    const newSale = {
      siteId: "bkgalabovo",
      memberId: memberId,
      clientName: memberName,
      saleDate: now,
      createdAt: now,
      type: "camp_fee",
      currency: "EUR",
      isPaid: true,
      paymentMethod: "В брой",
      status: "completed",
      totalAmount: amount,
      items: [
        {
          id: `item-${Date.now()}`,
          productId: eventId,
          name: `${eventTitle} - ${feeTypeLabel}`,
          price: amount,
          quantity: 1,
          total: amount,
        },
      ],
      createdBy: { uid: user.uid, email: user.email },
    };

    await saleRef.set(newSale);

    revalidatePath("/sales");
    revalidatePath("/club/team");
    revalidatePath("/members");
    serverCache.invalidatePattern("sales:");

    return { success: true, saleId: saleRef.id };
  } catch (error: unknown) {
    console.error("Error createCampFeeSaleAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на документ за лагер.",
    };
  }
}
