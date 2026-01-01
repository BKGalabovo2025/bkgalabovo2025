
import { useState, useEffect } from 'react';
import { Member, Sale } from '@/types';
import { getAllMembers } from '@/services/member-service';
import { getSales } from '@/services/sales-service';
import { getDashboardStats, TotalRevenue } from '@/services/dashboard-service'; // Corrected import path
import { useAuth } from '@/context/auth-context';

export type DashboardStats = {
    totalMembers: number;
    activeMembers: number;
    totalRevenue: TotalRevenue;
    unpaidSales: number;
};

export const useDashboardData = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
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
                    getSales()
                ]);

                const members = Array.isArray(membersData) ? membersData : [];
                const sales = Array.isArray(salesData) ? salesData : [];

                // Now calling the correct, updated function
                const dashboardStats = getDashboardStats(members, sales);
                setStats(dashboardStats);

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

    return { stats, allMembers, recentSales, loading, error };
};
