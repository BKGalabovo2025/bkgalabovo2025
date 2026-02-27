import { Timestamp } from 'firebase/firestore';

// Represents a single reservation made by an external client
export interface Reservation {
  id: string;
  courtId: number; // 1-6
  startTime: Timestamp;
  endTime: Timestamp;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  status: 'unpaid' | 'paid' | 'cancelled';
  totalPrice: number; // in cents, to avoid floating point issues
  createdAt: Timestamp;
}

// Represents a time slot that is blocked for internal activities (e.g., training)
export interface BlockedSlot {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  // An array of court IDs this slot applies to. If empty, it applies to all courts.
  courtIds: number[]; 
  createdAt: Timestamp;
}
