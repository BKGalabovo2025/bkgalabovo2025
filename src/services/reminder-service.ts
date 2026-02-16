
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Member } from '@/types/member.types';
import { Sale, Reminder } from '@/types';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase-collections';

/**
 * Finds members with overdue monthly subscription payments for the current month by fetching fresh data from the database.
 * This is used by the API route for sending email reminders.
 * @returns A promise that resolves to an array of members with overdue payments.
 */
export const getOverdueMembers = async (): Promise<Member[]> => {
  const db = getDb();
  const membersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.members);
  const salesCollectionRef = collection(db, FIRESTORE_COLLECTIONS.sales);

  const [membersSnapshot, salesSnapshot] = await Promise.all([
    getDocs(membersCollectionRef),
    getDocs(salesCollectionRef),
  ]);

  const allMembers = membersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Member));
  const allSales = salesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));

  // This logic is duplicated in getReminders. Consider refactoring if it becomes complex.
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const membersWithPaymentsThisMonth = new Set<string>();

  allSales.forEach(sale => {
    const isSubscriptionPayment = sale.items.some(item => item.name.toLowerCase().includes('такса'));
    if (!isSubscriptionPayment) {
        return;
    }

    const saleDate = new Date(sale.date);
    if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
      if (sale.memberId) {
        membersWithPaymentsThisMonth.add(sale.memberId);
      }
    }
  });

  const overdueMembers = allMembers.filter(member => {
    if(member.status !== 'active') {
        return false;
    }
    return !membersWithPaymentsThisMonth.has(member.id);
  });

  return overdueMembers;
};

/**
 * Generates reminders for overdue payments from existing in-memory data.
 * This is used to display reminders on the dashboard efficiently.
 * @param allMembers - Array of all member objects.
 * @param allSales - Array of all sale objects.
 * @returns An array of Reminder objects for display.
 */
export const getReminders = (allMembers: Member[], allSales: Sale[]): Reminder[] => {
  const paymentReminders: Reminder[] = [];
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const membersWithPaymentsThisMonth = new Set<string>();

  allSales.forEach(sale => {
      const isSubscriptionPayment = sale.items.some(item => item.name.toLowerCase().includes('такса'));
      if (!isSubscriptionPayment) {
          return;
      }

      const saleDate = new Date(sale.date);
      if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          if (sale.memberId) {
              membersWithPaymentsThisMonth.add(sale.memberId);
          }
      }
  });

  const overdueMembers = allMembers.filter(member => {
      if (member.status !== 'active') {
          return false;
      }
      return !membersWithPaymentsThisMonth.has(member.id);
  });

  overdueMembers.forEach(member => {
    paymentReminders.push({
      id: `payment-${member.id}`,
      title: 'Неплатена такса',
      description: `${member.name} е с просрочена месечна такса.`,
      relatedId: member.id,
      type: 'payment'
    });
  });

  // In the future, other reminder types (like low inventory) can be added here.

  return paymentReminders;
}

