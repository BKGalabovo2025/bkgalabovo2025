"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RecoveryFooter } from "@/components/recovery/RecoveryFooter";
import { RecoveryNav } from "@/components/recovery/RecoveryNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FeedbackCampaign, FeedbackSubmission } from "@/types/feedback.types";
import { Site } from "@/types/site.types";

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
      <Card className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950/95 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] sm:p-7">
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
              type="button"
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

interface RecoveryReviewsClientProps {
  initialReviews?: FeedbackSubmission[];
  initialCampaigns?: FeedbackCampaign[];
  site?: Site | null;
}

export default function RecoveryReviewsClient({
  initialReviews,
  initialCampaigns,
  site,
}: RecoveryReviewsClientProps = {}) {
  const [reviews, setReviews] = useState<FeedbackSubmission[]>(
    initialReviews ?? []
  );
  const [standingCampaigns, setStandingCampaigns] = useState<
    FeedbackCampaign[]
  >(initialCampaigns ?? []);
  const [isLoading, setIsLoading] = useState(initialReviews === undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest">("newest");

  useEffect(() => {
    if (initialReviews !== undefined) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { feedbackService } = await import("@/services/feedback-service");
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
  }, [initialReviews]);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matches = reviews.filter((r) => {
      if (selectedCategory === "general") {
        if (r.eventType !== "general" && r.eventType) return false;
      } else if (selectedCategory !== "all") {
        if (r.eventType !== selectedCategory) return false;
      }

      if (normalizedQuery) {
        const nameMatch = (r.respondentName || "")
          .toLowerCase()
          .includes(normalizedQuery);
        const quoteMatch = (r.highlightQuote || "")
          .toLowerCase()
          .includes(normalizedQuery);
        const textMatch = (r.reviewText || "")
          .toLowerCase()
          .includes(normalizedQuery);
        const breakdownMatch = (r.questionBreakdown || []).some((q) =>
          String(q.answer ?? "")
            .toLowerCase()
            .includes(normalizedQuery)
        );
        const answersMatch = r.answers
          ? Object.values(r.answers).some((v) =>
              String(v ?? "")
                .toLowerCase()
                .includes(normalizedQuery)
            )
          : false;

        if (
          !nameMatch &&
          !quoteMatch &&
          !textMatch &&
          !breakdownMatch &&
          !answersMatch
        ) {
          return false;
        }
      }

      return true;
    });

    return [...matches].sort((a, b) => {
      if (sortBy === "highest") {
        const ratingDiff = (b.overallRating || 0) - (a.overallRating || 0);
        if (ratingDiff !== 0) return ratingDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, selectedCategory, searchQuery, sortBy]);

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
      ? `/feedback/${(standingCampaigns.find((c) => c.eventType === "recovery") || standingCampaigns[0]).id}`
      : null;

  return (
    <div className="public-portal-shell min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-emerald-500 selection:text-white">
      <RecoveryNav site={site} />

      <main id="main-content" className="pt-16">
        {/* Compact Breadcrumbs */}
        <nav
          aria-label="Навигационна пътека"
          className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-6 pt-6 text-xs text-zinc-400"
        >
          <Link href="/" className="transition-colors hover:text-white">
            Портал
          </Link>
          <ChevronRight size={14} className="text-zinc-600" />
          <Link
            href="/recovery-zone"
            className="transition-colors hover:text-emerald-400"
          >
            Recovery Zone
          </Link>
          <ChevronRight size={14} className="text-zinc-600" />
          <span className="font-medium text-emerald-400">Отзиви</span>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
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
              ботушите, ръкавите и колана на Hyperice Normatec 3 в нашата зона
              за възстановяване.
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
                type="button"
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

          {/* Search & Sort Controls */}
          <div className="mx-auto mb-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търси отзив по име или коментар..."
                aria-label="Търси отзив по име или коментар"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 px-10 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Изчисти търсенето"
                  className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value === "highest" ? "highest" : "newest")
              }
              aria-label="Подреди отзивите"
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none sm:w-52"
            >
              <option value="newest">Най-нови</option>
              <option value="highest">Най-висока оценка</option>
            </select>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
              <MessageSquare className="mx-auto size-12 text-zinc-600" />
              <h2 className="mt-4 text-lg font-bold text-white">
                {searchQuery.trim()
                  ? "Няма намерени отзиви по зададеното търсене"
                  : "Все още няма публикувани отзиви в тази категория"}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {searchQuery.trim()
                  ? "Опитайте с друга ключова дума или изчистете търсенето."
                  : "Бъдете първите, които споделят своето мнение за възстановяването!"}
              </p>
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-white"
                >
                  Изчисти търсенето
                </button>
              ) : (
                primarySurveyLink && (
                  <Button
                    asChild
                    className="mt-6 rounded-xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                  >
                    <Link href={primarySurveyLink}>Попълнете отзив</Link>
                  </Button>
                )
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
            <div className="mt-16 overflow-hidden rounded-3xl border border-emerald-500/30 bg-linear-to-r from-emerald-950/40 via-zinc-900/90 to-emerald-950/40 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
              <div className="mx-auto max-w-2xl space-y-4">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Вашето мнение е важно за нас
                </span>
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Били ли сте на процедура в Recovery Zone by ZM?
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Споделете усещането за лекота след сесията с Hyperice Normatec
                  3. Отнема само 1-2 минути и помага на други спортисти да
                  изберат най-добрата програма за възстановяване.
                </p>
                <div className="pt-2">
                  <Button
                    asChild
                    className="h-12 rounded-2xl bg-emerald-500 px-8 text-sm font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-400"
                  >
                    <Link href={primarySurveyLink}>
                      <Sparkles size={16} className="mr-2" />
                      Оставете Вашия отзив тук
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <RecoveryFooter site={site} />
    </div>
  );
}
