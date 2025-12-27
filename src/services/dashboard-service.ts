
import { Member, Sale } from '@/types';

export type TotalRevenue = {
    [key: string]: number; // e.g. { BGN: 120.50, EUR: 50.00 }
};

/**
 * Calculates dashboard statistics in a bulletproof manner.
 * This function is defensively coded to handle any data shape without crashing.
 * @param members - An array of all members.
 * @param sales - An array of all sales.
 * @returns An object containing calculated dashboard statistics.
 */
export const getDashboardStats = (members: Member[], sales: Sale[]) => {
    const safeMembers = Array.isArray(members) ? members : [];
    const safeSales = Array.isArray(sales) ? sales : [];

    const totalMembers = safeMembers.length;
    const activeMembers = safeMembers.filter(m => m && m.status === 'active').length;
    const unpaidSales = safeSales.filter(sale => sale && !sale.isPaid).length;

    // Correctly calculates total revenue by grouping amounts by currency.
    const totalRevenue: TotalRevenue = safeSales.reduce((acc, sale) => {
        if (!sale || typeof sale.totalAmount !== 'number') {
            return acc; // Skip if sale is invalid or amount is not a number
        }

        // All new sales are in EUR. Default old ones to EUR as well for consistency.
        const currency = (sale.currency as string) || 'EUR'; 
        const amount = sale.totalAmount;

        if (!acc[currency]) {
            acc[currency] = 0;
        }
        acc[currency] += amount;

        return acc;
    }, {} as TotalRevenue);

    return {
        totalMembers,
        activeMembers,
        totalRevenue,
        unpaidSales,
    };
};
