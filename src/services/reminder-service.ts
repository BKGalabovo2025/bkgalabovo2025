'use client';

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
  const membersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERS);
  const salesCollectionRef = collection(db, FIRESTORE_COLLECTIONS.SALES);

  const [membersSnapshot, salesSnapshot] = await Promise.all([
    getDocs(membersCollectionRef),
    getDocs(salesCollectionRef),
  ]);

  const allMembers = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
  const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const membersWithOverduePayments = allMembers.filter(member => {
    // Check if the member has an active subscription for the current month.
    const hasCurrentSubscription = allSales.some(sale =>
      sale.memberId === member.id &&
      sale.subscriptionId && // Check if it's a subscription sale
      new Date(sale.saleDate).getMonth() === currentMonth &&
      new Date(sale.saleDate).getFullYear() === currentYear
    );

    // If there is no sale for a subscription this month, their payment is overdue.
    return !hasCurrentSubscription;
  });

  return membersWithOverduePayments;
};

/**
 * Creates reminder data for members with overdue payments.
 * @param overdueMembers An array of members with overdue payments.
 * @returns An array of reminder objects.
 */
export const createRemindersForOverdueMembers = (overdueMembers: Member[]): Reminder[] => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
  
    return overdueMembers.map((member, index) => ({
      id: `overdue-${member.id}-${index}`,
      title: 'Просрочено плащане',
      description: `Таксата за абонамента на ${member.firstName} ${member.lastName} за текущия месец не е платена.`,
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      type: 'payment',
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      relatedId: member.id, // Link to member's profile
    }));
  };

/**
 * Generates reminders for members with overdue payments from existing data.
 * @param allMembers An array of all members.
 * @param allSales An array of all sales.
 * @returns An array of reminder objects.
 */
export const getReminders = (allMembers: Member[], allSales: Sale[]): Reminder[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const membersWithOverduePayments = allMembers.filter(member => {
    const hasCurrentSubscription = allSales.some(sale =>
      sale.memberId === member.id &&
      sale.subscriptionId && // Check if it's a subscription sale
      new Date(sale.saleDate).getMonth() === currentMonth &&
      new Date(sale.saleDate).getFullYear() === currentYear
    );
    return !hasCurrentSubscription;
  });

  return createRemindersForOverdueMembers(membersWithOverduePayments);
};
