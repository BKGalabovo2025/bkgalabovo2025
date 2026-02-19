'use client';

import { Member } from '@/types/member.types';
import { Sale, Reminder } from '@/types';

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
 * This function can be used on the client-side.
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
