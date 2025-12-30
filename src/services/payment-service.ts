
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Subscription, ClubService } from '@/types';
import { getClubServiceById } from './subscription-service';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';

/**
 * Registers a payment for a specific member subscription and updates its status.
 *
 * @param subscriptionId The ID of the member subscription to update.
 * @param paymentDetails The details of the payment being made.
 * @returns A promise that resolves when the operation is complete.
 */
export const registerPaymentForSubscription = async (
    subscriptionId: string,
    paymentDetails: {
        amount: number; // The amount paid
        paymentDate: string; // ISO string format
        paymentId: string; // The ID of the payment document
    }
): Promise<void> => {
    const db = getDb();
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);

    try {
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (!subscriptionDoc.exists()) {
            throw new Error(`Subscription with ID [${subscriptionId}] not found.`);
        }

        const subscription = subscriptionDoc.data() as Subscription;

        const service = await getClubServiceById(subscription.serviceId);
        if (!service) {
            throw new Error(`Underlying service with ID [${subscription.serviceId}] not found for subscription.`);
        }

        // --- Core Logic --- //

        // 1. Increment payment count & add to history
        const newPaymentsCount = (subscription.paymentsMadeCount || 0) + 1;
        const newPaymentHistory = [
            ...(subscription.paymentHistory || []),
            {
                amount: paymentDetails.amount,
                date: paymentDetails.paymentDate,
                paymentId: paymentDetails.paymentId,
            },
        ];

        const isFullyPaid = newPaymentsCount >= subscription.totalPaymentsCount;

        // 2. Determine new status
        const updatedFields: Partial<Subscription> = {
            pricePaid: (subscription.pricePaid || 0) + paymentDetails.amount,
            paymentsMadeCount: newPaymentsCount,
            paymentHistory: newPaymentHistory,
            status: isFullyPaid ? 'active' : 'pending_payment' // Or some other logic
        };

        // --- End Core Logic --- //

        // Update the document
        await writeBatch(db).update(subscriptionRef, updatedFields).commit();

        console.log(`Successfully registered payment for subscription ID: ${subscriptionId}`);

    } catch (error) {
        console.error("Error registering payment for subscription:", error);
        // Re-throw the error to be handled by the calling UI component
        throw error;
    }
};
