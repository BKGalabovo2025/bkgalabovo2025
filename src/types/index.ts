import { z } from "zod";

// This file is the single source of truth for all data structures in the application.
// We are re-exporting the Member type from its dedicated file to maintain a single source of truth.
export { type Member } from "./member.types";

// =================================================================
//                            CORE TYPES
// =================================================================

/**
 * Zod schema for validating family data.
 * This ensures that family objects are structured correctly, including timestamps.
 */
export const FamilySchema = z.object({
  id: z.string().min(1, "ID is required."),
  name: z.string().min(1, "Family name is required."),
  memberIds: z.array(z.string()).default([]),
  createdAt: z
    .string()
    .datetime({ message: "Invalid creation date format" })
    .optional(),
  updatedAt: z
    .string()
    .datetime({ message: "Invalid update date format" })
    .optional(),
});

/**
 * Represents a family unit, grouping multiple members.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type Family = z.infer<typeof FamilySchema>;

/**
 * Represents a physical product sold by the club.
 */
export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: "EUR";
  category: string;
  stock: number; // Current stock level
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
 * UPDATED: Renamed 'total' to 'totalAmount' and added 'subscriptionId'.
 */
export type Sale = {
  id: string;
  memberId: string;
  saleDate: string; // ISO 8601
  items: SaleItem[];
  status: "pending" | "completed" | "cancelled";
  isPaid: boolean;
  totalAmount: number; // Corrected field name
  currency: "EUR";
  subscriptionId?: string | null; // Added for linking sales to subscriptions
  createdAt: string; // ISO 8601
};

// =================================================================
//                  SUBSCRIPTIONS & SERVICES
// =================================================================

/**
 * Represents a single, manageable price point in the system.
 * This allows prices to be updated dynamically from a settings panel.
 */
export type Price = {
  id: string; // A unique, machine-readable key (e.g., "SUBSCRIPTION_CHILDREN_MONTHLY")
  name: string; // A human-readable name (e.g., "Месечен абонамент за деца")
  description?: string; // Optional further details
  value: number; // The price in Euro (always a whole number)
  currency: "EUR";
  isActive: boolean; // Allows deactivating a price without deleting it
  updatedAt: string; // ISO 8601 timestamp of the last modification
  updatedBy: {
    userId: string;
    userName: string;
  };
};

/**
 * Represents a historical log entry for any change made to a Price.
 */
export type PriceHistory = {
  id: string;
  priceId: string; // The ID of the Price entity that was changed
  timestamp: string; // ISO 8601 timestamp of when the change occurred
  userId: string;
  userName: string;
  oldValue: number; // The price value before the change
  newValue: number; // The price value after the change
  notes?: string; // Optional notes from the user who made the change
};

/**
 * Defines the type for a group targeted by a service.
 */
export type TargetGroup =
  | "Деца"
  | "Любители"
  | "Състезатели"
  | "Професионалисти";

/**
 * Defines a special right granted by a club service.
 */
export type SpecialRight = {
  right: "kartoteka" | "equipment";
  description: string;
  trigger: {
    condition: "IMMEDIATELY" | "AFTER_N_PAYMENTS";
    paymentCount?: number;
  };
};

/**
 * Defines the cancellation policy for a club service.
 */
export type CancellationPolicy = {
  isAllowed: boolean;
  noticePeriodDays: number;
  feeType: "none" | "fixed" | "percentage";
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
  currency: "EUR";
  type: "Абонамент" | "Еднократно плащане";
  billingPeriod: "Месечен" | "Годишен" | null;
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
    };
  };
  specialRights: SpecialRight[];
  cancellationPolicy: CancellationPolicy;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  createdBy: { userId: string; userName: string };
  updatedBy: { userId: string; userName: string };
};

export type PaymentHistoryItem = {
  date: string;
  amount: number;
  paymentId: string;
  saleId?: string; // Added to link to a specific sale if applicable
};

/**
 * Represents a member's subscription to a specific club service.
 * UPDATED: Added 'price' field.
 */
export type Subscription = {
  id: string;
  memberId: string;
  serviceId: string;
  serviceName: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  status: "active" | "inactive" | "cancelled" | "pending_payment";
  price: number; // The price of the subscription per billing period
  pricePaid: number;
  currency: "EUR";
  paymentHistory: PaymentHistoryItem[];
  paymentsMadeCount: number;
  totalPaymentsCount: number;
  licenseGranted?: boolean;
  apparelGranted?: boolean;
  linkedSubscriptionId?: string | null; // ID of the corresponding family subscription
};

// =================================================================
//                      SCHEDULING & EVENTS
// =================================================================

/**
 * Defines the types of schedule events.
 */
export type ScheduleEventType =
  | "training"
  | "competition"
  | "camp"
  | "event"
  | "other";

export type Attendee = {
  memberId: string;
  name: string;
  attended: boolean;
};

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
  attendees: Attendee[];
  attendeeMemberIds: string[];
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
  productName: string;
  createdAt: string; // ISO 8601
  type: "restock" | "sale" | "correction" | "initial" | "price_update";
  quantityChange: number;
  notes?: string;
  relatedSaleId?: string;
  userId: string;
  userName: string;
  oldPrice?: number;
  newPrice?: number;
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
  memberId?: string;
  memberName?: string;
  description?: string;
  type: "payment" | "inventory" | "other" | "error" | "warning";
  relatedId?: string;
};
