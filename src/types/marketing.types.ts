export type MarketingChannel = "email" | "phone";

export type ContactCommunicationStatus =
  "pending" | "contacted" | "emailed" | "archived";

export type MarketingTemplateCategory =
  | "general"
  | "camp"
  | "tournament"
  | "payment"
  | "schedule"
  | "feedback"
  | "recovery"
  | "procedures";

export interface MarketingRecipient {
  id: string;
  name: string;
  role: "athlete" | "parent" | "member" | "guest";
  childName?: string;
  parentName?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
  communicationStatus?: ContactCommunicationStatus;
  group?: string;
  siteId?: string;
  notes?: string;
  lastContactAt?: string;
  lastContactType?: "phone" | "email";
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
  notes?: string;
}

export type MarketingLogFormData = Omit<MarketingLog, "id" | "sentAt">;

export interface MarketingStats {
  totalSent: number;
  sentThisMonth: number;
  byChannel: Record<string, number>;
  activeRecipientsCount: number;
  callsCount?: number;
  emailsCount?: number;
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

export function isTemplateForSender(
  template: { category?: string; siteId?: string; title?: string },
  sender: "bkgalabovo" | "recoveryzone"
): boolean {
  if (template.siteId && template.siteId === sender) return true;
  const title = (template.title || "").toLowerCase();
  const category = (template.category || "").toLowerCase();

  const isRecoveryCategory =
    category === "recovery" || category === "procedures";
  const isRecoveryText =
    title.includes("recovery") ||
    title.includes("възстановява") ||
    title.includes("процедур");

  if (sender === "recoveryzone") {
    return isRecoveryCategory || isRecoveryText;
  }

  // sender === "bkgalabovo"
  if (isRecoveryCategory || isRecoveryText) {
    return false;
  }
  return true;
}
