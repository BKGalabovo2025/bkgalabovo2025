
import {
    collection, 
    getDocs, 
    query, 
    where, 
    limit, 
    orderBy, 
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, Sale, DashboardStats } from '@/types';

// Helper to convert Firestore doc to a Sale object, ensuring dates are ISO strings
const docToSale = (doc: any): Sale => {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for consistency
    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
    const paymentDate = data.paymentDate instanceof Timestamp ? data.paymentDate.toDate().toISOString() : data.paymentDate;
    
    return {
        id: doc.id,
        ...data,
        date,
        paymentDate,
    } as Sale;
};

/**
 * Gathers and summarizes statistics for the dashboard.
 * This now includes both external and member deferred sales.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    // 1. Active members
    const membersQuery = query(collection(db, 'members'), where('status', '==', 'active'));
    const activeMembersSnapshot = await getDocs(membersQuery);
    const activeMembers = activeMembersSnapshot.size;

    // 2. Revenue for the current month from 'finances'
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    const financesQuery = query(
        collection(db, 'finances'),
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth)),
        where('type', '==', 'income')
    );
    const monthlyFinancesSnapshot = await getDocs(financesQuery);
    const monthlyRevenue = monthlyFinancesSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    // 3. Pending/overdue subscriptions
    const pendingSubsQuery = query(collection(db, 'subscriptions'), where('status', 'in', ['pending', 'overdue']));
    const pendingSubscriptionsSnapshot = await getDocs(pendingSubsQuery);
    const pendingSubscriptions = pendingSubscriptionsSnapshot.size;

    // 4. Recently registered members
    const recentMembersQuery = query(collection(db, 'members'), orderBy('registrationDate', 'desc'), limit(5));
    const recentMembersSnapshot = await getDocs(recentMembersQuery);
    const recentMembers = recentMembersSnapshot.docs.map(doc => {
        const data = doc.data() as Member;
        return { id: doc.id, firstName: data.firstName, lastName: data.lastName };
    });

    // 5. Deferred sales for external customers (no memberId)
    const deferredExternalQuery = query(
        collection(db, 'sales'),
        where('status', '==', 'deferred'),
        where('memberId', '==', null),
        orderBy('date', 'desc')
    );
    const deferredExternalSnapshot = await getDocs(deferredExternalQuery);
    const deferredExternalSales = deferredExternalSnapshot.docs.map(docToSale);

    // 6. Deferred sales for members (with a memberId)
    const deferredMemberQuery = query(
        collection(db, 'sales'),
        where('status', '==', 'deferred'),
        where('memberId', '!=', null),
        orderBy('date', 'desc')
    );
    const deferredMemberSnapshot = await getDocs(deferredMemberQuery);
    const deferredMemberSales = deferredMemberSnapshot.docs.map(docToSale);

    // Return the final, complete object
    return {
        activeMembers,
        monthlyRevenue,
        pendingSubscriptions,
        recentMembers,
        deferredExternalSales,
        deferredMemberSales, // This was the missing piece
    };
};
