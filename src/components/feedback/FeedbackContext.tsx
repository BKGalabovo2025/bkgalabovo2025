"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getFeedbackAdminDataAction } from "@/lib/actions/feedback";
import { feedbackService } from "@/services/feedback-service";
import { getEvents } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import type { ScheduleEvent } from "@/types";
import type {
  FeedbackCampaign,
  FeedbackStats,
  FeedbackSubmission,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

export interface FeedbackContextType {
  siteId: string;
  submissions: FeedbackSubmission[];
  campaigns: FeedbackCampaign[];
  templates: FeedbackSurveyTemplate[];
  events: ScheduleEvent[];
  stats: FeedbackStats;
  isLoading: boolean;
  loadData: () => Promise<void>;
}

const defaultStats: FeedbackStats = {
  totalSubmissions: 0,
  pendingSubmissions: 0,
  approvedSubmissions: 0,
  rejectedSubmissions: 0,
  averageRating: 5.0,
  totalCampaigns: 0,
};

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";

  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [campaigns, setCampaigns] = useState<FeedbackCampaign[]>([]);
  const [templates, setTemplates] = useState<FeedbackSurveyTemplate[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [stats, setStats] = useState<FeedbackStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Try Server Action first (Admin SDK)
      const serverRes = await getFeedbackAdminDataAction(siteId);
      if (serverRes.success && serverRes.data) {
        const evs = await getEvents().catch(() => []);
        setSubmissions(serverRes.data.submissions);
        setCampaigns(serverRes.data.campaigns);
        setTemplates(serverRes.data.templates);
        setStats(serverRes.data.stats);
        setEvents(evs);
        return;
      }

      // 2. Fallback to Client SDK
      const [subsData, campsData, tmplsData, evsData, statsData] =
        await Promise.all([
          feedbackService.getSubmissions(siteId),
          feedbackService.getCampaigns(siteId),
          feedbackService.getTemplates(siteId),
          getEvents().catch(() => []),
          feedbackService.getFeedbackStats(siteId),
        ]);

      setSubmissions(subsData);
      setCampaigns(campsData);
      setTemplates(tmplsData);
      setEvents(evsData);
      setStats(statsData);
    } catch (e) {
      console.error("Failed to load feedback data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const value: FeedbackContextType = {
    siteId,
    submissions,
    campaigns,
    templates,
    events,
    stats,
    isLoading,
    loadData,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedbackContext(): FeedbackContextType {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error(
      "useFeedbackContext must be used within a <FeedbackProvider />"
    );
  }
  return ctx;
}
