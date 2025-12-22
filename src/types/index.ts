
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
    familyId?: string; // ID of the family group
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
    currency?: 'BGN' | 'EUR'; // The currency of the payment amount
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
 * The price is now stored in EUR.
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number; // Price is in EUR
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
    name: string;
    quantity: number;
    price: number; // Price per unit at the time of sale, in the currency of the parent Sale
}

/**
 * Represents a completed sale transaction.
 */
export interface Sale {
    id: string;
    date: string;
    memberId?: string | null; // Can be null for guest sales
    customerName?: string;
    items: SaleItem[];
    total: number;
    status: 'pending' | 'paid' | 'completed' | 'refunded';
    currency?: 'BGN' | 'EUR'; // The currency of the entire sale
}

/**
 * Represents an inventory event log.
 */
export interface InventoryEvent {
    id: string;
    productId: string;
    productName: string;
    type: 'INITIAL' | 'RESTOCK' | 'PRICE_UPDATE' | 'SALE' | 'ADJUSTMENT';
    quantityChange?: number; // e.g., +10 for restock, -2 for sale
    oldPrice?: number;
    newPrice?: number;
    createdAt: any; // Firestore Timestamp
    userId: string;
    userName: string;
    notes?: string;
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

/**
 * Represents a family group of members.
 */
export interface Family {
    id: string;
    memberIds: string[]; // List of member IDs belonging to this family
}
