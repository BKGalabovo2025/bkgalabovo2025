
export interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    registrationDate: string;
    status: 'active' | 'inactive';
    address: string;
    dateOfBirth: string;
    personalId?: string;
    notes?: string;
}

export interface Payment {
    id: string;
    memberId: string; // Връзка към член
    amount: number;
    paymentDate: string;
    type: 'membership_fee' | 'donation' | 'other'; // Тип на плащането
    notes?: string;
}
