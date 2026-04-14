/**
 * A centralized file for all Firestore collection names.
 * Using this constant object instead of hard-coded "magic strings"
 * prevents typos and simplifies future maintenance and refactoring.
 */
export const FIRESTORE_COLLECTIONS = {
  ATTENDANCE: "attendance",
  CLUB_SERVICES: "clubServices",
  EVENTS: "events",
  FAMILIES: "families",
  INVENTORY_EVENTS: "inventoryEvents",
  MEMBERS: "members",
  PRICES: "prices",
  PRODUCTS: "products",
  REMINDERS: "reminders",
  SALES: "sales",
  SERVICE_HISTORY: "serviceHistory",
  MEMBER_SUBSCRIPTIONS: "memberSubscriptions",
  USERS: "users",
} as const;
