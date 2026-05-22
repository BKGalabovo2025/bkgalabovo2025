"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { ensureAdminFromSession } from "@/lib/auth-utils";
import { Member, Sale, Product, ScheduleEvent, Reminder } from "@/types";
import {
  getDashboardStats,
  getRevenueTrendData,
} from "@/services/dashboard-service";
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

// Replicate reminder generation on the server without needing client-side hooks
function getOverdueReminders(
  allMembers: Member[],
  allSales: Sale[]
): Reminder[] {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const membersWithOverduePayments = allMembers.filter((member) => {
    if (member.status !== "active") {
      return false;
    }
    const hasCurrentSubscription = allSales.some(
      (sale) =>
        sale.memberId === member.id &&
        sale.subscriptionId &&
        new Date(sale.saleDate).getMonth() === currentMonth &&
        new Date(sale.saleDate).getFullYear() === currentYear
    );
    return !hasCurrentSubscription;
  });

  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return membersWithOverduePayments.map((member, index) => ({
    id: `overdue-${member.id}-${index}`,
    title: "Просрочено плащане",
    description: `Таксата за абонамента на ${member.firstName} ${member.lastName} за текущия месец не е платена.`,
    dueDate: dueDate.toISOString(),
    isCompleted: false,
    type: "payment",
    memberId: member.id,
    memberName: `${member.firstName} ${member.lastName}`,
    relatedId: member.id,
  }));
}

export async function getDashboardDataServerAction(activeBranch: string) {
  try {
    // Authenticate and ensure admin session on the server
    await ensureAdminFromSession();

    const adminDb = getAdminDb();

    // Setup dates for today's events
    const now = new Date();
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

    const startStr = startOfDay.toISOString();
    const endStr = endOfDay.toISOString();

    // Formulate Admin queries for all collections
    let membersQuery: admin.firestore.Query = adminDb.collection("members");
    let salesQuery: admin.firestore.Query = adminDb.collection("sales");
    let productsQuery: admin.firestore.Query = adminDb.collection("products");
    let eventsQuery: admin.firestore.Query = adminDb.collection("events");

    // Apply site filtering (matching getSiteQuery logic in firebase-collections)
    if (activeBranch && activeBranch !== "bkgalabovo") {
      membersQuery = membersQuery.where("siteId", "==", activeBranch);
      salesQuery = salesQuery.where("siteId", "==", activeBranch);
      productsQuery = productsQuery.where("siteId", "==", activeBranch);
      eventsQuery = eventsQuery.where("siteId", "==", activeBranch);
    }

    // Run Firestore fetches in parallel for blazing performance!
    const [membersSnap, salesSnap, productsSnap, eventsSnap] =
      await Promise.all([
        membersQuery.get(),
        salesQuery.get(),
        productsQuery.get(),
        eventsQuery
          .where("startDate", ">=", startStr)
          .where("startDate", "<=", endStr)
          .get(),
      ]);

    const members = membersSnap.docs.map((doc) => snapToData<Member>(doc));
    const sales = salesSnap.docs.map((doc) => snapToData<Sale>(doc));
    const allProducts = productsSnap.docs.map((doc) =>
      snapToData<Product>(doc)
    );
    const events = eventsSnap.docs.map((doc) => snapToData<ScheduleEvent>(doc));

    // Filter low stock products (where stock <= restockThreshold)
    const lowStockProducts = allProducts.filter(
      (p) =>
        typeof p.restockThreshold === "number" && p.stock <= p.restockThreshold
    );

    // Calculate stats
    const stats = getDashboardStats(members, sales, lowStockProducts, events);

    // Generate chart data
    const revenueChartData = getRevenueTrendData(sales);

    // Generate reminders
    const reminders = getOverdueReminders(members, sales);

    // Sort sales for recent sales widget
    const recentSales = [...sales]
      .sort(
        (a, b) =>
          new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      )
      .slice(0, 5);

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
  } catch (error: any) {
    console.error("Error fetching dashboard data on server:", error);
    return {
      success: false,
      error: error.message || "Неуспешно извличане на данни",
    };
  }
}
