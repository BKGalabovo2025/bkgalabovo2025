
import {
    collection, 
    getDocs, 
    query, 
    where, 
    limit, 
    orderBy, 
    Timestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, Sale, DashboardStats, Reminder, MemberSubscription } from '@/types';

const SUBSCRIPTIONS_COLLECTION = 'memberSubscriptions';

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
 * Fetches reminders for expiring and overdue subscriptions.
 */
export const getReminders = async (): Promise<Reminder[]> => {
    const reminders: Reminder[] = [];
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Get subscriptions expiring within the next 7 days
    const expiringQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where('status', '==', 'active'),
        where('endDate', '<=', Timestamp.fromDate(sevenDaysFromNow)),
        where('endDate', '>', Timestamp.fromDate(today))
    );
    const expiringSnapshot = await getDocs(expiringQuery);

    for (const subDoc of expiringSnapshot.docs) {
        const subscription = { id: subDoc.id, ...subDoc.data() } as MemberSubscription;
        const memberDoc = await getDoc(doc(db, 'members', subscription.memberId));
        if (memberDoc.exists()) {
            const member = memberDoc.data() as Member;
            reminders.push({
                memberId: member.id,
                memberName: `${member.firstName} ${member.lastName}`,
                reminderType: 'Subscription Expiring',
                details: `Абонаментът изтича на ${new Date(subscription.endDate).toLocaleDateString('bg-BG')}`,
            });
        }
    }

    // 2. Get subscriptions that are overdue
    const overdueQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where('status', '==', 'pending_payment')
    );
    const overdueSnapshot = await getDocs(overdueQuery);

    for (const subDoc of overdueSnapshot.docs) {
        const subscription = { id: subDoc.id, ...subDoc.data() } as MemberSubscription;
        const memberDoc = await getDoc(doc(db, 'members', subscription.memberId));
        if (memberDoc.exists()) {
            const member = memberDoc.data() as Member;
            reminders.push({
                memberId: member.id,
                memberName: `${member.firstName} ${member.lastName}`,
                reminderType: 'Payment Overdue',
                details: `Просрочено плащане за абонамент.`,
            });
        }
    }

    return reminders;
};


/**
 * Gathers and summarizes statistics for the dashboard.
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
    const pendingSubsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION), where('status', '==', 'pending_payment'));
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

    // 7. Reminders
    const reminders = await getReminders();

    // Return the final, complete object
    return {
        activeMembers,
        monthlyRevenue,
        pendingSubscriptions,
        recentMembers,
        deferredExternalSales,
        deferredMemberSales, 
        reminders,
    };
};
