/**
 * Represents a prepaid package for a client in the Recovery Zone.
 */
export type ClientPackage = {
  id: string;
  siteId: string;
  memberId: string; // References the client in the 'members' collection
  serviceId: string; // References the 'clubServices' (Recovery Session types)
  serviceName: string;
  totalSessions: number;
  sessionsRemaining: number;
  purchaseDate: string; // ISO 8601
  expiryDate?: string; // ISO 8601
  status: "active" | "exhausted" | "expired";
  pricePaid: number;
  currency: "EUR";
  notes?: string;
};
