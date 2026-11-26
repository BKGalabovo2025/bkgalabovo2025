"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Flame,
  HeartPulse,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type FundamentalStatus,
  type MemberFundamentalProfile,
  RETEST_TRAINING_THRESHOLD,
} from "@/lib/fundamental-engine";
import { cn } from "@/lib/utils";

interface FundamentalMapCardProps {
  profile: MemberFundamentalProfile;
  /** При true скрива админ бутоните за тестване (за Родителския портал) */
  readOnly?: boolean;
  /** Когато е подадено, отваря директен модал за въвеждане на теста без напускане на страницата */
  onConductTest?: (testId: string) => void;
}

const STATUS_STYLE: Record<
  FundamentalStatus,
  { dot: string; label: string; badgeClass: string }
> = {
  untested: {
    dot: "bg-zinc-300 dark:bg-zinc-600",
    label: "Няма входен тест",
    badgeClass:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300",
  },
  learn: {
    dot: "bg-rose-500",
    label: "Усвояване",
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300",
  },
  consolidate: {
    dot: "bg-amber-500",
    label: "Затвърждаване",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  },
  apply: {
    dot: "bg-emerald-500",
    label: "Усвоен / Прогресия",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
};

export function FundamentalMapCard({
  profile,
  readOnly = false,
  onConductTest,
}: FundamentalMapCardProps) {
  const masteredCount = profile.evaluations.filter(
    (e) => e.status === "apply"
  ).length;
  const testedCount = profile.evaluations.filter(
    (e) => e.status !== "untested"
  ).length;

  return (
    <Card className="rounded-3xl border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Карта на BWF фундаментите ({profile.ageGroup})
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Тествани: <strong>{testedCount}/9</strong> • Усвоени:{" "}
              <strong>{masteredCount}/9</strong>
            </p>
          </div>

          {!readOnly &&
            profile.needsBaseline &&
            profile.nextBaselineTest &&
            (onConductTest ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onConductTest(profile.nextBaselineTest!.id)}
                className="rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                Проведи входен тест: {profile.nextBaselineTest.name}
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Link
                  href={`/training/assessments?memberId=${profile.memberId}&testId=${profile.nextBaselineTest.id}`}
                >
                  <Sparkles className="mr-1.5 size-3.5" />
                  Проведи входен тест: {profile.nextBaselineTest.name}
                </Link>
              </Button>
            ))}
        </div>

        {/* Умни треньорски сигнали */}
        {profile.signals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.signals.map((sig, idx) => (
              <div
                key={`${sig.kind}-${idx}`}
                title={sig.detail}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold",
                  sig.severity === "action"
                    ? "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
                    : sig.severity === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                      : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                )}
              >
                {sig.kind === "retest_ready" && <Flame className="size-3.5" />}
                {sig.kind === "missing_baseline" && (
                  <AlertCircle className="size-3.5" />
                )}
                {sig.kind === "post_competition" && (
                  <Trophy className="size-3.5" />
                )}
                {(sig.kind === "returning_from_absence" ||
                  sig.kind === "medical_discomfort") && (
                  <HeartPulse className="size-3.5" />
                )}
                <span>{sig.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* 9-те фундамента */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {profile.evaluations.map((ev) => {
            const style = STATUS_STYLE[ev.status];
            const widthClass =
              ev.trainingsSinceLastTest >= 5
                ? "w-full"
                : ev.trainingsSinceLastTest === 4
                  ? "w-4/5"
                  : ev.trainingsSinceLastTest === 3
                    ? "w-3/5"
                    : ev.trainingsSinceLastTest === 2
                      ? "w-2/5"
                      : ev.trainingsSinceLastTest === 1
                        ? "w-1/5"
                        : "w-0";

            return (
              <div
                key={ev.fundamentalId}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      <span className={cn("size-2 rounded-full", style.dot)} />
                      {ev.chapterNumber}. {ev.shortTitle}
                    </span>
                    {ev.scorePercent !== null && (
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {ev.scorePercent}%
                      </span>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                      style.badgeClass
                    )}
                  >
                    {ev.status === "apply" && (
                      <CheckCircle2 className="mr-1 size-2.5" />
                    )}
                    {style.label}
                  </Badge>

                  {ev.latestAssessment ? (
                    <div className="space-y-0.5">
                      <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        Последно: {ev.latestAssessment.testName} (
                        {ev.latestAssessment.scoreDisplay})
                      </p>
                      {ev.isProgressionTest && ev.recommendedTest && (
                        <p className="truncate text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Следващ тест (Прогресия): {ev.recommendedTest.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    ev.recommendedTest && (
                      <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        Входен тест: {ev.recommendedTest.name}
                      </p>
                    )
                  )}
                </div>

                {/* Брояч до контролен тест (само при Усвояване/Затвърждаване) */}
                {(ev.status === "learn" || ev.status === "consolidate") && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <span>До контролен тест</span>
                      <span
                        className={
                          ev.readyForRetest
                            ? "font-bold text-orange-600 dark:text-orange-400"
                            : ""
                        }
                      >
                        {ev.trainingsSinceLastTest}/{RETEST_TRAINING_THRESHOLD}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          widthClass,
                          ev.readyForRetest ? "bg-orange-500" : "bg-indigo-500"
                        )}
                      />
                    </div>
                  </div>
                )}

                {!readOnly && ev.recommendedTest && (
                  <div className="pt-1">
                    {onConductTest ? (
                      <button
                        type="button"
                        onClick={() => onConductTest(ev.recommendedTest!.id)}
                        className="inline-flex text-left text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {ev.readyForRetest
                          ? "🔥 Проведи контролен тест →"
                          : ev.isProgressionTest
                            ? `Следваща стъпка: ${ev.recommendedTest.name} →`
                            : ev.status === "untested"
                              ? "Проведи входен тест →"
                              : "Нов тест →"}
                      </button>
                    ) : (
                      <Link
                        href={`/training/assessments?memberId=${profile.memberId}&testId=${ev.recommendedTest.id}`}
                        className="inline-flex text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {ev.readyForRetest
                          ? "🔥 Проведи контролен тест →"
                          : ev.isProgressionTest
                            ? `Следваща стъпка: ${ev.recommendedTest.name} →`
                            : ev.status === "untested"
                              ? "Проведи входен тест →"
                              : "Нов тест →"}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
