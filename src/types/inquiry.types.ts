export type InquiryTarget = "self" | "child";
export type InquirySkillLevel = "beginner" | "intermediate" | "advanced";
export type InquiryStatus = "new" | "contacted" | "enrolled" | "archived";

export interface EventInquiry {
  id?: string;
  name: string;
  phone: string;
  target?: InquiryTarget | null;
  childAge?: string | null;
  level?: InquirySkillLevel | null;
  notes?: string | null;
  eventId?: string | null;
  eventTitle: string;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  siteId: string;
  status: InquiryStatus;
  createdAt: string;
  contactedAt?: string | null;
  // Recovery zone specific fields
  procedureName?: string | null;
  preferredZone?: string | null;
  goal?: string | null;
  preferredTimeSlot?: string | null;
}
