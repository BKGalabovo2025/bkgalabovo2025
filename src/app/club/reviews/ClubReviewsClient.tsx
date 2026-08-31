/* eslint-disable sonarjs/no-nested-conditional, sonarjs/cognitive-complexity */
"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  MessageSquare,
  PenLine,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNav } from "@/components/layout/public-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";

const QUESTION_LABELS_FALLBACK: Record<string, string> = {
  q_org: "Организация и комуникация",
  q_training: "Качество на тренировките",
  q_hotel_food: "Настаняване и храна",
  q_atmosphere: "Атмосфера и грижа",
  q_future: "Бихте ли записали детето отново на лагер?",
  q_liked: "Любим момент / Впечатления",
  q_improvements: "Препоръки за подобрение",
  q_comp_org: "Организация на състезанието",
  q_coach_guidance: "Треньорски наставления",
  q_motivation: "Мотивация на състезателя",
  q_progress: "Спортно развитие и напредък",
  q_comm: "Комуникация с треньорите",
  q_discipline: "Дисциплина и мотивация",
  q_overall_club: "Удовлетвореност от клуба",
  q_recommend: "Бихте ли препоръчали клуба?",
  q_recommend_choice: "Бихте ли препоръчали клуба на приятели?",
  q_coaching_approach: "Треньорски подход и внимание към децата",
  q_environment_discipline: "Спортна атмосфера и мотивация",
  q_communication_org: "Организация и комуникация",
  q_club_strengths: "Какво най-много цените в работата на клуба",
  q_club_improvements: "Препоръки за бъдещи подобрения",
  q_general_feedback: "Съобщение към екипа",
  q_training_feedback: "Препоръки за тренировките",
};

interface ReviewCardProps {
  rev: FeedbackSubmission;
  index: number;
}

function ReviewCardItem({ rev, index }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const initial = rev.respondentName?.trim()?.charAt(0)?.toUpperCase() || "К";
  const formattedDate = new Date(rev.createdAt).toLocaleDateString("bg-BG", {
    month: "long",
    year: "numeric",
  });

  // Extract structured answers
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

  // If there is an overall personal comment/review, add it to text answers
  const mainComment = (rev.highlightQuote || rev.reviewText || "").trim();
  if (mainComment && !textItems.some((t) => t.answer === mainComment)) {
    textItems.push({
      label: "Личен коментар и впечатления",
      answer: mainComment,
    });
  }

  // Capitalize respondent name properly
  const cleanName =
    rev.respondentName?.charAt(0).toUpperCase() + rev.respondentName?.slice(1);

  // Capitalize child name properly
  const cleanChild = rev.childName
    ? rev.childName.charAt(0).toUpperCase() + rev.childName.slice(1)
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/95 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10 sm:p-7">
        {/* Top ambient glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />

        <div className="space-y-4">
          {/* 1. Header: Stars with rating score & Event Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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
              <span className="text-xs font-black text-zinc-300">
                {rev.overallRating}.0
              </span>
            </div>

            <Badge
              variant="outline"
              className="rounded-full border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[10px] font-extrabold tracking-wider text-blue-400 uppercase"
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

          {/* 2. Event Title Pill */}
          {rev.eventTitle && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/70 px-2.5 py-1 text-[11px] font-bold text-blue-300">
              <Tag className="size-3 shrink-0 text-blue-400" />
              <span className="truncate">{rev.eventTitle}</span>
            </div>
          )}

          {/* 3. Category Stars Breakdown */}
          {ratingItems.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4">
              <div className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                Оценки по елементи:
              </div>
              <div className="divide-zinc-850 space-y-2 divide-y">
                {ratingItems.map((item, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-center justify-between gap-2 pt-1.5 first:pt-0"
                  >
                    <span className="truncate text-[11px] font-medium text-zinc-300">
                      {item.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, sIdx) => (
                          <Star
                            key={sIdx}
                            className={`size-3 ${
                              sIdx < item.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="w-6 text-right text-[10px] font-bold text-zinc-400">
                        {item.rating}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Open Questions & Answers (Expandable) */}
          {textItems.length > 0 && (
            <div className="space-y-2 pt-1">
              {isExpanded && (
                <div className="space-y-3 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
                  {textItems.map((tItem, tIdx) => (
                    <div key={tIdx} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300">
                        <MessageCircle className="size-3.5 shrink-0 text-blue-400" />
                        <span>{tItem.label}</span>
                      </div>
                      <p className="pl-5 text-xs leading-relaxed text-zinc-200 italic">
                        &ldquo;{tItem.answer}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 transition-colors hover:text-blue-300"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3.5" />
                    Скрий отговорите на въпросите
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    Виж отговори на въпросите ({textItems.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 5. Author / Parent Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-md shadow-blue-500/20">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white transition-colors group-hover:text-blue-300 sm:text-sm">
                <span>{cleanName}</span>
                <span title="Проверен отзив" className="inline-flex">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                </span>
              </div>
              <div className="text-[11px] font-medium text-zinc-400">
                {rev.respondentRole === "parent"
                  ? cleanChild
                    ? `Родител на ${cleanChild}`
                    : "Родител"
                  : rev.respondentRole === "athlete"
                    ? "Състезател"
                    : rev.respondentRole === "guest"
                      ? "Приятел / Гост"
                      : "Отзив"}
              </div>
            </div>
          </div>

          <div className="text-[11px] font-medium text-zinc-500">
            {formattedDate}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function ClubReviewsClient() {
  const [reviews, setReviews] = useState<FeedbackSubmission[]>([]);
  const [standingCampaigns, setStandingCampaigns] = useState<
    FeedbackCampaign[]
  >([]);
  const [isSurveyPickerOpen, setIsSurveyPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryCounts = useMemo(() => {
    return {
      all: reviews.length,
      camp: reviews.filter((r) => r.eventType === "camp").length,
      training: reviews.filter((r) => r.eventType === "training").length,
      competition: reviews.filter((r) => r.eventType === "competition").length,
      general: reviews.filter((r) => r.eventType === "general" || !r.eventType)
        .length,
    };
  }, [reviews]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [reviewsData, activeCampaigns] = await Promise.all([
          feedbackService.getPublicReviews("bkgalabovo"),
          feedbackService.getActiveStandingCampaigns("bkgalabovo"),
        ]);
        setReviews(reviewsData);
        setStandingCampaigns(activeCampaigns);
      } catch (e) {
        console.error(e);
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

          {/* Direct Public Review Button when any standing campaign is active */}
          {standingCampaigns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="pt-2"
            >
              {standingCampaigns.length === 1 ? (
                <Button
                  asChild
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 hover:from-blue-500 hover:to-indigo-500"
                >
                  <Link href={`/feedback/${standingCampaigns[0].id}`}>
                    <PenLine className="mr-2 size-4.5" />
                    ✍️ Споделете Вашия отзив за клуба
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() => setIsSurveyPickerOpen(true)}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 hover:from-blue-500 hover:to-indigo-500"
                >
                  <PenLine className="mr-2 size-4.5" />
                  ✍️ Споделете Вашия отзив ({standingCampaigns.length} анкети)
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Rating Metrics Showcase Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 rounded-3xl border border-blue-500/20 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="grid grid-cols-1 divide-y divide-zinc-800 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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

        {/* Categories Filter Tabs with Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "🌟 Всички отзиви", count: categoryCounts.all },
            { id: "camp", label: "🏕️ Лагери", count: categoryCounts.camp },
            {
              id: "training",
              label: "⚡ Тренировки",
              count: categoryCounts.training,
            },
            {
              id: "competition",
              label: "🏸 Състезания",
              count: categoryCounts.competition,
            },
            {
              id: "general",
              label: "💬 Общи впечатления",
              count: categoryCounts.general,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                selectedCategory === cat.id
                  ? "scale-105 bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  selectedCategory === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {cat.count}
              </span>
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
          <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.map((rev, idx) => (
              <ReviewCardItem key={rev.id} rev={rev} index={idx} />
            ))}
          </div>
        )}

        {/* Bottom invitation card */}
        {standingCampaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto max-w-3xl overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-zinc-900 via-blue-950/40 to-zinc-900 p-8 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-4">
              <h3 className="text-xl font-black text-white sm:text-2xl">
                Били ли сте част от нашите събития или тренировки?
              </h3>
              <p className="mx-auto max-w-lg text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Вашето мнение е изключително важно за развитието на децата и
                клуба. Споделете впечатленията си само за 1-2 минути!
              </p>
              <div className="pt-2">
                {standingCampaigns.length === 1 ? (
                  <Button
                    asChild
                    className="rounded-2xl bg-blue-600 px-6 py-5 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500"
                  >
                    <Link href={`/feedback/${standingCampaigns[0].id}`}>
                      <PenLine className="mr-2 size-4" />
                      ✍️ Попълнете клубната анкета
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsSurveyPickerOpen(true)}
                    className="rounded-2xl bg-blue-600 px-6 py-5 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500"
                  >
                    <PenLine className="mr-2 size-4" />
                    ✍️ Изберете анкета за попълване ({standingCampaigns.length})
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Survey Picker Dialog for Multiple Standing Surveys */}
      <Dialog open={isSurveyPickerOpen} onOpenChange={setIsSurveyPickerOpen}>
        <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950 text-white sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-white">
              <PenLine className="size-5 text-blue-400" />
              Изберете анкета за отзив
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Моля, изберете за кое направление от клубната дейност желаете да
              споделите своите впечатления и препоръки:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {standingCampaigns.map((sc) => (
              <Link
                key={sc.id}
                href={`/feedback/${sc.id}`}
                onClick={() => setIsSurveyPickerOpen(false)}
                className="group flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all hover:border-blue-500/50 hover:bg-blue-950/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-blue-500/30 bg-blue-500/10 text-[10px] font-bold text-blue-400 uppercase"
                    >
                      {sc.eventType === "camp"
                        ? "🏕️ Лагер"
                        : sc.eventType === "competition"
                          ? "🏸 Състезание"
                          : sc.eventType === "training"
                            ? "⚡ Тренировки"
                            : "🌟 Обща"}
                    </Badge>
                    <h4 className="text-sm font-black text-white transition-colors group-hover:text-blue-300">
                      {sc.title}
                    </h4>
                  </div>
                  {sc.description && (
                    <p className="line-clamp-1 text-xs text-zinc-400">
                      {sc.description}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  className="shrink-0 rounded-xl bg-blue-600 text-xs font-bold text-white group-hover:bg-blue-500"
                >
                  Попълни
                </Button>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <PublicFooter />
    </div>
  );
}
