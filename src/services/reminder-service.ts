"use client";

import { Member, Subscription, Reminder } from "@/types";
import { checkIsMemberOverdue } from "@/lib/membership-utils";

/**
 * Creates reminder data for members with overdue payments.
 * @param overdueMembers An array of members with overdue payments.
 * @param subscriptions An array of all subscriptions to determine the exact overdue reasons.
 * @returns An array of reminder objects.
 */
const createRemindersForOverdueMembers = (
  overdueMembers: Member[],
  subscriptions: Subscription[]
): Reminder[] => {
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month

  return overdueMembers.map((member, index) => {
    const memberSubs = subscriptions.filter(
      (sub) => sub.memberId === member.id
    );
    const overdueCheck = checkIsMemberOverdue(member, memberSubs);

    return {
      id: `overdue-${member.id}-${index}`,
      title: "Просрочено плащане",
      description: overdueCheck.reason
        ? `${member.firstName} ${member.lastName}: ${overdueCheck.reason}`
        : `Таксата за абонамента на ${member.firstName} ${member.lastName} не е платена.`,
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      type: "payment",
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      relatedId: member.id, // Link to member's profile
    };
  });
};

/**
 * Generates reminders for members with overdue payments from existing data.
 * This function can be used on the client-side.
 * @param allMembers An array of all members.
 * @param allSubscriptions An array of all subscriptions.
 * @returns An array of reminder objects.
 */
export const getReminders = (
  allMembers: Member[],
  allSubscriptions: Subscription[]
): Reminder[] => {
  const membersWithOverduePayments = allMembers.filter((member) => {
    if (member.status !== "active") {
      return false; // Ignore inactive members
    }
    const memberSubs = allSubscriptions.filter(
      (sub) => sub.memberId === member.id
    );
    const overdueCheck = checkIsMemberOverdue(member, memberSubs);
    return overdueCheck.isOverdue;
  });

  return createRemindersForOverdueMembers(
    membersWithOverduePayments,
    allSubscriptions
  );
};
