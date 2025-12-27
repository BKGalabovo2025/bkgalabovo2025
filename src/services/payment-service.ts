
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { MemberSubscription, ClubService } from '@/types';
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
        amount: number; // The amount paid, in the smallest currency unit (e.g., stotinki)
        paymentDate: string; // ISO string format
        notes?: string;
    }
): Promise<void> => {
    const db = getDb();
    const batch = writeBatch(db);
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);

    try {
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (!subscriptionDoc.exists()) {
            throw new Error(`Subscription with ID [${subscriptionId}] not found.`);
        }

        const subscription = subscriptionDoc.data() as MemberSubscription;

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
                ...(paymentDetails.notes && { notes: paymentDetails.notes }),
            },
        ];

        // 2. Determine new status and granted rights
        const updatedFields: Partial<MemberSubscription> = {
            status: 'active',
            pricePaid: (subscription.pricePaid || 0) + paymentDetails.amount,
            paymentsMadeCount: newPaymentsCount,
            paymentHistory: newPaymentHistory,
        };

        // 3. Check if any special rights are triggered with this payment
        if (service.specialRights && service.specialRights.length > 0) {
            service.specialRights.forEach(right => {
                if (right.trigger.condition === 'AFTER_N_PAYMENTS' && newPaymentsCount >= (right.trigger.paymentCount || 1)) {
                    if (right.right === 'kartoteka') {
                        updatedFields.licenseGranted = true;
                    }
                    if (right.right === 'equipment') {
                        updatedFields.apparelGranted = true;
                    }
                }
            });
        }

        // --- End Core Logic --- //

        // Add the update operation to the batch
        batch.update(subscriptionRef, updatedFields);

        // Commit the batch to perform all writes atomically
        await batch.commit();

        console.log(`Successfully registered payment for subscription ID: ${subscriptionId}`);

    } catch (error) {
        console.error("Error registering payment for subscription:", error);
        // Re-throw the error to be handled by the calling UI component
        throw error;
    }
};
