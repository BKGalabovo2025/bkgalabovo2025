
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

    // Correctly count unpaid sales (any status other than 'completed')
    const unpaidSales = safeSales.filter(sale => sale && sale.status !== 'completed').length;

    // Correctly calculate total revenue from COMPLETED sales only, using sale.total
    const totalRevenue: TotalRevenue = safeSales
        .filter(sale => sale && sale.status === 'completed') // Filter for completed sales
        .reduce((acc, sale) => {
            if (!sale) return acc;

            const totalAmount = sale.total || 0; // Use sale.total directly
            const currency = sale.currency || 'EUR'; // Default to EUR for consistency

            if (!acc[currency]) {
                acc[currency] = 0;
            }
            acc[currency] += totalAmount;

            return acc;
        }, {} as TotalRevenue);

    return {
        totalMembers,
        activeMembers,
        totalRevenue,
        unpaidSales,
    };
};
