
import {
    collection, 
    getDocs, 
    query, 
    where, 
    limit, 
    orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, Payment, Subscription } from '@/types';

// Дефиниция на структурата на данните, които ще се връщат
export interface DashboardStats {
    activeMembers: number;
    monthlyRevenue: number;
    pendingSubscriptions: number;
    recentMembers: Pick<Member, 'id' | 'firstName' | 'lastName'>[];
}

/**
 * Събира и обобщава статистики за таблото за управление.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    // --- 1. Изчисляване на активните членове --- //
    const membersQuery = query(collection(db, 'members'), where('status', '==', 'active'));
    const activeMembersSnapshot = await getDocs(membersQuery);
    const activeMembers = activeMembersSnapshot.size;

    // --- 2. Изчисляване на приходите за текущия месец --- //
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const paymentsQuery = query(
        collection(db, 'payments'),
        where('paymentDate', '>=', startOfMonth),
        where('paymentDate', '<=', endOfMonth)
    );
    const monthlyPaymentsSnapshot = await getDocs(paymentsQuery);
    const monthlyRevenue = monthlyPaymentsSnapshot.docs
        .reduce((sum, doc) => sum + (doc.data() as Payment).amount, 0);

    // --- 3. Брой на чакащи/просрочени абонаменти --- //
    const pendingSubsQuery = query(collection(db, 'subscriptions'), where('status', 'in', ['pending', 'overdue']));
    const pendingSubscriptionsSnapshot = await getDocs(pendingSubsQuery);
    const pendingSubscriptions = pendingSubscriptionsSnapshot.size;

    // --- 4. Извличане на последните регистрирани членове --- //
    const recentMembersQuery = query(
        collection(db, 'members'), 
        orderBy('registrationDate', 'desc'), 
        limit(5)
    );
    const recentMembersSnapshot = await getDocs(recentMembersQuery);
    const recentMembers = recentMembersSnapshot.docs.map(doc => {
        const data = doc.data() as Member;
        return { id: doc.id, firstName: data.firstName, lastName: data.lastName };
    });

    // --- Връщане на финалния обект --- //
    return {
        activeMembers,
        monthlyRevenue,
        pendingSubscriptions,
        recentMembers
    };
};
