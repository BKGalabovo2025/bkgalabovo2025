
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

export interface Subscription {
    id: string;
    memberId: string; // Връзка към член
    type: 'monthly' | 'quarterly' | 'yearly' | 'single_visit'; // Тип на абонамента
    startDate: string;
    endDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue'; // Статус на плащане
}

export interface Payment {
    id: string;
    subscriptionId: string; // Връзка към абонамент
    amount: number;
    paymentDate: string;
    method: 'cash' | 'card' | 'bank_transfer'; // Метод на плащане
}

export interface ClubEvent {
    id: string;
    title: string;
    date: string;
    description: string;
    participants: string[]; // Масив от memberId
}

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Sale {
    id: string;
    itemId: string;
    quantity: number;
    totalAmount: number;
    saleDate: string;
    memberId?: string; // Не е задължително
}
