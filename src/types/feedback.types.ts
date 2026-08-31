export type SurveyQuestionType =
  | "rating" // 1-5 stars
  | "text" // Multi-line text
  | "select" // Single choice from options
  | "boolean" // Yes / No
  | "number"; // Numeric scale 1-10 or count

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // For 'select' type
  category?:
    "organization" | "coaching" | "atmosphere" | "facilities" | "general";
}

export type FeedbackEventType =
  "camp" | "training" | "competition" | "event" | "general";

export interface FeedbackSurveyTemplate {
  id: string;
  siteId: string;
  name: string;
  description: string;
  eventType: FeedbackEventType;
  questions: SurveyQuestion[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackCampaignStatus = "active" | "closed";

export interface FeedbackCampaign {
  id: string;
  siteId: string;
  title: string;
  description?: string;
  eventType: FeedbackEventType;
  eventId?: string; // Links to ScheduleEvent or Camp
  eventTitle?: string;
  templateId: string;
  templateName?: string;
  questions: SurveyQuestion[];
  status: FeedbackCampaignStatus;
  responseCount: number;
  averageRating?: number;
  targetAudience: "parents" | "athletes" | "all";
  createdAt: string;
  updatedAt: string;
}

export type FeedbackSubmissionStatus = "pending" | "approved" | "rejected";
export type RespondentRole = "parent" | "athlete" | "guest";

export interface FeedbackSubmission {
  id: string;
  siteId: string;
  campaignId: string;
  campaignTitle?: string;
  eventType: FeedbackEventType;
  eventId?: string;
  eventTitle?: string;

  // Respondent info
  respondentRole: RespondentRole;
  respondentName: string;
  childName?: string;
  respondentPhone?: string;
  respondentEmail?: string;

  // Main review
  overallRating: number; // 1 to 5
  reviewText: string;
  highlightQuote?: string; // Optional excerpt for public showcase

  // Detailed answers to questions: questionId -> answer
  answers: Record<string, string | number | boolean>;

  // Moderation
  status: FeedbackSubmissionStatus;
  showInPublic: boolean;
  isFeatured?: boolean; // Highlight on homepage
  adminNotes?: string;

  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FeedbackStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  averageRating: number;
  totalCampaigns: number;
}
