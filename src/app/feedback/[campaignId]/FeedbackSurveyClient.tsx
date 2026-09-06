/* eslint-disable sonarjs/no-nested-conditional, sonarjs/cognitive-complexity */
"use client";

import {
  Check,
  CheckCircle2,
  Heart,
  Loader2,
  MessageSquareHeart,
  Send,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackCampaign, RespondentRole } from "@/types/feedback.types";

interface Props {
  campaignId: string;
}

type SurveyAnswerValue = string | number | boolean;

const RATING_DEFINITIONS: Record<
  number,
  { label: string; short: string; color: string }
> = {
  1: {
    label: "1★ - Незадоволително / Слабо",
    short: "Слабо",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
  2: {
    label: "2★ - Приемливо / Има забележки",
    short: "Приемливо",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  3: {
    label: "3★ - Добро / Средно ниво",
    short: "Добро",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  4: {
    label: "4★ - Много добро / Доволен/на съм",
    short: "Много добро",
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  5: {
    label: "5★ - Отлично / Изключително доволен/на! 🌟",
    short: "Отлично 🌟",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};

function getSection3Title(eventType: string, isRecovery: boolean) {
  if (isRecovery || eventType === "recovery") {
    return "3. Оценка на процедурата и възстановяването";
  }
  switch (eventType) {
    case "camp":
      return "3. Оценка на лагера";
    case "competition":
      return "3. Оценка на турнира";
    case "training":
      return "3. Оценка на тренировките";
    default:
      return "3. Оценка на дейността и условията";
  }
}

export default function FeedbackSurveyClient({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<FeedbackCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [role, setRole] = useState<RespondentRole>("parent");
  const [respondentName, setRespondentName] = useState("");
  const [childName, setChildName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({});

  const isRecovery =
    campaign?.siteId === "recoveryzone" || campaign?.eventType === "recovery";

  useEffect(() => {
    const loadCampaign = async () => {
      setIsLoading(true);
      try {
        const data = await feedbackService.getCampaignById(campaignId);
        setCampaign(data);

        // Pre-set role based on siteId
        if (data?.siteId === "recoveryzone" || data?.eventType === "recovery") {
          setRole("client");
        }

        // Pre-fill default answers for boolean/rating if needed
        if (data?.questions) {
          const initialAns: Record<string, string | number | boolean> = {};
          data.questions.forEach((q) => {
            if (q.type === "rating") initialAns[q.id] = 5;
            if (q.type === "boolean") initialAns[q.id] = true;
          });
          setAnswers(initialAns);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const handleAnswerChange = (
    questionId: string,
    value: string | number | boolean
  ) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!respondentName.trim()) {
      toast.error("Моля, въведете вашите три имена");
      return;
    }

    if (role === "parent" && !isRecovery && !childName.trim()) {
      toast.error("Моля, въведете името на Вашето дете");
      return;
    }

    if (overallRating < 1) {
      toast.error("Моля, изберете обща оценка със звезди");
      return;
    }

    // Check required questions
    if (campaign?.questions) {
      for (const q of campaign.questions) {
        if (
          q.required &&
          (answers[q.id] === undefined ||
            answers[q.id] === "" ||
            answers[q.id] === null)
        ) {
          toast.error(`Моля, отговорете на въпроса: "${q.label}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      await feedbackService.submitFeedback(campaignId, {
        siteId: campaign?.siteId || "bkgalabovo",
        eventType: campaign?.eventType || "camp",
        respondentRole: role,
        respondentName: respondentName.trim(),
        childName:
          !isRecovery && childName.trim() ? childName.trim() : undefined,
        respondentPhone: phone.trim() || undefined,
        respondentEmail: email.trim() || undefined,
        overallRating,
        reviewText: reviewText.trim(),
        answers,
      });

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast.error("Възникна грешка при изпращането на анкетата.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const brand = {
    logo: isRecovery
      ? "/recovery-zone/rz-icon-square.png"
      : "/icons/badge-option-3-light-squircle.png",
    title: isRecovery ? "RECOVERY ZONE by ZM" : "Бадминтон клуб Гълъбово",
    url: isRecovery ? "/recovery-zone" : "/club",
    reviewsUrl: isRecovery ? "/recovery-zone/reviews" : "/club/reviews",
    themeText: isRecovery
      ? "text-emerald-700 group-hover:text-emerald-600"
      : "text-indigo-700 group-hover:text-blue-600",
    themeBorder: isRecovery
      ? "border-emerald-500/40 shadow-emerald-100 group-hover:border-emerald-500 group-hover:shadow-emerald-200"
      : "border-blue-400/40 shadow-indigo-100 group-hover:border-blue-500 group-hover:shadow-indigo-200",
    accentBg: isRecovery
      ? "from-emerald-50/40 via-zinc-50/60 to-white"
      : "from-indigo-50/40 via-zinc-50/60 to-white",
    cardGradient: isRecovery
      ? "from-emerald-50/50 via-white to-amber-50/30 border-emerald-100"
      : "from-indigo-50/50 via-white to-amber-50/30 border-indigo-100",
    sectionHeaderColor: isRecovery ? "text-emerald-950" : "text-indigo-900",
    sectionIconColor: isRecovery ? "text-emerald-600" : "text-indigo-600",
    buttonColor: isRecovery
      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  };

  const availableRoles: Array<{ id: RespondentRole; label: string }> =
    isRecovery
      ? [
          { id: "client", label: "💆 Клиент на Зоната" },
          { id: "athlete", label: "🏃 Спортист" },
          { id: "guest", label: "🌟 Гост / Посетител" },
        ]
      : [
          { id: "parent", label: "👨‍👩‍👧 Родител" },
          { id: "athlete", label: "🏸 Състезател" },
          { id: "guest", label: "🌟 Гост / Приятел" },
        ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <Loader2
          className={`size-8 animate-spin ${
            isRecovery ? "text-emerald-600" : "text-indigo-600"
          }`}
        />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <MessageSquareHeart className="mx-auto mb-3 size-12 text-zinc-300" />
          <h2 className="text-xl font-bold text-zinc-900">
            Анкетата не е намерена
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Възможно е линкът да е невалиден или анкетата да е била премахната.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-zinc-900 text-xs">
            <Link href={brand.url}>Към сайта</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (campaign.status === "closed" && !isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">
            Тази анкета вече е приключила
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            {isRecovery
              ? "Благодарим на всички клиенти, които споделиха своето мнение!"
              : "Благодарим на всички родители и състезатели, които споделиха своето мнение!"}
          </p>
          <Button
            asChild
            className={`mt-6 rounded-xl ${brand.buttonColor} text-xs text-white`}
          >
            <Link href={brand.url}>Към сайта</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-b ${brand.accentBg} p-4 text-center`}
      >
        <div
          className={`max-w-lg rounded-3xl border ${
            isRecovery
              ? "border-emerald-100 shadow-emerald-100/30"
              : "border-indigo-100 shadow-indigo-100/30"
          } bg-white p-8 shadow-xl sm:p-10`}
        >
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
            <Check className="size-8 stroke-3" />
          </div>

          <Badge className="mb-3 border-emerald-200 bg-emerald-100 font-bold text-emerald-800">
            Успешно изпратен отзив
          </Badge>

          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Благодарим Ви за обратната връзка!
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {isRecovery ? (
              <>
                Вашето мнение и обратна връзка са изключително ценни за екипа на{" "}
                <strong>Recovery Zone by ZM</strong>. Те ни помагат непрекъснато
                да поддържаме най-висок стандарт на възстановяване и релаксация.
              </>
            ) : (
              <>
                Вашето мнение и препоръки са изключително ценни за екипа на{" "}
                <strong>Бадминтон клуб Гълъбово</strong>. Те ни помагат
                непрекъснато да се развиваме и да създаваме най-добрите условия
                за нашите деца.
              </>
            )}
          </p>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className={`rounded-2xl ${brand.buttonColor} text-xs font-bold text-white shadow-md sm:text-sm`}
            >
              <Link href={brand.url}>
                {isRecovery ? "Към сайта на Recovery Zone" : "Към клубния сайт"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-zinc-200 text-xs sm:text-sm"
            >
              <Link href={brand.reviewsUrl}>
                {isRecovery
                  ? "Вижте отзивите за Зоната"
                  : "Вижте отзивите на клуба"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeRatingDisplay = hoverRating || overallRating;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${brand.accentBg} px-4 py-10 sm:px-6`}
    >
      <div className="mx-auto max-w-2xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link
            href={brand.url}
            className="group inline-flex flex-col items-center gap-2 transition-all"
            title={`Към сайта на ${brand.title}`}
          >
            <div
              className={`mx-auto flex size-14 items-center justify-center rounded-2xl border p-2 shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg ${
                isRecovery
                  ? "border-emerald-500/40 bg-zinc-950 shadow-emerald-950/20"
                  : "border-blue-400/30 bg-white shadow-indigo-100"
              }`}
            >
              <Image
                src={brand.logo}
                alt={brand.title}
                width={40}
                height={40}
                className="size-full object-contain"
                priority
              />
            </div>

            <span
              className={`text-xs font-black tracking-widest uppercase transition-colors ${brand.themeText}`}
            >
              {brand.title}
            </span>
          </Link>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            {campaign.title}
          </h1>

          {campaign.description && (
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-zinc-600 sm:text-sm">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Survey Form Card */}
        <Card className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xl shadow-zinc-200/40 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Respondent Info */}
            <div className="space-y-4">
              <h3
                className={`flex items-center gap-2 border-b border-zinc-100 pb-2 text-xs font-black tracking-wider ${brand.sectionHeaderColor} uppercase`}
              >
                <Users className={`size-4 ${brand.sectionIconColor}`} />
                1. Информация за Вас
              </h3>

              {/* Role selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">
                  Вие попълвате анкетата като:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableRoles.map((r) => {
                    const isActive = role === r.id;
                    const activeCls = isRecovery
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs"
                      : "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs";
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                          isActive
                            ? activeCls
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-700">
                    {role === "parent"
                      ? "Вашето име (Родител) *"
                      : role === "client"
                        ? "Вашето име (Клиент) *"
                        : "Вашето име *"}
                  </Label>
                  <Input
                    id="respondentName"
                    name="respondentName"
                    autoComplete="name"
                    required
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Име и фамилия..."
                    className="rounded-xl border-zinc-200 text-xs sm:text-sm"
                  />
                </div>

                {role === "parent" && !isRecovery && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="childName"
                      className="text-xs font-bold text-zinc-700"
                    >
                      Име на детето (Състезател) *
                    </Label>
                    <Input
                      id="childName"
                      name="childName"
                      required
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Име на детето..."
                      className="rounded-xl border-zinc-200 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Optional Contacts */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="surveyPhone"
                    className="text-xs font-semibold text-zinc-500"
                  >
                    Телефон за връзка (по избор)
                  </Label>
                  <Input
                    id="surveyPhone"
                    name="surveyPhone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="088..."
                    className="rounded-xl border-zinc-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="surveyEmail"
                    className="text-xs font-semibold text-zinc-500"
                  >
                    Имейл (по избор)
                  </Label>
                  <Input
                    id="surveyEmail"
                    name="surveyEmail"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="rounded-xl border-zinc-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Overall Rating */}
            <div className="space-y-4">
              <h3
                className={`flex items-center gap-2 border-b border-zinc-100 pb-2 text-xs font-black tracking-wider ${brand.sectionHeaderColor} uppercase`}
              >
                <Sparkles className={`size-4 ${brand.sectionIconColor}`} />
                {isRecovery
                  ? "2. Цялостна оценка за Recovery Zone"
                  : "2. Цялостна оценка за клуба"}
              </h3>

              <div
                className={`space-y-4 rounded-2xl border bg-gradient-to-br p-6 text-center shadow-xs ${brand.cardGradient}`}
              >
                <span className="text-xs font-bold text-zinc-700">
                  Как оценявате цялостното си впечатление и преживяване? *
                </span>

                {/* Stars Interactive with mini labels */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className="flex flex-col items-center gap-1"
                      >
                        <button
                          type="button"
                          onClick={() => setOverallRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-hidden"
                          title={RATING_DEFINITIONS[star]?.label}
                        >
                          <Star
                            className={`size-8 transition-colors sm:size-10 ${
                              star <= activeRatingDisplay
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                : "text-zinc-200"
                            }`}
                          />
                        </button>
                        <span className="text-[10px] font-extrabold text-zinc-400">
                          {star}★
                        </span>
                      </div>
                    ))}
                  </div>

                  {activeRatingDisplay > 0 && (
                    <div className="duration-200 animate-in fade-in">
                      <span
                        className={`inline-block rounded-full border px-4 py-1.5 text-xs font-black tracking-wide shadow-2xs ${RATING_DEFINITIONS[activeRatingDisplay]?.color}`}
                      >
                        {RATING_DEFINITIONS[activeRatingDisplay]?.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Questions Breakdown */}
            {campaign.questions && campaign.questions.length > 0 && (
              <div className="space-y-5">
                <h3
                  className={`flex items-center gap-2 border-b border-zinc-100 pb-2 text-xs font-black tracking-wider ${brand.sectionHeaderColor} uppercase`}
                >
                  <Star className={`size-4 ${brand.sectionIconColor}`} />
                  {getSection3Title(campaign.eventType, isRecovery)}
                </h3>

                <div className="space-y-6">
                  {campaign.questions.map((q, idx) => {
                    const currentVal = answers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:border-zinc-200 hover:bg-zinc-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Label className="text-xs leading-relaxed font-bold text-zinc-900 sm:text-sm">
                            <span
                              className={`mr-1.5 font-black ${
                                isRecovery
                                  ? "text-emerald-700"
                                  : "text-indigo-600"
                              }`}
                            >
                              {idx + 1}.
                            </span>
                            {q.label}
                            {q.required && (
                              <span className="ml-1 text-rose-500">*</span>
                            )}
                          </Label>
                        </div>

                        {q.description && (
                          <p className="text-[11px] text-zinc-500">
                            {q.description}
                          </p>
                        )}

                        {/* Rating Type (1-5 Stars) */}
                        {q.type === "rating" && (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      handleAnswerChange(q.id, star)
                                    }
                                    className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                                  >
                                    <Star
                                      className={`size-6 transition-colors ${
                                        star <= Number(currentVal || 0)
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-zinc-200"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>

                              {currentVal && (
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black transition-all ${
                                    RATING_DEFINITIONS[Number(currentVal)]
                                      ?.color || ""
                                  }`}
                                >
                                  {
                                    RATING_DEFINITIONS[Number(currentVal)]
                                      ?.label
                                  }
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span>1★ = Слабо</span>
                              <span>•</span>
                              <span>3★ = Добро</span>
                              <span>•</span>
                              <span>5★ = Отлично</span>
                            </div>
                          </div>
                        )}

                        {/* Boolean Type */}
                        {q.type === "boolean" && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(q.id, true)}
                              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                                currentVal === true
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-2xs"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              ✓ Да
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(q.id, false)}
                              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                                currentVal === false
                                  ? "border-rose-300 bg-rose-100 text-rose-800 shadow-2xs"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              ✕ Не
                            </button>
                          </div>
                        )}

                        {/* Select Type */}
                        {q.type === "select" && q.options && (
                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, opt)}
                                className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                                  currentVal === opt
                                    ? isRecovery
                                      ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-900 shadow-2xs"
                                      : "border-indigo-500 bg-indigo-50 font-bold text-indigo-900 shadow-2xs"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                                }`}
                              >
                                <span>{opt}</span>
                                {currentVal === opt && (
                                  <span
                                    className={`size-2 rounded-full ${
                                      isRecovery
                                        ? "bg-emerald-600"
                                        : "bg-indigo-600"
                                    }`}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Text Type */}
                        {q.type === "text" && (
                          <Textarea
                            id={`question_${q.id}`}
                            name={`question_${q.id}`}
                            value={String(currentVal || "")}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                            placeholder="Вашият отговор тук..."
                            rows={2}
                            className="rounded-xl border-zinc-200 bg-white text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 4: Main Free Text Review */}
            <div className="space-y-2">
              <Label
                htmlFor="reviewText"
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-900"
              >
                <Heart className="size-4 text-rose-500" />
                Вашият коментар, впечатления или препоръки:
              </Label>
              <Textarea
                id="reviewText"
                name="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={
                  isRecovery
                    ? "Споделете усещането за отмора, вашите впечатления от сесията или препоръки към екипа на Recovery Zone..."
                    : "Споделете свободен коментар или лични впечатления, които бихте искали да споделите с клуба..."
                }
                rows={4}
                className="rounded-2xl border-zinc-200 p-3 text-xs leading-relaxed sm:text-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="border-t border-zinc-100 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`h-12 w-full rounded-2xl ${brand.buttonColor} text-sm font-black text-white shadow-lg transition-transform active:scale-98`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Изпращане на отзива...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Изпрати отзива
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-[11px] text-zinc-400">
                {isRecovery
                  ? "Благодарим Ви, че се грижите за Вашето възстановяване с нас! ⚡"
                  : "Благодарим Ви, че ни помагате да бъдем все по-добри! 🏸"}
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
