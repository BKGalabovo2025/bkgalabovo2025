/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";

const QUESTION_LABELS_FALLBACK: Record<string, string> = {
  q_recovery_zone: "Третирана зона",
  q_pressure_comfort: "Комфорт и налягане на компресията",
  q_post_feeling: "Усещане за лекота и възстановяване",
  q_cleanliness: "Чистота и обстановка",
  q_repeat_visit: "Бихте ли посетили отново?",
  q_review_comment: "Лични впечатления",
  q_service_attitude: "Отношение на екипа",
  q_tech_impression: "Оборудване Hyperice Normatec 3",
  q_recommend_choice: "Препоръка към приятели",
  q_general_notes: "Коментар",
};

interface ReviewCardProps {
  rev: FeedbackSubmission;
  index: number;
}

function RecoveryReviewCardItem({ rev, index }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const initial = rev.respondentName?.trim()?.charAt(0)?.toUpperCase() || "К";
  const formattedDate = new Date(rev.createdAt).toLocaleDateString("bg-BG", {
    month: "long",
    year: "numeric",
  });

  const ratingItems: Array<{ label: string; rating: number }> = [];
  const textItems: Array<{ label: string; answer: string }> = [];

  if (rev.questionBreakdown && rev.questionBreakdown.length > 0) {
    rev.questionBreakdown.forEach((q) => {
      if (q.type === "rating" && typeof q.answer === "number") {
        ratingItems.push({ label: q.label, rating: q.answer });
      } else if (
        (q.type === "text" || q.type === "select" || q.type === "boolean") &&
        typeof q.answer !== "undefined" &&
        q.answer !== null &&
        String(q.answer).trim()
      ) {
        textItems.push({ label: q.label, answer: String(q.answer).trim() });
      }
    });
  } else if (rev.answers) {
    Object.entries(rev.answers).forEach(([k, v]) => {
      const label = QUESTION_LABELS_FALLBACK[k] || k;
      if (typeof v === "number") {
        ratingItems.push({ label, rating: v });
      } else if (
        typeof v !== "undefined" &&
        v !== null &&
        String(v).trim() &&
        !["true", "false"].includes(String(v))
      ) {
        textItems.push({ label, answer: String(v).trim() });
      }
    });
  }

  const mainComment = (rev.highlightQuote || rev.reviewText || "").trim();
  if (mainComment && !textItems.some((t) => t.answer === mainComment)) {
    textItems.unshift({
      label: "Личен коментар и впечатления",
      answer: mainComment,
    });
  }

  const cleanName =
    rev.respondentName?.charAt(0).toUpperCase() + rev.respondentName?.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/95 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] sm:p-7">
        <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= (rev.overallRating || 5)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-800 text-zinc-700"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white">
                {(rev.overallRating || 5).toFixed(1)}
              </span>
            </div>

            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            >
              {rev.eventType === "recovery" ? (
                <span className="flex items-center gap-1">
                  <Zap size={12} />
                  Normatec 3
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Heart size={12} />
                  Отзив
                </span>
              )}
            </Badge>
          </div>

          {rev.highlightQuote ? (
            <p className="border-l-2 border-emerald-500/60 pl-3 text-sm leading-relaxed font-medium text-zinc-200 italic sm:text-base">
              &ldquo;{rev.highlightQuote}&rdquo;
            </p>
          ) : textItems.length > 0 ? (
            <p className="border-l-2 border-emerald-500/40 pl-3 text-sm leading-relaxed text-zinc-300">
              &ldquo;{textItems[0].answer}&rdquo;
            </p>
          ) : null}

          {ratingItems.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-zinc-800/60 bg-zinc-950/50 p-3.5">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Детайлна оценка
              </span>
              <div className="grid gap-2">
                {ratingItems.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="line-clamp-1 text-zinc-300">
                      {item.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-1 text-amber-400">
                      <span>{item.rating}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isExpanded && textItems.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2 pt-2 text-xs text-zinc-300"
            >
              {textItems.slice(1).map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2.5"
                >
                  <span className="font-semibold text-emerald-400">
                    {t.label}:
                  </span>
                  <p className="mt-1 text-zinc-300">{t.answer}</p>
                </div>
              ))}
            </motion.div>
          )}

          {textItems.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {isExpanded ? (
                <>
                  По-малко детайли <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Виж всички отговори ({textItems.length}){" "}
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/60 pt-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-400">
              {initial}
            </div>
            <div>
              <p className="font-medium text-white">{cleanName}</p>
              <span className="text-[11px] text-zinc-400">
                Клиент на Recovery Zone
              </span>
            </div>
          </div>
          <span className="text-[11px] text-zinc-400">{formattedDate}</span>
        </div>
      </Card>
    </motion.div>
  );
}

export default function RecoveryReviewsClient() {
  const [reviews, setReviews] = useState<FeedbackSubmission[]>([]);
  const [standingCampaigns, setStandingCampaigns] = useState<
    FeedbackCampaign[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [reviewsData, activeCampaigns] = await Promise.all([
          feedbackService.getPublicReviews("recoveryzone"),
          feedbackService.getActiveStandingCampaigns("recoveryzone"),
        ]);
        setReviews(reviewsData);
        setStandingCampaigns(activeCampaigns);
      } catch (e) {
        console.error("Failed to fetch recovery zone reviews:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredReviews = useMemo(() => {
    if (selectedCategory === "all") return reviews;
    if (selectedCategory === "general") {
      return reviews.filter((r) => r.eventType === "general" || !r.eventType);
    }
    return reviews.filter((r) => r.eventType === selectedCategory);
  }, [reviews, selectedCategory]);

  const stats = useMemo(() => {
    if (reviews.length === 0)
      return { avg: 5.0, total: 0, recommendPercent: 100 };
    const total = reviews.length;
    const avg =
      reviews.reduce((acc, r) => acc + (r.overallRating || 5), 0) / total;
    const recommendCount = reviews.filter(
      (r) => (r.overallRating || 5) >= 4
    ).length;
    const recommendPercent = Math.round((recommendCount / total) * 100);
    return { avg, total, recommendPercent };
  }, [reviews]);

  const primarySurveyLink =
    standingCampaigns.length > 0
      ? `/feedback/${standingCampaigns[0].id}`
      : null;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/recovery-zone"
              className="group flex items-center gap-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-emerald-400"
            >
              <ArrowLeft
                size={16}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span>Към Recovery Zone</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative size-8 overflow-hidden rounded-lg border border-emerald-500/50 bg-white/5 p-1 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              <Image
                src="/1.png"
                alt="Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold tracking-wider text-white">
              RECOVERY ZONE <span className="text-emerald-400">by ZM</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {primarySurveyLink && (
              <Link href={primarySurveyLink}>
                <Button className="h-9 rounded-xl border border-emerald-500/40 bg-emerald-600 px-4 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500">
                  <Sparkles size={14} className="mr-1.5" />
                  Дайте отзив
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Activity size={14} />
            <span>Hyperice Normatec 3 Възстановяване</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Отзиви от клиенти и спортисти
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Вижте какво споделят хората след компресионните процедури с
            ботушите, ръкавите и колана на Hyperice Normatec 3 в нашата зона за
            възстановяване.
          </p>

          {/* Stats Bar */}
          <div className="mt-10 grid grid-cols-3 gap-3 rounded-2xl border border-emerald-500/20 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur-md sm:gap-6 sm:p-6">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-black text-amber-400 sm:text-3xl">
                <span>{stats.avg.toFixed(1)}</span>
                <Star size={20} className="fill-amber-400" />
              </div>
              <p className="mt-1 text-xs text-zinc-400">Средна оценка</p>
            </div>

            <div className="border-x border-zinc-800">
              <div className="text-2xl font-black text-white sm:text-3xl">
                {stats.total}
              </div>
              <p className="mt-1 text-xs text-zinc-400">Одобрени отзива</p>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">
                {stats.recommendPercent}%
              </div>
              <p className="mt-1 text-xs text-zinc-400">Бихте препоръчали</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Reviews Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "Всички отзиви", count: reviews.length },
            {
              id: "recovery",
              label: "Normatec 3 Сесии",
              count: reviews.filter((r) => r.eventType === "recovery").length,
            },
            {
              id: "general",
              label: "Общи впечатления",
              count: reviews.filter(
                (r) => r.eventType === "general" || !r.eventType
              ).length,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <MessageSquare className="mx-auto size-12 text-zinc-600" />
            <h3 className="mt-4 text-lg font-bold text-white">
              Все още няма публикувани отзиви в тази категория
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Бъдете първите, които споделят своето мнение за възстановяването!
            </p>
            {primarySurveyLink && (
              <Link href={primarySurveyLink} className="mt-6 inline-block">
                <Button className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500">
                  Попълнете отзив
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((rev, index) => (
              <RecoveryReviewCardItem key={rev.id} rev={rev} index={index} />
            ))}
          </div>
        )}

        {/* Bottom CTA Banner */}
        {primarySurveyLink && (
          <div className="mt-16 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-emerald-950/40 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
            <div className="mx-auto max-w-2xl space-y-4">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                Вашето мнение е важно за нас
              </span>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Били ли сте на процедура в Recovery Zone by ZM?
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Споделете усещането за лекота след сесията с Hyperice Normatec
                3. Отнема само 1-2 минути и помага на други спортисти да изберат
                най-добрата програма за възстановяване.
              </p>
              <div className="pt-2">
                <Link href={primarySurveyLink}>
                  <Button className="h-12 rounded-2xl bg-emerald-500 px-8 text-sm font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-400">
                    <Sparkles size={16} className="mr-2" />
                    Оставете Вашия отзив тук
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/60 px-6 py-8 text-center text-xs text-zinc-400">
        <p className="text-[11px] text-zinc-400">
          Спортна зала „Енергетик“, град Гълъбово • Мобилна зона: Турнирите на
          НВ Бадминтон
        </p>
        <p className="mt-1.5 text-zinc-500">
          © {new Date().getFullYear()} Recovery Zone by ZM. Всички права
          запазени
        </p>
      </footer>
    </div>
  );
}
