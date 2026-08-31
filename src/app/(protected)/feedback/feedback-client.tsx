"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Layers,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { feedbackService } from "@/services/feedback-service";
import { getEvents } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { ScheduleEvent } from "@/types";
import {
  FeedbackCampaign,
  FeedbackStats,
  FeedbackSubmission,
  FeedbackSurveyTemplate,
} from "@/types/feedback.types";

import { FeedbackCampaignsTab } from "./components/FeedbackCampaignsTab";
import { FeedbackSubmissionsTab } from "./components/FeedbackSubmissionsTab";
import { FeedbackTemplatesTab } from "./components/FeedbackTemplatesTab";

function FeedbackClientContent() {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";

  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [campaigns, setCampaigns] = useState<FeedbackCampaign[]>([]);
  const [templates, setTemplates] = useState<FeedbackSurveyTemplate[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
    averageRating: 5.0,
    totalCampaigns: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "submissions" | "campaigns" | "templates"
  >("submissions");

  const loadData = async () => {
    setIsLoading(true);
    try {
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
      console.error("Failed to load feedback data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 uppercase">
            <Sparkles className="size-6 text-indigo-600" />
            Отзиви и Анкети
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Обратна връзка от родители и състезатели за лагери, турнири и
            тренировки
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
          >
            <Link href="/club/reviews" target="_blank">
              <ExternalLink className="mr-1.5 size-4" />
              Публична витрина на Отзивите
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Pending Moderation */}
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">
                Чакащи преглед
              </span>
              <Clock className="size-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-950">
              {stats.pendingSubmissions}
            </div>
            <p className="mt-0.5 text-[11px] text-amber-700">
              {stats.pendingSubmissions === 1
                ? "1 нов отзив за одобрение"
                : `${stats.pendingSubmissions} нови отзива`}
            </p>
          </CardContent>
        </Card>

        {/* Approved Public Reviews */}
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                Одобрени отзиви
              </span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-950">
              {stats.approvedSubmissions}
            </div>
            <p className="mt-0.5 text-[11px] text-emerald-700">
              Показват се в сайта
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 to-white shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-indigo-800 uppercase">
                Средна оценка
              </span>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-2xl font-black text-indigo-950">
              <span>{stats.averageRating}</span>
              <span className="text-xs font-semibold text-zinc-400">/ 5.0</span>
            </div>
            <p className="mt-0.5 text-[11px] text-indigo-700">
              От {stats.totalSubmissions} отзива
            </p>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="border-zinc-200 bg-white shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase">
                Анкети за събития
              </span>
              <LinkIcon className="size-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900">
              {campaigns.length}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">Генерирани линка</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "submissions" | "campaigns" | "templates")
        }
      >
        <TabsList className="grid h-12 w-full max-w-xl grid-cols-3 rounded-2xl bg-zinc-100 p-1">
          <TabsTrigger
            value="submissions"
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs sm:text-sm"
          >
            <Inbox className="size-4" />
            <span>Отзиви</span>
            {stats.pendingSubmissions > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-black"
              >
                {stats.pendingSubmissions}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="campaigns"
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs sm:text-sm"
          >
            <LinkIcon className="size-4" />
            <span>Анкети & Линкове</span>
            <Badge
              variant="secondary"
              className="ml-1 bg-zinc-200 text-[10px] font-black text-zinc-700"
            >
              {campaigns.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="templates"
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs sm:text-sm"
          >
            <Layers className="size-4" />
            <span>Шаблони</span>
            <Badge
              variant="secondary"
              className="ml-1 bg-zinc-200 text-[10px] font-black text-zinc-700"
            >
              {templates.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Submissions & Moderation */}
        <TabsContent value="submissions" className="mt-6">
          <FeedbackSubmissionsTab
            submissions={submissions}
            campaigns={campaigns}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* Tab 2: Campaigns & Share Links */}
        <TabsContent value="campaigns" className="mt-6">
          <FeedbackCampaignsTab
            campaigns={campaigns}
            templates={templates}
            events={events}
            siteId={siteId}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* Tab 3: Survey Templates */}
        <TabsContent value="templates" className="mt-6">
          <FeedbackTemplatesTab
            templates={templates}
            siteId={siteId}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FeedbackClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <FeedbackClientContent />
    </Suspense>
  );
}
