export type MarketingChannel = "whatsapp" | "viber" | "sms" | "email";

export type MarketingTemplateCategory =
  "general" | "camp" | "tournament" | "payment" | "schedule" | "feedback";

export interface MarketingRecipient {
  id: string;
  name: string;
  role: "athlete" | "parent" | "member" | "guest";
  childName?: string;
  parentName?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
  group?: string;
  siteId?: string;
}

export interface MarketingTemplate {
  id: string;
  siteId: string;
  title: string;
  category: MarketingTemplateCategory;
  channel: MarketingChannel;
  subject?: string;
  messageText: string;
  variables: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketingLog {
  id: string;
  siteId: string;
  recipientId: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  channel: MarketingChannel;
  messageText: string;
  templateUsed?: string;
  campaignTitle?: string;
  status: "sent" | "delivered" | "failed";
  sentAt: string; // ISO String
  sentBy: string; // User ID
}

export type MarketingLogFormData = Omit<MarketingLog, "id" | "sentAt">;

export interface MarketingStats {
  totalSent: number;
  sentThisMonth: number;
  byChannel: Record<MarketingChannel, number>;
  activeRecipientsCount: number;
}

export interface MarketingAutomationRule {
  id: string;
  siteId: string;
  title: string;
  description: string;
  triggerEvent:
    | "post_camp_survey"
    | "post_tournament_survey"
    | "birthday"
    | "membership_expiring"
    | "inactivity_14d";
  delayHours: number;
  channel: MarketingChannel;
  templateId?: string;
  isActive: boolean;
}
