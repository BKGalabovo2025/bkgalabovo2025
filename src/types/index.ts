
// This file is the single source of truth for all data structures in the application.

// =================================================================
//                            CORE TYPES
// =================================================================

/**
 * Represents a registered member of the club.
 */
export type Member = {
  id: string;
  name: string; // Composite of firstName and lastName
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string | null;
  phone: string | null;
  phoneType?: 'personal' | 'parent' | null;
  dateOfBirth: string; // ISO 8601
  registrationDate: string; // ISO 8601
  address?: string | null;
  status: 'active' | 'inactive';
  avatarUrl?: string | null;
  familyId?: string | null;
  educationInstitution?: string | null;
  personalId?: string | null;
  notes?: string | null;
  analysisCache?: {
      generatedAt: string; // ISO string format
      result: MemberAnalysis;
  } | null;
};

/**
 * Represents a family unit, grouping multiple members.
 */
export type Family = {
  id: string;
  name: string;
  memberIds: string[];
};

/**
 * Represents a physical product sold by the club.
 */
export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: 'BGN' | 'EUR';
  category: string;
  quantity: number; // Current stock level
  imageUrl?: string | null;
  restockThreshold?: number | null; // Threshold for restock reminders
};

/**
 * Represents a single item within a sale.
 */
export type SaleItem = {
  productId: string;
  name: string; // Product name at the time of sale
  quantity: number;
  price: number; // Price per unit at the time of sale
};

/**
 * Represents a transaction or sale.
 */
export type Sale = {
  id: string;
  memberId: string;
  date: string; // ISO 8601
  items: SaleItem[];
  status: 'pending' | 'completed' | 'cancelled';
  currency: 'BGN' | 'EUR';
  // Note: totalAmount is calculated on the fly where needed.
};

/**
 * Represents a financial payment.
 */
export type Payment = {
  id: string;
  memberId: string;
  date: string; // ISO 8601
  amount: number;
  currency: 'BGN' | 'EUR';
  type: 'subscription' | 'donation' | 'sale' | 'other';
  method: 'cash' | 'card' | 'bank_transfer';
  status: 'succeeded' | 'pending' | 'failed';
  notes?: string;
  relatedId?: string; // e.g., Sale ID or Subscription ID
};

// =================================================================
//                  SUBSCRIPTIONS & SERVICES
// =================================================================

/**
 * Defines the type for a group targeted by a service.
 */
export type TargetGroup = 'Деца' | 'Любители' | 'Състезатели' | 'Професионалисти';

/**
 * Defines a special right granted by a club service.
 */
export type SpecialRight = {
  right: 'kartoteka' | 'equipment';
  description: string;
  trigger: {
    condition: 'IMMEDIATELY' | 'AFTER_N_PAYMENTS';
    paymentCount?: number;
  };
};

/**
 * Defines the cancellation policy for a club service.
 */
export type CancellationPolicy = {
  isAllowed: boolean;
  noticePeriodDays: number;
  feeType: 'none' | 'fixed' | 'percentage';
  feeValue: number;
  description: string;
  longTermSicknessDiscount: number; // e.g., 0.5 for 50%
};

/**
 * Represents a service offered by the club (e.g., membership, monthly pass).
 */
export type ClubService = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'BGN' | 'EUR';
  type: 'Абонамент' | 'Еднократно плащане';
  billingPeriod: 'Месечен' | 'Годишен' | null;
  targetGroups: TargetGroup[];
  isCoachLed: boolean;
  durationMinutes: number;
  requiresBooking: boolean;
  minMembers: number;
  maxMembers: number; // 0 for unlimited
  paymentRules?: {
    window: {
      startDay: number;
      endDay: number;
    }
  };
  specialRights: SpecialRight[];
  cancellationPolicy: CancellationPolicy;
};

/**
 * Represents a member's subscription to a specific club service.
 * This was previously referred to as MemberSubscription.
 */
export type Subscription = {
  id: string;
  memberId: string;
  serviceId: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  status: 'active' | 'inactive' | 'cancelled' | 'pending_payment';
  pricePaid: number;
  currency: 'BGN' | 'EUR';
  paymentHistory: { date: string; amount: number; paymentId: string; }[];
  paymentsMadeCount: number;
  licenseGranted: boolean;
  apparelGranted: boolean;
};

/**
 * Represents a historical log entry for changes to a ClubService.
 */
export type ClubServiceHistory = {
  id: string;
  serviceId: string;
  serviceName: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  changes: string; // A summary of what was changed
  note?: string;
};


// =================================================================
//                      SCHEDULING & EVENTS
// =================================================================

/**
 * Defines the types of schedule events.
 */
export type ScheduleEventType = 'training' | 'competition' | 'camp' | 'event';

/**
 * Represents an event in the club's schedule.
 */
export type ScheduleEvent = {
  id: string;
  title: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  type: ScheduleEventType;
  location: string;
  attendees: string[]; // Array of Member IDs
  description?: string | null;
  maxAttendees?: number;
};

// =================================================================
//                      INVENTORY & LOGISTICS
// =================================================================

/**
 * Describes an event in the inventory log (e.g., restock, correction).
 */
export type InventoryEvent = {
    id: string;
    productId: string;
    date: string; // ISO 8601
    type: 'restock' | 'sale' | 'correction' | 'initial';
    quantityChange: number;
    reason?: string;
    relatedSaleId?: string;
};

// =================================================================
//                      SYSTEM & UTILITY TYPES
// =================================================================

/**
 * Represents a reminder for a specific task.
 */
export type Reminder = {
    id: string;
    title: string;
    dueDate: string; // ISO 8601
    isCompleted: boolean;
    relatedLink?: string;
};

/**
 * Represents a message from the AI assistant.
 */
export type AssistantMessage = {
  id: string;
  timestamp: string; // ISO 8601
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Represents an analyzed subscription for member analysis.
 */
export type AnalyzedSubscription = {
    serviceName: string;
    status: 'active' | 'lapsing' | 'inactive';
    expiryDate: string; // ISO 8601
    paymentsBehind: number; // Number of missed payments
};

/**
 * Represents the comprehensive analysis of a member.
 */
export type MemberAnalysis = {
    memberId: string;
    memberName: string;
  analysisDate: string; // ISO 8601
    overallStatus: 'green' | 'orange' | 'red'; // Traffic light system
    analyzedSubscriptions: AnalyzedSubscription[];
    // Add other relevant analysis fields here
};
