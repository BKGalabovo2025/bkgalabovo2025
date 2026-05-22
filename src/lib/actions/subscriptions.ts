"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  createSubscriptionInternal,
  updateSubscriptionInternal,
  deleteSubscriptionInternal,
} from "@/lib/db/subscriptions";
import {
  subscriptionSchema,
  subscriptionUpdateSchema,
} from "@/lib/schemas/subscriptions";

export type SubscriptionActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: unknown;
};

/**
 * Creates a new subscription and an associated sale record.
 */
export async function createSubscriptionAction(
  idToken: string,
  subscriptionData: Record<string, unknown>
): Promise<SubscriptionActionState> {
  try {
    const user = await getAuthUser(idToken);

    // Validate data
    const validatedData = subscriptionSchema.parse(subscriptionData);

    const subId = await createSubscriptionInternal(validatedData, {
      uid: user.uid,
      email: user.email,
    });

    revalidatePath("/members");
    if (subscriptionData.memberId) {
      revalidatePath(`/members/${subscriptionData.memberId}`);
    }
    revalidatePath("/sales");

    return {
      success: true,
      message: "Абонаментът бе създаден успешно.",
      data: { id: subId },
    };
  } catch (error: unknown) {
    console.error("createSubscriptionAction Error:", error);
    return {
      success: false,
      message: `Грешка при създаване на абонамент: ${error instanceof Error ? error.message : "Неизвестна грешка"}`,
    };
  }
}

/**
 * Updates an existing subscription.
 */
export async function updateSubscriptionAction(
  idToken: string,
  id: string,
  subscriptionUpdate: Record<string, unknown>
): Promise<SubscriptionActionState> {
  try {
    await getAuthUser(idToken);

    // Validate data
    const validatedData = subscriptionUpdateSchema.parse(subscriptionUpdate);

    await updateSubscriptionInternal(id, validatedData);

    revalidatePath("/members");
    revalidatePath("/sales");

    return {
      success: true,
      message: "Абонаментът бе актуализиран успешно.",
    };
  } catch (error: unknown) {
    console.error("updateSubscriptionAction Error:", error);
    return {
      success: false,
      message: "Грешка при актуализиране на абонамента.",
    };
  }
}

/**
 * Deletes a subscription.
 */
export async function deleteSubscriptionAction(
  idToken: string,
  id: string
): Promise<SubscriptionActionState> {
  try {
    await getAuthUser(idToken);

    await deleteSubscriptionInternal(id);

    revalidatePath("/members");
    revalidatePath("/sales");

    return {
      success: true,
      message: "Абонаментът бе изтрит успешно.",
    };
  } catch (error: unknown) {
    console.error("deleteSubscriptionAction Error:", error);
    return {
      success: false,
      message: "Грешка при изтриване на абонамента.",
    };
  }
}

/**
 * Mass deletes all subscriptions with status "pending_payment" and pricePaid === 0,
 * along with their corresponding sales in Firestore.
 */
export async function clearUnpaidSubscriptionsAction(
  idToken: string
): Promise<SubscriptionActionState> {
  try {
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const snapshot = await adminDb
      .collection("memberSubscriptions")
      .where("status", "==", "pending_payment")
      .where("pricePaid", "==", 0)
      .get();

    if (snapshot.empty) {
      return {
        success: true,
        message: "Няма намерени неплатени чакащи абонаменти за изчистване.",
      };
    }

    const subIds = snapshot.docs.map((doc) => doc.id);
    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    for (const subId of subIds) {
      const salesSnap = await adminDb
        .collection("sales")
        .where("subscriptionId", "==", subId)
        .get();

      salesSnap.docs.forEach((saleDoc) => {
        batch.delete(saleDoc.ref);
      });
    }

    await batch.commit();

    revalidatePath("/members");
    revalidatePath("/sales");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Успешно изтрити ${snapshot.size} неплатени чакащи абонамента и свързаните с тях транзакции.`,
    };
  } catch (error: unknown) {
    console.error("clearUnpaidSubscriptionsAction Error:", error);
    return {
      success: false,
      message: "Грешка при масово изтриване на неплатените абонаменти.",
    };
  }
}
