import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Subscription } from "@/types";
import { getSiteConfig } from "@/config/sites";

/**
 * Creates a new subscription and an associated sale record using Admin SDK.
 */
export async function createSubscriptionInternal(
  subscriptionData: Omit<Subscription, "id" | "siteId">,
  user: { uid: string; email?: string | null }
): Promise<string> {
  const adminDb = getAdminDb();
  const subRef = adminDb.collection("memberSubscriptions").doc();
  const isPaid = subscriptionData.pricePaid >= subscriptionData.price;
  const saleStatus = isPaid
    ? subscriptionData.price > 0
      ? "completed"
      : "informational"
    : "pending";

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
      siteId: getSiteConfig().id,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Create sale record
    const saleRef = adminDb.collection("sales").doc();
    transaction.set(saleRef, saleData);

    // 3. Update member's last payment date ONLY if it's actually paid
    if (
      subscriptionData.price > 0 &&
      subscriptionData.status !== "pending_payment" &&
      subscriptionData.pricePaid > 0
    ) {
      const memberRef = adminDb
        .collection("members")
        .doc(subscriptionData.memberId);
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

  await adminDb.runTransaction(async (transaction) => {
    const subDoc = await transaction.get(subRef);
    if (!subDoc.exists) {
      throw new Error("Subscription not found");
    }

    const subData = subDoc.data()!;
    const memberId = subData.memberId;

    // Perform the update
    transaction.update(subRef, {
      ...subscriptionUpdate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Check if the payment status is updated to active OR if pricePaid is increased
    const wasPending = subData.status === "pending_payment";
    const becameActive = subscriptionUpdate.status === "active";
    const pricePaidIncreased =
      subscriptionUpdate.pricePaid !== undefined &&
      subscriptionUpdate.pricePaid > (subData.pricePaid || 0);

    if (memberId && ((wasPending && becameActive) || pricePaidIncreased)) {
      const memberRef = adminDb.collection("members").doc(memberId);
      transaction.update(memberRef, {
        lastPaymentDate: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}
/**
 * Deletes a subscription and its associated sales using Admin SDK in a transaction.
 */
export async function deleteSubscriptionInternal(id: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.runTransaction(async (transaction) => {
    // 1. Delete subscription
    const subRef = adminDb.collection("memberSubscriptions").doc(id);
    transaction.delete(subRef);

    // 2. Find and delete associated sales
    const salesSnapshot = await adminDb
      .collection("sales")
      .where("subscriptionId", "==", id)
      .get();

    salesSnapshot.docs.forEach((doc) => {
      transaction.delete(doc.ref);
    });
  });
}
