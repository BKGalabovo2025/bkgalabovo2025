import type { Timestamp } from "firebase/firestore";

/**
 * Defines the possible attachment types for recovery services.
 */
export type AttachmentType = "arms" | "hips" | "legs";

/**
 * A flexible interface to define the resources required for a session.
 */
export interface ResourceRequirements {
  attachments: Partial<Record<AttachmentType, number>>;
  compressors: number;
}

/**
 * Defines the possible states for a reservation.
 */
export type ReservationStatus =
  | "cancelled"
  | "checked-in"
  | "completed"
  | "no-show"
  | "pending"
  | "scheduled";

/**
 * Represents a reservation in the system.
 * Ported from Recovery Zone to support multi-tenant booking logic.
 */
export interface Reservation {
  id: string;
  siteId: string; // Added for multi-tenancy
  serviceId: string; // Link to ClubService
  serviceName: string;

  // Time blocking (including buffers)
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601

  // Actual client presence
  clientStartTime: string; // ISO 8601
  clientEndTime: string; // ISO 8601

  // Buffers
  bufferAfter?: number; // in minutes

  // Resources
  usedResources: ResourceRequirements;
  isExclusive?: boolean;

  // Client info (denormalized for display)
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;

  // Additional clients (if session allows multiple)
  additionalClients?: Array<{
    id?: string;
    name: string;
    email?: string;
    phone?: string;
  }>;

  status: ReservationStatus;
  notes: string;

  // Payment info
  price: number;
  discountAmount?: number;
  finalPrice: number;

  // Admin tracking
  isNew?: boolean;
  teamMemberId?: string;
  teamMemberName?: string;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Firestore-specific reservation type with Timestamps.
 */
export interface FirestoreReservation extends Omit<
  Reservation,
  | "startTime"
  | "endTime"
  | "clientStartTime"
  | "clientEndTime"
  | "createdAt"
  | "updatedAt"
> {
  startTime: Timestamp;
  endTime: Timestamp;
  clientStartTime: Timestamp;
  clientEndTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
