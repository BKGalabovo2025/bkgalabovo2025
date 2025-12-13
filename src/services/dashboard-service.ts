
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
import { Member, Payment, Subscription, Sale } from '@/types';

// Helper function to convert a Firestore doc to a Sale object
const docToSale = (doc: any): Sale => {
    const data = doc.data();
    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
    const paymentDate = data.paymentDate instanceof Timestamp ? data.paymentDate.toDate().toISOString() : data.paymentDate;
    return {
        id: doc.id,
        ...data,
        date,
        paymentDate,
    } as Sale;
};

// Definition of the data structure to be returned
export interface DashboardStats {
    activeMembers: number;
    monthlyRevenue: number;
    pendingSubscriptions: number;
    recentMembers: Pick<Member, 'id' | 'firstName' | 'lastName'>[];
    deferredExternalSales: Sale[]; // Added this line
}

/**
 * Gathers and summarizes statistics for the dashboard.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    // --- 1. Calculate active members --- //
    const membersQuery = query(collection(db, 'members'), where('status', '==', 'active'));
    const activeMembersSnapshot = await getDocs(membersQuery);
    const activeMembers = activeMembersSnapshot.size;

    // --- 2. Calculate revenue for the current month --- //
    // This part now needs to query the 'finances' collection instead of 'payments'
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
    const monthlyRevenue = monthlyFinancesSnapshot.docs
        .reduce((sum, doc) => sum + doc.data().amount, 0);

    // --- 3. Count pending/overdue subscriptions --- //
    const pendingSubsQuery = query(collection(db, 'subscriptions'), where('status', 'in', ['pending', 'overdue']));
    const pendingSubscriptionsSnapshot = await getDocs(pendingSubsQuery);
    const pendingSubscriptions = pendingSubscriptionsSnapshot.size;

    // --- 4. Fetch recently registered members --- //
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

    // --- 5. Fetch deferred sales for external customers --- //
    const deferredSalesQuery = query(
        collection(db, 'sales'),
        where('status', '==', 'deferred'),
        where('memberId', '==', null),
        orderBy('date', 'desc')
    );
    const deferredSalesSnapshot = await getDocs(deferredSalesQuery);
    const deferredExternalSales = deferredSalesSnapshot.docs.map(docToSale);

    // --- Return the final object --- //
    return {
        activeMembers,
        monthlyRevenue,
        pendingSubscriptions,
        recentMembers,
        deferredExternalSales // Added this line
    };
};
