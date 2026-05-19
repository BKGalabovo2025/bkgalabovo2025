"use server";

import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
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
      // 1. Create the Sale record
      transaction.set(newSaleRef, {
        ...data,
        saleDate: Timestamp.fromDate(new Date(data.saleDate)),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: { uid: user.uid, email: user.email },
      });

      // 2. Update inventory and log events for each item
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

        transaction.update(productRef, { stock: newStock });

        const eventRef = adminDb.collection("inventory_events").doc();
        transaction.set(eventRef, {
          id: eventRef.id,
          productId: item.productId,
          productName: item.name,
          type: "sale",
          quantityChange: -item.quantity,
          createdAt: new Date().toISOString(),
          userId: user.uid,
          userName: user.displayName || user.email,
          relatedSaleId: newSaleRef.id,
        });
      }
    });

    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

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

    await saleRef.update(dataToUpdate);

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);

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
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    await adminDb.collection("sales").doc(id).delete();

    revalidatePath("/sales");

    return {
      success: true,
      message: "Продажбата бе изтрита успешно.",
    };
  } catch (error: unknown) {
    console.error("deleteSaleAction Error:", error);
    return {
      success: false,
      message: "Грешка при изтриване на продажбата.",
    };
  }
}

/**
 * Self-healing action to ensure a sale exists for a subscription payment.
 * This is used primarily for receipt generation.
 */
export async function findOrCreateSaleForSubscriptionAction(
  idToken: string,
  subscription: Record<string, unknown>
): Promise<SaleActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    if (!subscription.id) {
      throw new Error("Subscription ID is required");
    }

    const existingSalesSnapshot = await adminDb
      .collection("sales")
      .where("subscriptionId", "==", subscription.id)
      .limit(1)
      .get();

    const paymentHistory = subscription.paymentHistory as
      | Array<{
          date: string;
          amount: number;
          paymentMethod?: string;
          note?: string;
        }>
      | undefined;
    const latestPayment =
      paymentHistory && paymentHistory.length > 0
        ? paymentHistory[paymentHistory.length - 1]
        : undefined;

    if (!existingSalesSnapshot.empty) {
      const existingDoc = existingSalesSnapshot.docs[0];
      await existingDoc.ref.update({
        isPaid: true,
        status: "completed",
        paymentMethod: latestPayment?.paymentMethod || "В брой",
        note: latestPayment?.note || "",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return {
        success: true,
        data: { id: existingDoc.id },
      };
    }

    // 2. No sale found, create one based on latest payment
    if (!latestPayment || !subscription.memberId) {
      return {
        success: false,
        message: "Няма информация за плащане в абонамента.",
      };
    }

    const saleId = await adminDb.runTransaction(async (transaction) => {
      const newSaleRef = adminDb.collection("sales").doc();
      const subscriptionRef = adminDb
        .collection("member_subscriptions")
        .doc(subscription.id as string);

      const saleData = {
        siteId: "default",
        memberId: subscription.memberId,
        subscriptionId: subscription.id,
        saleDate: Timestamp.fromDate(new Date(latestPayment.date)),
        items: [
          {
            productId: subscription.serviceId,
            name: subscription.serviceName,
            quantity: 1,
            price: latestPayment.amount,
          },
        ],
        totalAmount: latestPayment.amount,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        paymentMethod: latestPayment.paymentMethod || "В брой",
        note: latestPayment.note || "",
        createdAt: FieldValue.serverTimestamp(),
        createdBy: { uid: user.uid, email: user.email },
      };

      transaction.set(newSaleRef, saleData);

      // Update payment history with saleId
      const updatedPaymentHistory = (paymentHistory || []).map((p, i) =>
        i === (paymentHistory?.length || 1) - 1
          ? { ...p, saleId: newSaleRef.id }
          : p
      );
      transaction.update(subscriptionRef, {
        paymentHistory: updatedPaymentHistory,
      });

      return newSaleRef.id;
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Квитанцията бе генерирана успешно.",
      data: { id: saleId },
    };
  } catch (error: unknown) {
    console.error("findOrCreateSaleForSubscriptionAction Error:", error);
    return {
      success: false,
      message: `Грешка при генериране на квитанция: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}
