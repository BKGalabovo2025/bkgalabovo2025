/**
 * Централизиран файл за имената на всички Firestore колекции.
 * Използването на този обект вместо ръчно изписани низове ("magic strings")
 * предотвратява грешки при изписване и улеснява бъдещи промени.
 */
export const FIRESTORE_COLLECTIONS = {
    CLUB_SERVICES: 'clubServices',
    EVENTS: 'events',
    FAMILIES: 'families',
    INVENTORY_EVENTS: 'inventoryEvents',
    MEMBER_SUBSCRIPTIONS: 'memberSubscriptions',
    MEMBERS: 'members',
    PRODUCTS: 'products',
    SALES: 'sales',
    SERVICE_HISTORY: 'serviceHistory',
} as const;
