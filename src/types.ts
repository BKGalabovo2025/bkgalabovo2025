
// src/types.ts

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
  registrationDate: string; // ISO string for date only
  dateOfBirth: string; // ISO string for date only
  address?: string;
  status: 'active' | 'inactive';
  educationInstitution?: string;
  notes?: string;
  personalId?: string; // ЕГН
}


/**
 * Represents a single payment record, typically for membership fees or other one-off payments.
 */
export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  paymentDate: string; // ISO string
  type: 'membership_fee' | 'donation' | 'other';
}

/**
* Represents a recurring subscription or a single financial obligation.
*/
export interface Subscription {
  id: string;
  memberId: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'single_visit';
  amount: number;
  startDate: string; // ISO string for the period start
  endDate: string;   // ISO string for the period end
  status: 'paid' | 'pending' | 'overdue';
}

/**
 * Represents a product in the inventory.
 */
export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string;
}

/**
 * Represents an individual item within a sale.
 */
export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Represents a completed sale transaction.
 */
export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  memberId?: string;
  customerName: string;
}

/**
 * Represents a training session.
 */
export interface Training {
  id: string;
  date: string;
  time: string;
  duration: number; // in minutes
  location: string;
  coach: string;
  participants: string[]; // array of member IDs
}

/**
 * Represents a competition event.
 */
export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  participants: string[]; // array of member IDs
}

/**
 * Represents a training camp.
 */
export interface Camp {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  participants: string[]; // array of member IDs
}

/**
 * Represents a general club event.
 */
export interface ClubEvent {
  id: string;
  name: string;
  date: string;
  description: string;
}
