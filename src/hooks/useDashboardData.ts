
import { useState, useEffect } from 'react';
import { Member, Sale, Reminder } from '@/types';
import { getAllMembers } from '@/services/member-service';
import { getSales } from '@/services/sales-service';
import { getDashboardStats, TotalRevenue } from '@/services/dashboard-service';
import { getReminders } from '@/services/reminder-service';
import { useAuth } from '@/context/auth-context';

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
};

export const useDashboardData = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [membersData, salesData] = await Promise.all([
                    getAllMembers(),
                    getSales(),
                    // These are not used for the main dashboard view, can be fetched on demand
                    // getAllSubscriptions(),
                    // getProducts(),
                ]);

                const members = Array.isArray(membersData) ? membersData : [];
                const sales = Array.isArray(salesData) ? salesData : [];

                // Generate stats
                const dashboardStats = getDashboardStats(members, sales);
                setStats(dashboardStats);

                // Generate reminders from the fetched data
                const reminderList = getReminders(members, sales);
                setReminders(reminderList);

                setAllMembers(members);
                
                sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
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

    return { stats, allMembers, recentSales, reminders, loading, error };
};
