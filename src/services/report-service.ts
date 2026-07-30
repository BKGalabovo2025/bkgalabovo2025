import { Member } from "@/types";

import { getAllMembers } from "./member-service";
import { hasMemberPaidForMonth } from "./sales-service";
import { getEventsForPeriod } from "./schedule-service";

export interface AttendanceReportItem {
  member: Member;
  attendanceCount: number;
}

/**
 * Генерира отчет за задълженията за даден месец и година.
 * @param year Годината на проверката.
 * @param month Месецът на проверката (1-12).
 * @returns Масив от членове, които не са платили.
 */
export const generateLiabilityReport = async (
  year: number,
  month: number
): Promise<Member[]> => {
  const allMembers = await getAllMembers();

  // Създаваме масив от обещания, където всяко обещание проверява дали членът е платил.
  const paymentChecks = await Promise.all(
    allMembers.map(async (member) => {
      const hasPaid = await hasMemberPaidForMonth(member.id, year, month);
      return { member, hasPaid };
    })
  );

  // Филтрираме и връщаме само членовете, които не са платили.
  const unpaidMembers = paymentChecks
    .filter((check) => !check.hasPaid)
    .map((check) => check.member);

  return unpaidMembers;
};

/**
 * Генерира отчет за присъствията за даден период.
 * @param startDate Начална дата.
 * @param endDate Крайна дата.
 * @returns Масив от обекти, съдържащи информация за члена и броя на посещенията му.
 */
export const generateAttendanceReport = async (
  startDate: Date,
  endDate: Date
): Promise<AttendanceReportItem[]> => {
  const [allMembers, allEvents] = await Promise.all([
    getAllMembers(),
    getEventsForPeriod(startDate, endDate),
  ]);

  const memberMap = new Map(allMembers.map((m) => [m.id, m]));
  const attendanceByMember: { [memberId: string]: number } = {};

  for (const event of allEvents) {
    for (const attendee of event.attendees) {
      if (attendee.attended) {
        if (!attendanceByMember[attendee.memberId]) {
          attendanceByMember[attendee.memberId] = 0;
        }
        attendanceByMember[attendee.memberId]++;
      }
    }
  }

  const report: AttendanceReportItem[] = Object.keys(attendanceByMember)
    .map((memberId): AttendanceReportItem | null => {
      const member = memberMap.get(memberId);
      if (!member) {
        // This case should ideally not happen if data is consistent
        return {
          member: {
            id: memberId,
            siteId: "default",
            firstName: "Неизвестен",
            lastName: "Член",
            name: "Неизвестен Член", // Добавено
            email: "",
            phone: "",
            instagram: "",
            dateOfBirth: "",
            subscriptionStatus: "inactive",
            status: "inactive", // Добавено
            registrationDate: new Date().toISOString(), // Добавено
            notes: "",
            role: "member",
            isGuest: false,
            memberType: "regular",
          } as unknown as Member, // Указваме типа изрично
          attendanceCount: attendanceByMember[memberId],
        };
      }
      return {
        member,
        attendanceCount: attendanceByMember[memberId],
      };
    })
    .filter((item): item is AttendanceReportItem => item !== null);

  return report.sort((a, b) => b.attendanceCount - a.attendanceCount);
};
