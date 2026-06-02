import { Timestamp } from "firebase/firestore";

/**
 * Defines the possible states for a reservation.
 * Combines Court statuses and Recovery Zone statuses.
 */
export type ReservationStatus =
  | "unpaid"
  | "paid"
  | "cancelled"
  | "checked-in"
  | "completed"
  | "no-show"
  | "pending"
  | "scheduled"
  | "confirmed"; // Legacy status found in some docs

/**
 * Represents a single reservation in the system.
 * Unified to support both Court bookings and Recovery Zone services.
 */
export interface Reservation {
  id: string;
  siteId: string;
  packageGroupId?: string;
  saleId?: string;

  // Court Specific
  courtId?: number; // 1-6
  totalPrice?: number; // in Euro

  // Recovery Specific
  serviceId?: string;
  serviceName?: string;
  usedResources?: {
    attachments: Partial<Record<string, number>>;
    compressors: number;
  };
  isExclusive?: boolean;
  price?: number;
  finalPrice?: number;
  discountAmount?: number;

  // Shared Time Fields
  startTime: Timestamp;
  endTime: Timestamp;
  clientStartTime?: Timestamp;
  clientEndTime?: Timestamp;

  // Client Info
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;

  // Shared State
  status: ReservationStatus;
  notes?: string;
  bufferAfter?: number; // in minutes

  // Audit Tracking
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: {
    userId: string;
    userName: string;
  };
  updatedBy?: {
    userId: string;
    userName: string;
  };

  // Legacy fields
  isNew?: boolean;
  teamMemberId?: string;
  teamMemberName?: string;
  currency?: string;
}

// Represents a time slot that is blocked for internal activities (e.g., training)
export interface BlockedSlot {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  // An array of court IDs this slot applies to. If empty, it applies to all courts.
  courtIds: number[];
  siteId: string;
  createdAt: Timestamp;
}
