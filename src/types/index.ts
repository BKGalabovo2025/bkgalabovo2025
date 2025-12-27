
// Defines the shape of the Member object, used throughout the application.
export type Member = {
    // The unique identifier for the member, now guaranteed to be a string.
    id: string;
    firstName: string;
    // Middle name is optional.
    middleName?: string | null;
    lastName: string;
    email: string | null;
    phone: string | null;
    // Type of phone number, personal or parent's.
    phoneType?: 'personal' | 'parent' | null;
    // The date of birth, stored as an ISO 8601 string.
    dateOfBirth: string;
    // The registration date, stored as an ISO 8601 string.
    registrationDate: string;
    // Full address of the member.
    address?: string | null;
    // Status can be 'active' or 'inactive'.
    status: 'active' | 'inactive';
    // Optional URL for the member's avatar.
    avatarUrl?: string | null;
    // Optional ID linking to a family group.
    familyId?: string | null;
    // Optional information about the member's educational institution.
    educationInstitution?: string | null;
    // Optional personal identification number.
    personalId?: string | null;
    // General notes about the member.
    notes?: string | null;
    // Optional cache for member analysis to improve performance.
    analysisCache?: {
        generatedAt: string; // ISO string format
        result: MemberAnalysis;
    } | null;
};

// Defines the shape of a Sale object.
export type Sale = {
    id: string;
    memberId: string;
    // The name of the member, included for convenience.
    memberName: string;
    // The date of the sale, stored as an ISO 8601 string.
    saleDate: string;
    // Details of the items included in the sale.
    items: { productId: string; productName: string; quantity: number; unitPrice: number; }[];
    // The total amount of the sale.
    totalAmount: number;
    // Payment status of the sale.
    isPaid: boolean;
    // Currency of the sale, crucial for financial accuracy.
    currency: 'BGN' | 'EUR';
};

// Defines the shape of a Family group.
export type Family = {
    id: string;
    // An array of member IDs belonging to this family.
    memberIds: string[];
};

// Defines the shape of the MemberAnalysis object.
export type MemberAnalysis = {
    // The date the analysis was generated.
    generatedAt: string;
    // The member's current status based on subscriptions and attendance.
    activityStatus: 'active' | 'lapsing' | 'inactive';
    // Key metrics related to the member's engagement.
    keyMetrics: {
        totalPaid: number;
        totalDebt: number;
        mostPurchasedService: string;
        lastActivityDate: string;
    };
    // Summary of the member's active subscriptions.
    activeSubscriptions: { name: string; expiryDate: string; }[];
    // A log of the member's attendance.
    attendanceLog: { date: string; event: string; }[];
};