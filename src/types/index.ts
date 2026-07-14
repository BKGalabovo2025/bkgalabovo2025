// This file is the single source of truth for all data structures in the application.
// We are re-exporting the Member type from its dedicated file to maintain a single source of truth.
export { type Member } from "./member.types";
export { type ClientPackage } from "./package.types";
export { type Reservation, type BlockedSlot } from "./reservation";
export {
  type DeclarationTemplate,
  type SignedDeclaration,
} from "./declaration.types";

export type Family = {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
};

// =================================================================
//                            CORE TYPES
// =================================================================

/**
 * Represents a physical product sold by the club.
 */
export type Product = {
  id: string;
  siteId: string; // Added for multi-tenancy
  name: string;
  description?: string;
  price: number;
  currency: "EUR";
  category: string;
  stock: number; // Current stock level
  imageUrl?: string | null;
  restockThreshold?: number | null; // Threshold for restock reminders
};

export { type Sale } from "./sale.types";

// =================================================================
//                  SUBSCRIPTIONS & SERVICES
// =================================================================

/**
 * Represents a single, manageable price point in the system.
 * This allows prices to be updated dynamically from a settings panel.
 */
export type Price = {
  id: string; // A unique, machine-readable key (e.g., "SUBSCRIPTION_CHILDREN_MONTHLY")
  siteId: string; // Added for multi-tenancy
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
  siteId: string; // Added for multi-tenancy
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
type TargetGroup = "Деца" | "Любители" | "Състезатели" | "Професионалисти";

/**
 * Defines a special right granted by a club service.
 */
type SpecialRight = {
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
type CancellationPolicy = {
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
  siteId: string; // Added for multi-tenancy
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

  // Recovery Zone specific fields (for multi-tenancy support)
  requiredResources?: import("./booking.types").ResourceRequirements;
  isExclusive?: boolean;
  bufferAfter?: number; // in minutes
  category?: string;
  zones?: string[];
  athleteCount?: number;
  numberOfDays?: number;
  proceduresPerDay?: number;
  sessionType?: string;
  imageUrl?: string | null;
  imageDisplayMode?: "collage" | "carousel";

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  createdBy: { userId: string; userName: string };
  updatedBy: { userId: string; userName: string };
};

/**
 * Represents a general service offered by the club (e.g., racket stringing).
 */
export type GeneralService = {
  id: string;
  siteId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  performerName: string;
  performerType: "internal" | "external";
  pricingUnit: "fixed" | "per_hour" | "per_session";
  imageUrl?: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  createdBy: { userId: string; userName: string };
  updatedBy?: { userId: string; userName: string };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PaymentHistoryItem = {
  date: string;
  amount: number;
  paymentId: string;
  saleId?: string;
  paymentMethod?: string;
  note?: string;
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
  paymentStatus?: "paid" | "unpaid";
  paymentType?: "subscription" | "individual";
  paymentDate?: string;
  saleId?: string;
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
  isCancelled?: boolean;
};

// =================================================================
//                      INVENTORY & LOGISTICS
// =================================================================

/**
 * Describes an event in the inventory log (e.g., restock, correction).
 */
export type InventoryEvent = {
  id: string;
  siteId: string; // Added for multi-tenancy
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
  clientName?: string;
};

/**
 * Describes an event in the general services log.
 */
export type GeneralServiceEvent = {
  id: string;
  siteId: string;
  serviceId: string;
  serviceName: string;
  createdAt: string; // ISO 8601
  type: "create" | "update" | "delete" | "sale";
  notes?: string;
  relatedSaleId?: string;
  userId: string;
  userName: string;
  oldPrice?: number;
  newPrice?: number;
  clientName?: string;
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
