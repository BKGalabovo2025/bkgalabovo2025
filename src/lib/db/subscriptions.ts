import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Subscription } from "@/types";

/**
 * Creates a new subscription and an associated sale record using Admin SDK.
 */
export async function createSubscriptionInternal(
  subscriptionData: Omit<Subscription, "id">,
  user: { uid: string; email?: string | null }
): Promise<string> {
  const adminDb = getAdminDb();
  const subRef = adminDb.collection("memberSubscriptions").doc();
  const saleStatus = subscriptionData.price > 0 ? "completed" : "informational";

  const saleData = {
    siteId: "default",
    memberId: subscriptionData.memberId,
    subscriptionId: subRef.id,
    saleDate: Timestamp.now(),
    items: [
      {
        productId: subscriptionData.serviceId,
        name: subscriptionData.serviceName,
        quantity: 1,
        price: subscriptionData.price,
      },
    ],
    totalAmount: subscriptionData.price,
    currency: subscriptionData.currency || "EUR",
    isPaid: subscriptionData.pricePaid >= subscriptionData.price,
    status: saleStatus,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: { uid: user.uid, email: user.email || "system" },
  };

  await adminDb.runTransaction(async (transaction) => {
    // 1. Save subscription
    transaction.set(subRef, {
      ...subscriptionData,
      id: subRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Create sale record
    const saleRef = adminDb.collection("sales").doc();
    transaction.set(saleRef, saleData);

    // 3. Update member's last payment date if price > 0
    if (subscriptionData.price > 0) {
      const memberRef = adminDb.collection("members").doc(subscriptionData.memberId);
      transaction.update(memberRef, {
        lastPaymentDate: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return subRef.id;
}

/**
 * Updates an existing subscription using Admin SDK.
 */
export async function updateSubscriptionInternal(
  id: string,
  subscriptionUpdate: Partial<Subscription>
): Promise<void> {
  const adminDb = getAdminDb();
  const subRef = adminDb.collection("memberSubscriptions").doc(id);
  
  await subRef.update({
    ...subscriptionUpdate,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
/**
 * Deletes a subscription using Admin SDK.
 */
export async function deleteSubscriptionInternal(id: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("memberSubscriptions").doc(id).delete();
}
