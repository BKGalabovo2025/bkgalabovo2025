
// This file is the single source of truth for all data types in the application.

// =============================================================================
// CORE DATA MODELS (Members, Products, Sales, etc.)
// =============================================================================

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
    // subscriptions?: MemberSubscription[]; // Coming soon
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

// =============================================================================
// CLUB SERVICES & SUBSCRIPTIONS
// =============================================================================

/**
 * Represents a purchasable club service or subscription plan.
 * This is the template for a subscription.
 */
export type ClubService = {
  id: string; // Уникален идентификатор (напр. svc_12345)
  name: string; // Име на услугата
  description?: string; // По-дълго описание (по желание)
  price: number; // Цена в най-малката валутна единица (напр. стотинки/центове)
  currency: 'BGN' | 'EUR'; // Валута
  
  targetGroups: ('Деца' | 'Любители')[]; // Целева група
  type: 'Абонамент' | 'Еднократно плащане'; // Тип на плащането

  // Специфики на абонамент
  billingPeriod?: 'Месечен' | 'Годишен' | null; // Период на таксуване (само за абонаменти)

  // Общи характеристики
  isCoachLed?: boolean; // Дали е водена от треньор
  durationMinutes?: number; // Продължителност в минути
  requiresBooking?: boolean; // Дали изисква предварително записване
  cancellationPolicy?: string; // Политика за анулиране

  // Характеристики на пакет/групова услуга
  minMembers: number; // Минимален брой членове за тази услуга
  maxMembers?: number; // Максимален брой членове (ако е празно, значи няма горен лимит)

  // Условия за специални права
  grantsLicense: boolean; // Дава ли право на картотека
  licenseCondition?: 'Веднага' | 'След N плащания';
  licensePaymentCount?: number; // Брой плащания за картотека

  grantsApparel: boolean; // Дава ли право на екипировка
  apparelCondition?: 'Веднага' | 'След N плащания';
  apparelPaymentCount?: number; // Брой плащания за екипировка
};


/**
 * Represents an instance of a member being subscribed to a ClubService.
 * This is the actual link between a member and a service.
 */
export type MemberSubscription = {
    id: string; // Unique ID for this specific subscription instance
    memberId: string; // ID of the member
    serviceId: string; // ID of the ClubService they are subscribed to

    startDate: string; // ISO Date string when the subscription becomes active
    endDate: string;   // ISO Date string when the subscription expires
    
    // Status of THIS specific subscription period
    status: 'active' | 'expired' | 'cancelled' | 'pending_payment'; 

    // Financial details for this subscription instance
    pricePaid: number; // The actual price paid for this period
    currency: 'BGN' | 'EUR';
    paymentDate?: string; // When the payment was made
    paymentHistory: {
        date: string;
        amount: number;
        notes?: string;
    }[];

    // Tracking progress towards special grants
    paymentsMadeCount: number; // How many payments have been made for this sub
    licenseGranted: boolean; // Has the license been granted based on this sub?
    apparelGranted: boolean; // Has the apparel been granted based on this sub?
};


// =============================================================================
// OTHER TYPES
// =============================================================================

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
 * Defines the programmatic types for schedule events.
 */
export type ScheduleEventType = 'trening' | 'sastezanie' | 'lager' | 'sabitie';

/**
 * Represents a single, unified event for the schedule.
 */
export interface ScheduleEvent {
    id: string;
    title: string;
    type: ScheduleEventType;
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

/**
 * Represents the summary statistics for the main dashboard.
 */
export interface DashboardStats {
    activeMembers: number;
    monthlyRevenue: number;
    pendingSubscriptions: number;
    recentMembers: Pick<Member, 'id' | 'firstName' | 'lastName'>[];
    deferredExternalSales: Sale[];
    deferredMemberSales: Sale[];
}
