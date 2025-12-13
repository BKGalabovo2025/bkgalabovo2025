
// This file is the single source of truth for all data types in the application.

/**
 * Represents a club member.
 */
export interface Member {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    phoneType?: 'personal' | 'parent';
    registrationDate: string;
    status: 'active' | 'inactive';
    address?: string;
    dateOfBirth: string;
    personalId?: string;
    notes?: string;
    educationInstitution?: string;
    avatarUrl?: string; // URL for the member's avatar image
}

/**
 * Represents a financial payment made by a member.
 */
export interface Payment {
    id: string;
    memberId: string; // Link to a Member
    amount: number;
    paymentDate: string;
    type: 'membership_fee' | 'donation' | 'other'; // Type of payment
    notes?: string;
}

/**
 * Represents a member's subscription status.
 */
export type Subscription = {
    id: string;
    memberId: string;
    type: 'annual' | 'monthly';
    startDate: string;
    endDate: string;
    status: 'paid' | 'pending' | 'overdue';
    amount: number;
};

/**
 * Represents an inventory product available for sale.
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
}

/**
 * Represents a single item within a sale transaction.
 */
export interface SaleItem {
    productId: string;
    name: string;      // Using 'name' for consistency across the app
    quantity: number;
    price: number;     // Price per unit at the time of sale
}

/**
 * Represents a completed sale transaction.
 */
export interface Sale {
    id: string;
    date: string;
    memberId?: string | null; // Can be null for guest sales
    customerName?: string;    // Denormalized customer name for quick display
    items: SaleItem[];
    total: number;           // Using 'total' for consistency
    status: 'pending' | 'paid' | 'completed' | 'refunded';
}
