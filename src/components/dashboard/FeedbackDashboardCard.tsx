"use client";

/* eslint-disable sonarjs/no-nested-conditional */

import { ArrowRight, MessageSquare, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { getFeedbackAdminDataAction } from "@/lib/actions/feedback";
import { useAppStore } from "@/store/use-app-store";
import { FeedbackStats, FeedbackSubmission } from "@/types/feedback.types";

export function FeedbackDashboardCard() {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";

  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await getFeedbackAdminDataAction(siteId);
      if (res.success && res.data) {
        setSubmissions(res.data.submissions || []);
        setStats(res.data.stats || null);
      }
    } catch {
      // silently handle
    }
  }, [siteId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const recentReviews = useMemo(() => {
    // Prioritize pending reviews (awaiting moderation), then newest reviews
    const sorted = [...submissions].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
    return sorted.slice(0, 3);
  }, [submissions]);

  const pendingCount = stats?.pendingSubmissions || 0;
  const avgRating = stats?.averageRating ?? 5.0;
  const totalCount = stats?.totalSubmissions || submissions.length;

  return (
    <BentoCard className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-2xs dark:bg-amber-950/50 dark:text-amber-400">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Отзиви и препоръки
              </h2>
              <p className="text-[11px] text-zinc-400">
                Обратна връзка от сайта
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {pendingCount} за преглед
              </span>
            ) : totalCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                ⭐ {avgRating.toFixed(1)} ({totalCount})
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                0 отзива
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {recentReviews.length > 0 ? (
          <div className="custom-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
            {recentReviews.map((rev) => (
              <div
                key={rev.id}
                className="group flex flex-col gap-1 rounded-2xl border border-amber-100/70 bg-amber-50/20 p-3 transition-all hover:border-amber-300 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {rev.respondentName || "Клиент"}
                    </span>
                    {rev.status === "pending" && (
                      <Badge
                        variant="secondary"
                        className="border-none bg-rose-100 px-1.5 py-0 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      >
                        Нов
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                    {Array.from({ length: rev.overallRating || 5 }).map(
                      (_, i) => (
                        <Star key={i} className="size-3 fill-amber-400" />
                      )
                    )}
                  </div>
                </div>

                {rev.reviewText ? (
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                    &ldquo;{rev.reviewText}&rdquo;
                  </p>
                ) : rev.highlightQuote ? (
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                    &ldquo;{rev.highlightQuote}&rdquo;
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400 italic">
                    (Оценка без писмен коментар)
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="max-w-40 truncate">
                    {rev.eventTitle ||
                      rev.campaignTitle ||
                      "Обща клубна оценка"}
                  </span>
                  <span>
                    {new Date(rev.createdAt).toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="my-2 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/40">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Няма нови отзиви
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Формите за обратна връзка в сайта очакват първи впечатления
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Link
          href="/feedback"
          className="group flex items-center justify-between text-xs font-semibold text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
        >
          <span>Център за отзиви</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </BentoCard>
  );
}
