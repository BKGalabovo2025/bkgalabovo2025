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
};

export const useDashboardData = () => {
  const { user } = useAuth();
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
        const [membersData, salesData, lowStockData] = await Promise.all([
          getAllMembers(),
          getSales(),
          getLowStockProducts(),
        ]);

        const members = Array.isArray(membersData) ? membersData : [];
        const sales = Array.isArray(salesData) ? salesData : [];
        const lowStock = Array.isArray(lowStockData) ? lowStockData : [];

        // Generate stats
        const dashboardStats = getDashboardStats(members, sales, lowStock);
        setStats(dashboardStats);

        // Generate chart data
        const chartData = getRevenueTrendData(sales);
        setRevenueChartData(chartData);

        // Generate reminders from the fetched data
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
  }, [user]);

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
