/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { motion } from "framer-motion";
import { Loader2, MessageSquare, Quote, Sparkles, Star } from "lucide-react";
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
            {filteredReviews.map((rev, idx) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group flex h-full flex-col justify-between rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-6 shadow-xl backdrop-blur-md transition-all hover:border-blue-500/40">
                  <div className="space-y-4">
                    {/* Header: Stars & Event Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-4 ${
                              i < rev.overallRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>

                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-500/10 text-[10px] font-bold tracking-wider text-blue-400 uppercase"
                      >
                        {rev.eventType === "camp"
                          ? "Лагер"
                          : rev.eventType === "competition"
                            ? "Състезание"
                            : rev.eventType === "training"
                              ? "Тренировка"
                              : "Клуб"}
                      </Badge>
                    </div>

                    {/* Event Title */}
                    {rev.eventTitle && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                        <span>🏷️</span>
                        <span>{rev.eventTitle}</span>
                      </div>
                    )}

                    {/* Review text */}
                    <div className="relative">
                      <Quote className="pointer-events-none absolute -top-2 -left-1 size-6 text-blue-500/20" />
                      <p className="pl-3 text-xs leading-relaxed text-zinc-300 italic sm:text-sm">
                        &ldquo;
                        {rev.highlightQuote || rev.reviewText}
                        &rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Author / Parent Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs">
                    <div>
                      <div className="font-bold text-white transition-colors group-hover:text-blue-300">
                        {rev.respondentName}
                      </div>
                      {rev.childName && (
                        <div className="text-[11px] text-zinc-500">
                          Родител на {rev.childName}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-zinc-500">
                      {new Date(rev.createdAt).toLocaleDateString("bg-BG", {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
