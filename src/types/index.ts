
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
    createdAt?: string; // Added for dashboard
}

/**
 * Represents a financial payment made by a member.
 */
export interface Payment {
    id: string;
    memberId: string; // Link to a Member
    amount: number;
    paymentDate: string;
    type: 'Членски внос' | 'Дарение' | 'Друго'; // Type of payment
    notes?: string;
}

/**
 * Represents a member's subscription status.
 */
export type Subscription = {
    id: string;
    memberId: string;
    type: 'annual' | 'monthly' | 'quarterly' | 'single_visit';
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
    restockThreshold: number; // The minimum stock level before a restock is needed
    category: string;
    imageUrl?: string;
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

/**
 * Represents a single, unified event for the schedule.
 */
export interface ScheduleEvent {
    id: string;
    title: string;
    type: 'тренировка' | 'състезание' | 'лагер' | 'събитие';
    startDate: string; // Full ISO 8601 date-time string
    endDate?: string | null;  // Full ISO 8601 date-time string (optional, can be null)
    location?: string;
    description?: string;
    color?: string; // Color is determined dynamically, but can be here
    attendees?: string[]; // Array of member IDs
}
