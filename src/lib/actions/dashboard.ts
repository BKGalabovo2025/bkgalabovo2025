"use server";
import "server-only";

import * as admin from "firebase-admin";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminDb } from "@/lib/firebase-admin";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { serverCache } from "@/lib/server-cache";
import { getRevenueTrendData } from "@/services/dashboard-service";
import { Member, Reminder, Sale, ScheduleEvent } from "@/types";

function snapToData<T>(doc: admin.firestore.QueryDocumentSnapshot): T {
  const data = doc.data();
  const convertTimestamps = (val: any): any => {
    if (!val) return val;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: any = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps(val[key]);
      }
      return copy;
    }
    return val;
  };
  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
}

function getOverdueReminders(
  allMembers: Member[],
  allSales: Sale[]
): Reminder[] {
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const overdueMembers = allMembers.filter((member) => {
    if (member.status !== "active") return false;
    const familyMembers = member.familyId
      ? allMembers.filter(
          (m) => m.familyId === member.familyId && m.id !== member.id
        )
      : [];
    const memberSales = allSales.filter((s) => s.memberId === member.id);
    return checkIsMemberOverdue(member, familyMembers, memberSales).isOverdue;
  });

  return overdueMembers.map((member, index) => {
    const familyMembers = member.familyId
      ? allMembers.filter(
          (m) => m.familyId === member.familyId && m.id !== member.id
        )
      : [];
    const memberSales = allSales.filter((s) => s.memberId === member.id);
    const overdueCheck = checkIsMemberOverdue(
      member,
      familyMembers,
      memberSales
    );
    return {
      id: `overdue-${member.id}-${index}`,
      title: "РџСЂРѕСЃСЂРѕС‡РµРЅРѕ РїР»Р°С‰Р°РЅРµ",
      description: overdueCheck.reason
        ? `${member.firstName} ${member.lastName}: ${overdueCheck.reason}`
        : `РўР°РєСЃР°С‚Р° Р·Р° Р°Р±РѕРЅР°РјРµРЅС‚Р° РЅР° ${member.firstName} ${member.lastName} РЅРµ Рµ РїР»Р°С‚РµРЅР°.`,
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      type: "payment",
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      relatedId: member.id,
    };
  });
}

function getUnpaidTrainingReminders(
  recentTrainings: ScheduleEvent[]
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const training of recentTrainings) {
    if (!training.attendees || training.attendees.length === 0) continue;

    for (const attendee of training.attendees) {
      // paymentStatus might be undefined in older records, so check explicitly if not "paid"
      if (attendee.attended && attendee.paymentStatus !== "paid") {
        reminders.push({
          id: `unpaid-training-${training.id}-${attendee.memberId}`,
          title: "Неплатено посещение",
          description: `${attendee.name} присъства на тренировка на ${new Date(training.startDate).toLocaleDateString("bg-BG")}, но няма отчетено плащане.`,
          dueDate: new Date().toISOString(),
          isCompleted: false,
          type: "warning",
          memberId: attendee.memberId,
          memberName: attendee.name,
          relatedId: training.id,
          relatedLink: `/members/${attendee.memberId}`,
        });
      }
    }
  }

  return reminders;
}

export async function getDashboardDataServerAction(activeBranch: string) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminDb = getAdminDb();
    const now = new Date();

    // Date ranges
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const startStr = startOfDay.toISOString();
    const endStr = endOfDay.toISOString();
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

    // Cache key: per branch + per day (stats are stable within a day)
    const todayKey = startOfDay.toISOString().slice(0, 10);
    const cacheKey = `dashboard:${activeBranch}:${todayKey}`;
    const TTL_MS = 5 * 60 * 1000; // 5 minutes — reduces repeat reads and saves Firebase Quota

    return await serverCache.get(
      cacheKey,
      async () => {
        // Base collection references
        const siteFilter = activeBranch && activeBranch !== "bkgalabovo";

        const col = (name: string): admin.firestore.Query => {
          const ref = adminDb.collection(name);
          if (name === "members" || name === "families") {
            return ref;
          }
          return siteFilter ? ref.where("siteId", "==", activeBranch) : ref;
        };

        // в”Ђв”Ђ AGGREGATION QUERIES (count only вЂ” each costs 1 read) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        const [
          totalMembersCount,
          activeMembersCount,
          newMembersThisMonthCount,
          newMembersPrevMonthCount,
          unpaidSalesCount,
          trainingsCount,
          guestsCount,
          familiesCount,
          recoveryMembersCount,
        ] = await Promise.all([
          col("members").count().get(),
          col("members").where("status", "==", "active").count().get(),
          col("members")
            .where("registrationDate", ">=", thirtyDaysAgoStr)
            .count()
            .get(),
          col("members")
            .where("registrationDate", ">=", sixtyDaysAgoStr)
            .where("registrationDate", "<", thirtyDaysAgoStr)
            .count()
            .get(),
          // Count sales that are NOT completed (pending/overdue)
          col("sales").where("status", "==", "pending").count().get(),
          col("events")
            .where("startDate", ">=", startStr)
            .where("startDate", "<=", endStr)
            .where("type", "==", "training")
            .count()
            .get(),
          col("members").where("isGuest", "==", true).count().get(),
          col("families").count().get(),
          col("members").where("isRecoveryMember", "==", true).count().get(),
        ]);

        // в”Ђв”Ђ DOCUMENT QUERIES (only what must be displayed) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        const adminStartOfDay = admin.firestore.Timestamp.fromDate(startOfDay);
        const adminEndOfDay = admin.firestore.Timestamp.fromDate(endOfDay);

        const [
          recentSalesSnap,
          salesFor6MonthsSnap,
          activeMembersSnap,
          activeSubsSnap,
          eventsSnap,
          productsSnap,
          reservationsSnap,
          recentTrainingsSnap,
        ] = await Promise.all([
          // Last 5 sales for the "Recent Sales" widget
          col("sales").orderBy("saleDate", "desc").limit(5).get(),

          // Up to 6 months of completed+paid sales for revenue stats & chart
          col("sales").where("status", "==", "completed").limit(500).get(),

          // Active members (needed for overdue reminder generation)
          col("members").where("status", "==", "active").limit(300).get(),

          // Unpaid sales (needed for overdue check)
          col("sales").where("isPaid", "==", false).limit(300).get(),

          // Today's events for display
          col("events")
            .where("startDate", ">=", startStr)
            .where("startDate", "<=", endStr)
            .limit(30)
            .get(),

          // Products (small collection, needed for low-stock list)
          col("products").limit(200).get(),

          // Today's reservations (both court and recovery)
          col("reservations")
            .where("startTime", ">=", adminStartOfDay)
            .where("startTime", "<=", adminEndOfDay)
            .limit(100)
            .get(),

          // Recent trainings for unpaid attendance tracking (last 60 days up to today)
          col("events")
            .where("startDate", ">=", sixtyDaysAgoStr)
            .where("startDate", "<=", endStr)
            .where("type", "==", "training")
            .get(),
        ]);

        // Map documents
        const recentSales = recentSalesSnap.docs.map((d) =>
          snapToData<Sale>(d)
        );
        const salesFor6Months = salesFor6MonthsSnap.docs
          .map((d) => snapToData<Sale>(d))
          .filter((s): s is Sale => s !== null)
          .filter((s) => new Date(s.saleDate) >= sixMonthsAgo)
          .sort(
            (a, b) =>
              new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
          );
        const activeMembers = activeMembersSnap.docs.map((d) =>
          snapToData<Member>(d)
        );
        const unpaidSales = activeSubsSnap.docs.map((d) => snapToData<Sale>(d));
        const events = eventsSnap.docs.map((d) => snapToData<ScheduleEvent>(d));
        const reservations = reservationsSnap.docs.map((d) =>
          snapToData<any>(d)
        );
        const recentTrainings = recentTrainingsSnap.docs.map((d) =>
          snapToData<ScheduleEvent>(d)
        );

        // Sort events by start date
        const sortedEvents = [...events].sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        const todayTrainingsCount = events.filter(
          (e) => e.type === "training"
        ).length;
        const todayCompetitionsCount = events.filter(
          (e) => e.type === "competition"
        ).length;
        const todayCampsCount = events.filter((e) => e.type === "camp").length;
        const todayOtherEventsCount = events.filter(
          (e) =>
            e.type !== "training" &&
            e.type !== "competition" &&
            e.type !== "camp"
        ).length;
        const todayEventsCount = events.length;

        const todayRecoveryCount = reservations.filter(
          (r) => !r.courtId
        ).length;
        const todayCourtCount = reservations.filter((r) => r.courtId).length;

        const allProducts = productsSnap.docs.map((d) => snapToData<any>(d));

        // Low-stock products (client-side filter вЂ” products collection is small)
        const lowStockProducts = allProducts.filter((p) => {
          const threshold =
            typeof p.restockThreshold === "number" ? p.restockThreshold : 5;
          return p.stock <= threshold;
        });

        // Revenue calculations for current calendar month (excluding camp fees, which belong to camps module)
        const calcRevenue = (list: Sale[]) =>
          list
            .filter((s) => s.isPaid === true && s.type !== "camp_fee")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const salesCurrentMonth = salesFor6Months.filter(
          (s) => new Date(s.saleDate) >= startOfMonth && s.type !== "camp_fee"
        );
        const salesPrevMonth = salesFor6Months.filter(
          (s) =>
            new Date(s.saleDate) >= startOfPrevMonth &&
            new Date(s.saleDate) < startOfMonth &&
            s.type !== "camp_fee"
        );

        const revenueCurrentMonth = calcRevenue(salesCurrentMonth);
        const revenuePrevMonth = calcRevenue(salesPrevMonth);
        const revenueChange =
          revenuePrevMonth > 0
            ? ((revenueCurrentMonth - revenuePrevMonth) / revenuePrevMonth) *
              100
            : revenueCurrentMonth > 0
              ? 100
              : 0;

        const revenueTrainings = salesCurrentMonth
          .filter((s) => s.isPaid === true && s.type === "training_service")
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueCourts = salesCurrentMonth
          .filter(
            (s) =>
              s.isPaid === true &&
              s.type === "general_service" &&
              s.items?.some((i) => i.productId?.startsWith("court_rental_"))
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueRecovery = salesCurrentMonth
          .filter(
            (s) =>
              s.isPaid === true &&
              s.type === "general_service" &&
              s.items?.some((i) => i.productId?.startsWith("recovery_session_"))
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueServices = salesCurrentMonth
          .filter(
            (s) =>
              s.isPaid === true &&
              s.type === "general_service" &&
              !s.items?.some(
                (i) =>
                  i.productId?.startsWith("court_rental_") ||
                  i.productId?.startsWith("recovery_session_")
              )
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueShop = salesCurrentMonth
          .filter(
            (s) => s.isPaid === true && (s.type === "inventory" || !s.type)
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueCamps = salesFor6Months
          .filter(
            (s) =>
              s.isPaid === true &&
              s.type === "camp_fee" &&
              new Date(s.saleDate) >= startOfMonth
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const totalRevenue = salesFor6Months
          .filter((s) => s.isPaid === true && s.type !== "camp_fee")
          .reduce(
            (acc, s) => {
              const cur = s.currency || "EUR";
              acc[cur] = (acc[cur] || 0) + (s.totalAmount || 0);
              return acc;
            },
            {} as Record<string, number>
          );

        const salesCountCurrentMonth = salesCurrentMonth.length;
        const salesCountPrevMonth = salesPrevMonth.length;
        const salesChange =
          salesCountPrevMonth > 0
            ? ((salesCountCurrentMonth - salesCountPrevMonth) /
                salesCountPrevMonth) *
              100
            : salesCountCurrentMonth > 0
              ? 100
              : 0;

        const tMem = totalMembersCount.data().count;
        const aMem = activeMembersCount.data().count;
        const newMemThis = newMembersThisMonthCount.data().count;
        const newMemPrev = newMembersPrevMonthCount.data().count;
        const newMembersChange =
          newMemPrev > 0
            ? ((newMemThis - newMemPrev) / newMemPrev) * 100
            : newMemThis > 0
              ? 100
              : 0;

        const totalGuests = guestsCount.data().count;
        const totalFamilies = familiesCount.data().count;
        const totalRecovery = recoveryMembersCount.data().count;
        const totalClubMembers = await col("members")
          .where("isClubMember", "==", true)
          .count()
          .get()
          .then((s) => s.data().count);

        const stats = {
          totalMembers: tMem,
          activeMembersCount: aMem,
          totalRevenue,
          unpaidSales: unpaidSalesCount.data().count,
          revenueLast30Days: revenueCurrentMonth,
          revenueCurrentMonth,
          revenueChange,
          newMembersCount: newMemThis,
          newMembersLast30Days: newMemThis,
          newMembersChange,
          salesLast30Days: salesCountCurrentMonth,
          salesChange,
          lowStockCount: lowStockProducts.length,
          lowStockProducts: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name || "",
            stock: p.stock || 0,
            restockThreshold: p.restockThreshold || 0,
          })),
          trainingsToday: trainingsCount.data().count,
          totalGuests,
          totalFamilies,
          totalClubMembers,
          totalRecovery,
          inactiveMembersCount: tMem - aMem,
          revenueTrainings,
          revenueServices,
          revenueCourts,
          revenueRecovery,
          revenueShop,
          revenueCamps,
          todayTrainingsCount,
          todayCompetitionsCount,
          todayCampsCount,
          todayOtherEventsCount,
          todayEventsCount,
          todayRecoveryCount,
          todayCourtCount,
          todayEventsList: sortedEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            type: e.type,
            attendeesCount: e.attendees?.length || 0,
          })),
        };

        const revenueChartData = getRevenueTrendData(salesFor6Months);
        const reminders = [
          ...getOverdueReminders(activeMembers, unpaidSales),
          ...getUnpaidTrainingReminders(recentTrainings),
        ];

        return {
          success: true,
          data: {
            stats,
            revenueChartData,
            reminders,
            recentSales,
            todayTrainings: events.filter((e) => e.type === "training"),
          },
        };
      },
      TTL_MS
    );
  } catch (error: unknown) {
    console.error("Error fetching dashboard data on server:", error);
    return {
      success: false,
      error:
        (error instanceof Error ? error.message : "Unknown error") ||
        "РќРµСѓСЃРїРµС€РЅРѕ РёР·РІР»РёС‡Р°РЅРµ РЅР° РґР°РЅРЅРё",
    };
  }
}

export async function invalidateDashboardCacheAction() {
  try {
    serverCache.invalidatePattern("dashboard:");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error invalidating dashboard cache:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
