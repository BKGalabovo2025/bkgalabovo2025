import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Subscription } from '@/types';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';
const MEMBERS_COLLECTION = 'members';

export const registerPaymentForSubscription = async (
    subscriptionId: string,
    paymentDetails: { amount: number; paymentDate: string; }
): Promise<void> => {
    const db = getDb();
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);

    try {
        const subscriptionDoc = await getDoc(subscriptionRef);
        if (!subscriptionDoc.exists()) throw new Error("Абонаментът не е намерен.");

        const subscription = subscriptionDoc.data() as Subscription;

        // 1. Изчисляваме новата сума
        const newPricePaid = Number(subscription.pricePaid || 0) + Number(paymentDetails.amount);
        const isFullyPaid = newPricePaid >= subscription.price;

        // 2. Подготвяме данните за обновяване
        const updatedFields = {
            pricePaid: newPricePaid,
            status: isFullyPaid ? 'active' : 'pending_payment',
            paymentHistory: [
                ...(subscription.paymentHistory || []),
                {
                    amount: paymentDetails.amount,
                    date: paymentDetails.paymentDate,
                    paymentId: `sale_${Date.now()}`,
                },
            ],
        };

        // 3. Записваме в базата
        await updateDoc(subscriptionRef, updatedFields);

        // 4. Обновяваме и профила на члена (за да изгасне червения статус)
        const memberRef = doc(db, MEMBERS_COLLECTION, subscription.memberId);
        await updateDoc(memberRef, {
            lastPaymentDate: paymentDetails.paymentDate
        });

        console.log("Успешно платено и обновено!");
    } catch (error) {
        console.error("Грешка:", error);
        throw error;
    }
};