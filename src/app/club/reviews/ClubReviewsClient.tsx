/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackSubmission } from "@/types/feedback.types";

export default function ClubReviewsClient() {
  const [reviews, setReviews] = useState<FeedbackSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
        const data = await feedbackService.getPublicReviews("bkgalabovo");
        setReviews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    if (selectedCategory === "all") return reviews;
    return reviews.filter((r) => r.eventType === selectedCategory);
  }, [reviews, selectedCategory]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, total: 0, recommendRate: 100 };
    const total = reviews.length;
    const avg = Number(
      (
        reviews.reduce((acc, r) => acc + (r.overallRating || 5), 0) / total
      ).toFixed(1)
    );
    const recommendCount = reviews.filter((r) => r.overallRating >= 4).length;
    const recommendRate = Math.round((recommendCount / total) * 100);
    return { avg, total, recommendRate };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      <PublicNav />

      <main className="relative mx-auto max-w-7xl space-y-16 px-4 pt-32 pb-24 sm:px-6">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute top-20 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-80 right-10 size-80 rounded-full bg-indigo-600/15 blur-[100px]" />

        {/* Hero Section */}
        <div className="relative z-10 mx-auto max-w-3xl space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold tracking-widest text-blue-400 uppercase"
          >
            <Sparkles className="size-3.5" />
            Реални отзиви и препоръки
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black tracking-tight text-white uppercase sm:text-5xl"
          >
            Какво казват{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              родителите и децата
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm leading-relaxed text-zinc-400 sm:text-base"
          >
            Споделените преживявания и обратна връзка за нашите летни лагери,
            състезателни турнири и целогодишни тренировки в БК Гълъбово.
          </motion.p>
        </div>

        {/* Rating Metrics Showcase Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 rounded-3xl border border-blue-500/20 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="grid grid-cols-1 gap-6 divide-y divide-zinc-800 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {/* Avg Stars */}
            <div className="space-y-1 sm:px-4">
              <div className="flex items-center justify-center gap-1.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-6 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <div className="mt-2 text-3xl font-black text-white">
                {stats.avg} <span className="text-sm text-zinc-400">/ 5.0</span>
              </div>
              <p className="text-xs font-medium text-zinc-400">
                Обща оценка от родители
              </p>
            </div>

            {/* Recommendation rate */}
            <div className="space-y-1 pt-4 sm:px-4 sm:pt-0">
              <div className="text-3xl font-black text-blue-400">
                {stats.recommendRate}%
              </div>
              <p className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
                Категорично препоръчват
              </p>
              <p className="text-xs text-zinc-400">
                Бихте ли записали детето си отново
              </p>
            </div>

            {/* Total reviews */}
            <div className="space-y-1 pt-4 sm:px-4 sm:pt-0">
              <div className="text-3xl font-black text-indigo-400">
                {stats.total}+
              </div>
              <p className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
                Проверени мнения
              </p>
              <p className="text-xs text-zinc-400">
                От клубни лагери и турнири
              </p>
            </div>
          </div>
        </motion.div>

        {/* Categories Filter Tabs */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "🌟 Всички отзиви" },
            { id: "camp", label: "🏕️ Лагери" },
            { id: "training", label: "⚡ Тренировки" },
            { id: "competition", label: "🏸 Състезания" },
            { id: "general", label: "💬 Общи впечатления" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                selectedCategory === cat.id
                  ? "scale-105 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="size-8 animate-spin text-blue-500" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="relative z-10 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 py-20 text-center">
            <MessageSquare className="mx-auto mb-3 size-12 text-zinc-700" />
            <h3 className="text-lg font-bold text-zinc-400">
              Все още няма публикувани отзиви в тази категория
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
              След провеждане на предстоящите събития и лагери тук ще се появят
              първите отзиви от родителите.
            </p>
          </div>
        ) : (
          <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((rev, idx) => {
              const initial =
                rev.respondentName?.trim()?.charAt(0)?.toUpperCase() || "К";
              const formattedDate = new Date(rev.createdAt).toLocaleDateString(
                "bg-BG",
                {
                  month: "long",
                  year: "numeric",
                }
              );

              return (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10 sm:p-7">
                    {/* Top ambient glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />

                    <div className="space-y-4">
                      {/* Header: Stars with rating score & Event Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-4.5 transition-transform group-hover:scale-105 ${
                                  i < rev.overallRating
                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                                    : "text-zinc-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-zinc-400">
                            {rev.overallRating}.0
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className="rounded-full border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-blue-400 uppercase"
                        >
                          {rev.eventType === "camp"
                            ? "Лагер"
                            : rev.eventType === "competition"
                              ? "Състезание"
                              : rev.eventType === "training"
                                ? "Тренировки"
                                : "Клуб"}
                        </Badge>
                      </div>

                      {/* Event Title Tag */}
                      {rev.eventTitle && (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                          <Tag className="size-3 shrink-0 text-blue-400" />
                          <span className="truncate">{rev.eventTitle}</span>
                        </div>
                      )}

                      {/* Review Text */}
                      <div className="relative border-l-2 border-blue-500/40 py-0.5 pl-3.5">
                        <p className="text-sm leading-relaxed font-normal text-zinc-200 italic sm:text-[15px]">
                          &ldquo;{rev.highlightQuote || rev.reviewText}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Author / Parent Footer */}
                    <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-md shadow-blue-500/20">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white transition-colors group-hover:text-blue-300 sm:text-sm">
                            <span>{rev.respondentName}</span>
                            <span
                              title="Проверен отзив"
                              className="inline-flex"
                            >
                              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                            </span>
                          </div>
                          {rev.childName ? (
                            <div className="text-[11px] font-medium text-zinc-400">
                              Родител на {rev.childName}
                            </div>
                          ) : (
                            <div className="text-[11px] font-medium text-zinc-400 capitalize">
                              {rev.respondentRole === "athlete"
                                ? "Състезател"
                                : "Член на клуба"}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] font-medium text-zinc-500">
                        {formattedDate}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
