
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
}

export interface Payment {
    id: string;
    memberId: string; // Връзка към член
    amount: number;
    paymentDate: string;
    type: 'membership_fee' | 'donation' | 'other'; // Тип на плащането
    notes?: string;
}

export type Subscription = {
    id: string;
    memberId: string;
    type: 'annual' | 'monthly';
    startDate: string;
    endDate: string;
    status: 'paid' | 'pending' | 'overdue';
    amount: number;
};
