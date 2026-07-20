export interface MarketingLog {
  id: string;
  siteId: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  templateUsed: string;
  sentAt: string; // ISO String
  sentBy: string; // User ID who sent it
}

export type MarketingLogFormData = Omit<MarketingLog, "id" | "sentAt">;
