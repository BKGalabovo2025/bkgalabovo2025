"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Star,
  Tag,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { updateSubmissionStatusServerAction } from "@/lib/actions/feedback";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";

interface SubmissionDetailsDialogProps {
  submission: FeedbackSubmission | null;
  campaign?: FeedbackCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated: () => void;
}

export function SubmissionDetailsDialog({
  submission,
  campaign,
  open,
  onOpenChange,
  onStatusUpdated,
}: SubmissionDetailsDialogProps) {
  const [adminNotes, setAdminNotes] = useState(submission?.adminNotes || "");
  const [highlightQuote, setHighlightQuote] = useState(
    submission?.highlightQuote || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!submission) return null;

  const handleUpdateStatus = async (
    newStatus: "approved" | "rejected" | "pending",
    showInPublic: boolean
  ) => {
    setIsSaving(true);
    try {
      const srvRes = await updateSubmissionStatusServerAction(
        submission.id,
        newStatus,
        showInPublic,
        adminNotes,
        highlightQuote
      );
      if (!srvRes.success) {
        await feedbackService.updateSubmissionStatus(
          submission.id,
          newStatus,
          showInPublic,
          adminNotes,
          highlightQuote
        );
      }
      toast.success(
        newStatus === "approved"
          ? "Отзивът е одобрен за публичния сайт!"
          : newStatus === "rejected"
            ? "Отзивът е отхвърлен"
            : "Статусът е актуализиран"
      );
      onStatusUpdated();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при обновяване на статуса");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(submission.createdAt).toLocaleDateString(
    "bg-BG",
    {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {submission.status === "approved" ? (
                <Badge className="border-emerald-200 bg-emerald-100 font-bold text-emerald-800">
                  <CheckCircle2 className="mr-1 size-3.5" />
                  Одобрен отзив
                </Badge>
              ) : submission.status === "rejected" ? (
                <Badge
                  variant="destructive"
                  className="border-rose-200 bg-rose-100 font-bold text-rose-800"
                >
                  <XCircle className="mr-1 size-3.5" />
                  Отхвърлен
                </Badge>
              ) : (
                <Badge className="border-amber-200 bg-amber-100 font-bold text-amber-800">
                  <Clock className="mr-1 size-3.5" />
                  Чакащ преглед
                </Badge>
              )}

              <Badge
                variant="outline"
                className="border-zinc-200 font-medium text-zinc-600"
              >
                {submission.respondentRole === "parent"
                  ? "Родител"
                  : submission.respondentRole === "athlete"
                    ? "Състезател"
                    : submission.respondentRole === "client"
                      ? "Клиент (Recovery Zone)"
                      : "Гост"}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < submission.overallRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-200"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs font-black text-zinc-900">
                {submission.overallRating}/5
              </span>
            </div>
          </div>

          <DialogTitle className="mt-2 text-base sm:text-lg font-black tracking-tight text-zinc-900">
            {submission.respondentName}
            {submission.childName && (
              <span className="text-sm font-semibold text-zinc-500">
                {" "}
                (Родител на {submission.childName})
              </span>
            )}
          </DialogTitle>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-indigo-500" />
              {formattedDate}
            </span>
            {submission.eventTitle && (
              <span className="flex items-center gap-1">
                <Tag className="size-3.5 text-indigo-500" />
                {submission.eventTitle}
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 custom-scrollbar min-h-0">
          <div className="space-y-4 p-3.5 sm:p-4.5">
            {/* Main Review text */}
            {submission.reviewText && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-900 uppercase">
                  <MessageSquare className="size-3.5 text-indigo-600" />
                  Главен отзив и коментар
                </h4>
                <p className="text-sm leading-relaxed text-zinc-800 italic">
                  &ldquo;{submission.reviewText}&rdquo;
                </p>
              </div>
            )}

            {/* Questions & Answers breakdown */}
            <div>
              <h4 className="mb-3 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                Детайлни отговори на въпросите
              </h4>

              <div className="space-y-3">
                {campaign?.questions && campaign.questions.length > 0
                  ? campaign.questions.map((q) => {
                      const ans = submission.answers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-xs"
                        >
                          <div className="font-semibold text-zinc-800">
                            {q.label}
                          </div>

                          <div className="mt-1.5 font-bold text-indigo-700">
                            {q.type === "rating" ? (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`size-3.5 ${
                                      i < Number(ans || 0)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-zinc-200"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-zinc-900">
                                  {ans ? `${ans}/5` : "Не е оценено"}
                                </span>
                              </div>
                            ) : q.type === "boolean" ? (
                              ans ? (
                                <span className="text-emerald-700">✓ Да</span>
                              ) : (
                                <span className="text-rose-600">✕ Не</span>
                              )
                            ) : (
                              <span className="leading-relaxed font-normal text-zinc-900">
                                {String(ans || "Няма посочен отговор")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  : /* Fallback if campaign questions not passed */
                    Object.entries(submission.answers).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs"
                      >
                        <div className="font-semibold text-zinc-700">{key}</div>
                        <div className="mt-1 font-bold text-indigo-700">
                          {String(val)}
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Highlight Quote customization */}
            <div className="space-y-1.5 border-t border-zinc-100 pt-4">
              <Label
                htmlFor="highlightQuote"
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-700"
              >
                <Sparkles className="size-3.5 text-amber-500" />
                Акцентен цитат за публичния сайт (по избор)
              </Label>
              <Textarea
                id="highlightQuote"
                value={highlightQuote}
                onChange={(e) => setHighlightQuote(e.target.value)}
                placeholder="Въведете кратък силен цитат за витрината на сайта или оставете празно..."
                rows={2}
                className="rounded-xl border-zinc-200 text-xs"
              />
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5">
              <Label
                htmlFor="adminNotes"
                className="text-xs font-bold text-zinc-700"
              >
                Вътрешни бележки на администратора (невидими за родителите)
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Вътрешна информация, последващи действия или бележки..."
                rows={2}
                className="rounded-xl border-zinc-200 text-xs"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="shrink-0 flex flex-wrap items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Затвори
          </Button>

          <div className="flex items-center gap-2">
            {submission.status !== "rejected" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleUpdateStatus("rejected", false)}
                className="h-9 rounded-xl border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <XCircle className="mr-1.5 size-3.5" />
                Отхвърли
              </Button>
            )}

            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => handleUpdateStatus("approved", true)}
              className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Одобри за сайта
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
