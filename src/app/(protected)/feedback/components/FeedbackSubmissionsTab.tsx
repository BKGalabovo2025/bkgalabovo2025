/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";

import { SubmissionDetailsDialog } from "./SubmissionDetailsDialog";

interface FeedbackSubmissionsTabProps {
  submissions: FeedbackSubmission[];
  campaigns: FeedbackCampaign[];
  onRefresh: () => void;
}

export function FeedbackSubmissionsTab({
  submissions,
  campaigns,
  onRefresh,
}: FeedbackSubmissionsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<FeedbackSubmission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleQuickApprove = async (sub: FeedbackSubmission) => {
    try {
      await feedbackService.updateSubmissionStatus(
        sub.id,
        "approved",
        true,
        sub.adminNotes,
        sub.highlightQuote
      );
      toast.success("Отзивът е одобрен за публичния сайт!");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при одобряването");
    }
  };

  const handleQuickReject = async (sub: FeedbackSubmission) => {
    if (!window.confirm("Сигурни ли сте, че искате да отхвърлите този отзив?"))
      return;
    try {
      await feedbackService.updateSubmissionStatus(
        sub.id,
        "rejected",
        false,
        sub.adminNotes
      );
      toast.info("Отзивът е отхвърлен");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при отхвърлянето");
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този запис?"))
      return;
    try {
      await feedbackService.deleteSubmission(submissionId);
      toast.success("Записът е изтрит");
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при изтриването");
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== "all" && sub.status !== statusFilter) return false;
    if (eventTypeFilter !== "all" && sub.eventType !== eventTypeFilter)
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = sub.respondentName?.toLowerCase().includes(q);
      const matchesChild = sub.childName?.toLowerCase().includes(q);
      const matchesText = sub.reviewText?.toLowerCase().includes(q);
      const matchesEvent = sub.eventTitle?.toLowerCase().includes(q);
      if (!matchesName && !matchesChild && !matchesText && !matchesEvent) {
        return false;
      }
    }
    return true;
  });

  const getCampaignForSubmission = (campaignId: string) => {
    return campaigns.find((c) => c.id === campaignId) || null;
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търси по име на родител, дете, текст на отзив..."
              className="rounded-xl border-zinc-200 pl-9 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl border-zinc-200 text-xs sm:text-sm">
                <SelectValue placeholder="Всички статуси" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички статуси</SelectItem>
                <SelectItem value="pending">Чакащи одобрение</SelectItem>
                <SelectItem value="approved">Одобрени</SelectItem>
                <SelectItem value="rejected">Отхвърлени</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Type Filter */}
          <div className="w-full sm:w-44">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="rounded-xl border-zinc-200 text-xs sm:text-sm">
                <SelectValue placeholder="Всички типове" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички типове</SelectItem>
                <SelectItem value="camp">Лагери</SelectItem>
                <SelectItem value="training">Тренировки</SelectItem>
                <SelectItem value="competition">Състезания</SelectItem>
                <SelectItem value="general">Общи отзиви</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" ||
            eventTypeFilter !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setEventTypeFilter("all");
                setSearchQuery("");
              }}
              className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <X className="mr-1 size-3.5" />
              Изчисти
            </Button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <Inbox className="mx-auto mb-3 size-10 text-zinc-300" />
          <h3 className="mb-1 text-base font-bold text-zinc-900">
            Няма намерени отзиви
          </h3>
          <p className="mx-auto max-w-sm text-xs text-zinc-500">
            {statusFilter !== "all" || searchQuery
              ? "Опитайте да промените филтрите за търсене."
              : "Когато родителите попълнят анкетите за събития, отзивите им ще се появят тук за преглед и одобрение."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const isApproved = sub.status === "approved";
            const isPending = sub.status === "pending";
            const isRejected = sub.status === "rejected";

            return (
              <Card
                key={sub.id}
                className="overflow-hidden border-zinc-200 shadow-2xs transition-all hover:border-indigo-200 hover:shadow-xs"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    {/* Main Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isApproved ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800 uppercase">
                            <CheckCircle2 className="mr-1 size-3" />
                            Одобрен за сайта
                          </Badge>
                        ) : isRejected ? (
                          <Badge
                            variant="destructive"
                            className="border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-800 uppercase"
                          >
                            <XCircle className="mr-1 size-3" />
                            Отхвърлен
                          </Badge>
                        ) : (
                          <Badge className="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-800 uppercase">
                            <Clock className="mr-1 size-3" />
                            Чака одобрение
                          </Badge>
                        )}

                        <Badge
                          variant="outline"
                          className="border-zinc-200 bg-zinc-50 text-[10px] font-semibold text-zinc-600 uppercase"
                        >
                          {sub.eventType === "camp"
                            ? "Лагер"
                            : sub.eventType === "competition"
                              ? "Състезание"
                              : sub.eventType === "training"
                                ? "Тренировки"
                                : "Общ отзив"}
                        </Badge>

                        {sub.eventTitle && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {sub.eventTitle}
                          </span>
                        )}

                        {/* Rating Stars */}
                        <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < sub.overallRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-200"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-black text-zinc-900">
                            {sub.overallRating}/5
                          </span>
                        </div>
                      </div>

                      {/* Respondent & Excerpt */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-900">
                          <span>{sub.respondentName}</span>
                          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            {sub.respondentRole === "parent" && sub.childName
                              ? "👨‍👩‍👧 Родител на " + sub.childName
                              : sub.respondentRole === "parent"
                                ? "👨‍👩‍👧 Родител"
                                : sub.respondentRole === "athlete"
                                  ? "🏸 Състезател"
                                  : "🌟 Приятел / Гост"}
                          </span>
                        </div>

                        {sub.reviewText && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-700 italic">
                            &ldquo;{sub.reviewText}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        Попълнен на{" "}
                        {new Date(sub.createdAt).toLocaleDateString("bg-BG", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 border-t border-zinc-100 pt-3 md:border-none md:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="mr-1.5 size-3.5 text-indigo-600" />
                        Преглед на отговорите
                      </Button>

                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleQuickApprove(sub)}
                            className="rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 size-3.5" />
                            Одобри
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickReject(sub)}
                            className="rounded-xl text-rose-500 hover:bg-rose-50"
                            title="Отхвърли"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sub.id)}
                        className="rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
                        title="Изтрий"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Dialog */}
      <SubmissionDetailsDialog
        submission={selectedSubmission}
        campaign={
          selectedSubmission
            ? getCampaignForSubmission(selectedSubmission.campaignId)
            : null
        }
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusUpdated={onRefresh}
      />
    </div>
  );
}
