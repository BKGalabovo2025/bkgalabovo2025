import { Member, Sale, Reminder } from "@/types";
import { checkIsMemberOverdue } from "@/lib/membership-utils";

/**
 * Creates reminder data for members with overdue payments (unpaid sales).
 * @param overdueMembers An array of members with overdue payments.
 * @param allMembers An array of all members.
 * @param sales An array of all sales to check for unpaid items.
 * @returns An array of reminder objects.
 */
const createRemindersForOverdueMembers = (
  overdueMembers: Member[],
  allMembers: Member[],
  sales: Sale[]
): Reminder[] => {
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month

  return overdueMembers.map((member, index) => {
    const familyMembers = member.familyId
      ? allMembers.filter((m) => m.familyId === member.familyId && m.id !== member.id && m.status === "active")
      : [];
    
    const overdueCheck = checkIsMemberOverdue(member, familyMembers, sales);

    return {
      id: `overdue-${member.id}-${index}`,
      title: "Просрочено плащане",
      description: overdueCheck.reason
        ? `${member.firstName} ${member.lastName}: ${overdueCheck.reason}`
        : `Има неплатени задължения за ${member.firstName} ${member.lastName}.`,
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
 * @param allSales An array of all sales.
 * @returns An array of reminder objects.
 */
export const getReminders = (
  allMembers: Member[],
  allSales: Sale[]
): Reminder[] => {
  const membersWithOverduePayments = allMembers.filter((member) => {
    if (member.status !== "active") {
      return false; // Ignore inactive members
    }
    const familyMembers = member.familyId
      ? allMembers.filter((m) => m.familyId === member.familyId && m.id !== member.id && m.status === "active")
      : [];
    const overdueCheck = checkIsMemberOverdue(member, familyMembers, allSales);
    return overdueCheck.isOverdue;
  });

  return createRemindersForOverdueMembers(
    membersWithOverduePayments,
    allMembers,
    allSales
  );
};
