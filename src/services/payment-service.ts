
import { doc, writeBatch, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Subscription, ClubService } from '@/types';
import { getClubServiceById } from './subscription-service';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const SALES_COLLECTION = 'sales';

/**
 * Registers a payment for a subscription. This function does two critical things:
 * 1. Creates a new 'sale' document to record the financial transaction.
 * 2. Updates the corresponding subscription's status and payment history.
 */
export const registerPaymentForSubscription = async (
    subscriptionId: string,
    paymentDetails: {
        amount: number; // The amount paid, in the smallest currency unit (e.g., cents)
        paymentDate: string; // ISO string format
    }
): Promise<void> => {
    const db = getDb();
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const salesCollectionRef = collection(db, SALES_COLLECTION);

    try {
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (!subscriptionDoc.exists()) {
            throw new Error(`Subscription with ID [${subscriptionId}] not found.`);
        }

        const subscription = subscriptionDoc.data() as Subscription;

        // Create a new sale document linked to this subscription
        const saleData = {
            memberId: subscription.memberId,
            subscriptionId: subscriptionId, // <<<< CRITICAL LINK
            saleDate: new Date(paymentDetails.paymentDate),
            items: [{
                productId: subscription.serviceId,
                name: subscription.serviceName,
                quantity: 1,
                price: paymentDetails.amount,
            }],
            totalAmount: paymentDetails.amount,
            currency: subscription.currency,
            status: 'completed',
            createdAt: serverTimestamp(),
        };

        const saleDocRef = await addDoc(salesCollectionRef, saleData);

        // Now, update the subscription with the payment details
        const newPricePaid = (subscription.pricePaid || 0) + paymentDetails.amount;
        const isFullyPaid = newPricePaid >= subscription.price;

        const updatedFields: Partial<Subscription> = {
            pricePaid: newPricePaid,
            status: isFullyPaid ? 'active' : 'pending_payment',
            paymentHistory: [
                ...(subscription.paymentHistory || []),
                {
                    amount: paymentDetails.amount,
                    date: paymentDetails.paymentDate,
                    paymentId: saleDocRef.id, // Store the ID of the sale for reference
                },
            ],
        };

        const batch = writeBatch(db);
        batch.update(subscriptionRef, updatedFields);
        
        // Dynamically import and update the member
        const { updateMember } = await import('./member-service');
        await updateMember(subscription.memberId, { 
            lastPaymentDate: paymentDetails.paymentDate 
        });

        await batch.commit();

        console.log(`Successfully registered payment and created sale [${saleDocRef.id}] for subscription [${subscriptionId}]`);

    } catch (error) {
        console.error("Error registering payment for subscription:", error);
        throw error;
    }
};
