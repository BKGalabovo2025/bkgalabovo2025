"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth-utils";
import { 
  createSubscriptionInternal, 
  updateSubscriptionInternal,
  deleteSubscriptionInternal 
} from "@/lib/db/subscriptions";
import { subscriptionSchema, subscriptionUpdateSchema } from "@/lib/schemas/subscriptions";

export type SubscriptionActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
  data?: any;
};

/**
 * Creates a new subscription and an associated sale record.
 */
export async function createSubscriptionAction(
  idToken: string,
  subscriptionData: any
): Promise<SubscriptionActionState> {
  try {
    const user = await getAuthUser(idToken);
    
    // Validate data
    const validatedData = subscriptionSchema.parse(subscriptionData);
    
    const subId = await createSubscriptionInternal(validatedData, {
      uid: user.uid,
      email: user.email
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
  subscriptionUpdate: any
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
