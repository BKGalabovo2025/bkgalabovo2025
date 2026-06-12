"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Member, Sale, ScheduleEvent, Reminder } from "@/types";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { getRevenueTrendData } from "@/services/dashboard-service";
import { serverCache } from "@/lib/server-cache";
import * as admin from "firebase-admin";

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
      title: "Просрочено плащане",
      description: overdueCheck.reason
        ? `${member.firstName} ${member.lastName}: ${overdueCheck.reason}`
        : `Таксата за абонамента на ${member.firstName} ${member.lastName} не е платена.`,
      dueDate: dueDate.toISOString(),
      isCompleted: false,
      type: "payment",
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      relatedId: member.id,
    };
  });
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

    const startStr = startOfDay.toISOString();
    const endStr = endOfDay.toISOString();
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

    // Cache key: per branch + per day (stats are stable within a day)
    const todayKey = startOfDay.toISOString().slice(0, 10);
    const cacheKey = `dashboard:${activeBranch}:${todayKey}`;
    const TTL_MS = 90_000; // 90 seconds — reduces repeat reads on navigation

    return await serverCache.get(
      cacheKey,
      async () => {
        // Base collection references
        const siteFilter = activeBranch && activeBranch !== "bkgalabovo";

        const col = (name: string): admin.firestore.Query => {
          const ref = adminDb.collection(name);
          return siteFilter ? ref.where("siteId", "==", activeBranch) : ref;
        };

        // ── AGGREGATION QUERIES (count only — each costs 1 read) ──────────────
        const [
          totalMembersCount,
          activeMembersCount,
          newMembersThisMonthCount,
          newMembersPrevMonthCount,
          unpaidSalesCount,
          trainingsCount,
          guestsCount,
          familiesCount,
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
        ]);

        // ── DOCUMENT QUERIES (only what must be displayed) ─────────────────────
        const [
          recentSalesSnap,
          salesFor6MonthsSnap,
          activeMembersSnap,
          activeSubsSnap,
          eventsSnap,
          productsSnap,
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

        const allProducts = productsSnap.docs.map((d) => snapToData<any>(d));

        // Low-stock products (client-side filter — products collection is small)
        const lowStockProducts = allProducts.filter(
          (p) =>
            typeof p.restockThreshold === "number" &&
            p.stock <= p.restockThreshold
        );

        // Revenue calculations from the scoped sales set
        const calcRevenue = (list: Sale[]) =>
          list
            .filter((s) => s.isPaid === true)
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const salesLast30Days = salesFor6Months.filter(
          (s) => new Date(s.saleDate) >= thirtyDaysAgo
        );
        const salesPrev30Days = salesFor6Months.filter(
          (s) =>
            new Date(s.saleDate) >= sixtyDaysAgo &&
            new Date(s.saleDate) < thirtyDaysAgo
        );

        const revenueLast30Days = calcRevenue(salesLast30Days);
        const revenuePrev30Days = calcRevenue(salesPrev30Days);
        const revenueChange =
          revenuePrev30Days > 0
            ? ((revenueLast30Days - revenuePrev30Days) / revenuePrev30Days) *
              100
            : revenueLast30Days > 0
              ? 100
              : 0;

        const revenueTrainings = salesLast30Days
          .filter((s) => s.isPaid === true && s.type === "training_service")
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueServices = salesLast30Days
          .filter((s) => s.isPaid === true && s.type === "general_service")
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const revenueShop = salesLast30Days
          .filter(
            (s) => s.isPaid === true && (s.type === "inventory" || !s.type)
          )
          .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const totalRevenue = salesFor6Months
          .filter((s) => s.isPaid === true)
          .reduce(
            (acc, s) => {
              const cur = s.currency || "EUR";
              acc[cur] = (acc[cur] || 0) + (s.totalAmount || 0);
              return acc;
            },
            {} as Record<string, number>
          );

        const salesCountLast30 = salesLast30Days.length;
        const salesCountPrev30 = salesPrev30Days.length;
        const salesChange =
          salesCountPrev30 > 0
            ? ((salesCountLast30 - salesCountPrev30) / salesCountPrev30) * 100
            : salesCountLast30 > 0
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
        const totalClubMembers = tMem - totalGuests;

        const stats = {
          totalMembers: tMem,
          activeMembersCount: aMem,
          totalRevenue,
          unpaidSales: unpaidSalesCount.data().count,
          revenueLast30Days,
          revenueChange,
          newMembersLast30Days: newMemThis,
          newMembersChange,
          salesLast30Days: salesCountLast30,
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
          revenueTrainings,
          revenueServices,
          revenueShop,
          todayTrainingsCount,
          todayCompetitionsCount,
          todayCampsCount,
          todayOtherEventsCount,
          todayEventsCount,
        };

        const revenueChartData = getRevenueTrendData(salesFor6Months);
        const reminders = getOverdueReminders(activeMembers, unpaidSales);

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
  } catch (error: any) {
    console.error("Error fetching dashboard data on server:", error);
    return {
      success: false,
      error: error.message || "Неуспешно извличане на данни",
    };
  }
}

export async function invalidateDashboardCacheAction() {
  try {
    serverCache.invalidatePattern("dashboard:");
    return { success: true };
  } catch (error: any) {
    console.error("Error invalidating dashboard cache:", error);
    return { success: false, error: error.message };
  }
}
