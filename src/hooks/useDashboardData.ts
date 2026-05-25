import { useState, useEffect } from "react";
import { Member, Sale, Reminder } from "@/types";
import { getAllMembers } from "@/services/member-service";
import { getSales } from "@/services/sales-service";
import { getLowStockProducts } from "@/services/inventory-service";
import {
  getDashboardStats,
  TotalRevenue,
  getRevenueTrendData,
} from "@/services/dashboard-service";
import { getReminders } from "@/services/reminder-service";
import { getEventsForPeriod } from "@/services/schedule-service";
import { useAuth } from "@/context/auth-context";

type DashboardStats = {
  totalMembers: number;
  activeMembersCount: number;
  totalRevenue: TotalRevenue;
  unpaidSales: number;
  revenueLast30Days: number;
  revenueChange: number;
  newMembersLast30Days: number;
  newMembersChange: number;
  salesLast30Days: number;
  salesChange: number;
  lowStockCount: number;
  trainingsToday: number;
};

import { useAppStore } from "@/store/use-app-store";

export const useDashboardData = () => {
  const { user } = useAuth();
  const { activeBranch } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<
    { name: string; revenue: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.log("useDashboardData: Fetching dashboard data...");
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

        const [
          membersData,
          salesData,
          lowStockData,
          eventsData,
        ] = await Promise.all([
          getAllMembers().catch((err: any) => {
            console.error("Error fetching members:", err);
            throw err;
          }),
          getSales().catch((err: any) => {
            console.error("Error fetching sales:", err);
            throw err;
          }),
          getLowStockProducts().catch((err: any) => {
            console.error("Error fetching low stock products:", err);
            throw err;
          }),
          getEventsForPeriod(startOfDay, endOfDay).catch((err: any) => {
            console.error("Error fetching today's events:", err);
            return []; // Non-critical, fallback to empty
          }),
        ]);

        const members = Array.isArray(membersData) ? membersData : [];
        const sales = Array.isArray(salesData) ? salesData : [];
        const lowStock = Array.isArray(lowStockData) ? lowStockData : [];
        const events = Array.isArray(eventsData) ? eventsData : [];
        console.log(
          `useDashboardData: Fetched ${events.length} events for today`
        );
        if (events.length > 0) {
          console.log("First event:", JSON.stringify(events[0]));
        }

        // Generate stats
        const dashboardStats = getDashboardStats(
          members,
          sales,
          lowStock,
          events
        );
        setStats(dashboardStats);

        // Generate chart data
        const chartData = getRevenueTrendData(sales);
        setRevenueChartData(chartData);

        // Generate reminders from the fetched data (based on unpaid sales)
        const reminderList = getReminders(members, sales);
        setReminders(reminderList);

        setAllMembers(members);

        sales.sort(
          (a, b) =>
            new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
        );
        setRecentSales(sales.slice(0, 5));
      } catch (err) {
        console.error("useDashboardData - A critical error occurred:", err);
        setError("A critical error occurred while loading dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, activeBranch]);

  return {
    stats,
    allMembers,
    recentSales,
    reminders,
    revenueChartData,
    loading,
    error,
  };
};
