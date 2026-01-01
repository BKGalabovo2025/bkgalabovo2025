
import { useState, useEffect } from 'react';
import { Member, Sale } from '@/types';
import { getAllMembers } from '@/services/member-service';
import { getSales } from '@/services/sales-service';
import { getDashboardStats, TotalRevenue } from '@/services/dashboard-service';
import { useAuth } from '@/context/auth-context'; // Import useAuth hook

export type DashboardStats = {
    totalMembers: number;
    activeMembers: number;
    totalRevenue: TotalRevenue;
    unpaidSales: number;
};

export const useDashboardData = () => {
    const { user } = useAuth(); // Get user from useAuth hook
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentMembers, setRecentMembers] = useState<Member[]>([]);
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) { // Don't fetch if no user
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [membersData, salesData] = await Promise.all([
                    getAllMembers(),
                    getSales()
                ]);

                const members = Array.isArray(membersData) ? membersData : [];
                const sales = Array.isArray(salesData) ? salesData : [];

                const dashboardStats = getDashboardStats(members, sales);
                setStats(dashboardStats);

                members.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
                setRecentMembers(members.slice(0, 5));
                
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
    }, [user]); // Add user as a dependency

    return { stats, recentMembers, recentSales, loading, error };
};
