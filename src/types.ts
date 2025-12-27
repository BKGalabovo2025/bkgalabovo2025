export interface Member {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  phone: string | null;
  phoneType: 'personal' | 'parent' | null;
  dateOfBirth: string; // ISO 8601 format
  registrationDate: string; // ISO 8601 format
  status: 'active' | 'inactive';
  avatarUrl?: string | null;
  familyId?: string | null;
  educationInstitution: string | null;
  address: string | null;
  notes: string | null;

  // To be used for computationally expensive analysis
  analysisCache?: {
    generatedAt: string;
    result: MemberAnalysis;
  } | null;
}

export interface MemberAnalysis {
  totalSpent: number;
  lastActivityDate: string;
  activeSubscriptions: number;
  // ... other analysis fields
}


export interface Family {
  id: string;
  name: string; // e.g., "Family of Petar Petrov"
  memberIds: string[];
}

export interface Sale {
  id: string;
  memberId: string;
  items: SaleItem[];
  total: number;
  date: string; // ISO 8601 format
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number; // Price at the time of sale
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Attendance {
  id: string;
  memberId: string;
  date: string; // ISO 8601 format
  sessionId: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  date: string; // ISO 8601 format
  startTime: string;
  endTime: string;
}

export interface Payment {
    id: string;
    memberId: string;
    amount: number;
    currency: 'BGN' | 'EUR';
    date: string; // ISO 8601
    method: 'cash' | 'card' | 'bank_transfer';
    status: 'paid' | 'unpaid' | 'failed';
    notes?: string;
}

export interface Subscription {
    id: string;
    memberId: string;
    serviceId: string; // Link to a predefined service/plan
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
    status: 'active' | 'inactive' | 'cancelled';
}
