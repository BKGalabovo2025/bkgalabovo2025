"use client";

import {
  Activity,
  BookOpen,
  ClipboardCheck,
  Dumbbell,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import React from "react";

import { FundamentalMapCard } from "@/components/members/profile/FundamentalMapCard";
import { Badge } from "@/components/ui/badge";

import { useParentPortalContext } from "../ParentPortalContext";

function getPaceHeightClass(paceSec: number): string {
  if (paceSec <= 1.5) return "h-8";
  if (paceSec <= 2.0) return "h-7";
  if (paceSec <= 2.5) return "h-6";
  if (paceSec <= 3.0) return "h-5";
  return "h-4";
}

export function PortalDevelopmentTabView() {
  const { portal } = useParentPortalContext();
  const { rankingData, shadowAndQuizzes, selectedChild } = portal;

  const paceHistory = shadowAndQuizzes?.paceHistory || [];
  const firstPace = paceHistory[0]?.paceSec;
  const latestPace = paceHistory[paceHistory.length - 1]?.paceSec;
  const paceImprovement =
    firstPace && latestPace && firstPace > latestPace
      ? Number((firstPace - latestPace).toFixed(2))
      : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Section 1: Ranking & Sporting Achievements ─────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span>Класиране и спортни резултати</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Официален клубен ранг и състезателни точки за{" "}
              {selectedChild?.firstName}.
            </p>
          </div>

          {rankingData && (
            <Badge className="bg-amber-500 text-white text-xs font-bold self-start sm:self-auto">
              🏆{" "}
              {rankingData.isLicensed
                ? "Лицензиран състезател"
                : "Клубна ранглиста"}
            </Badge>
          )}
        </div>

        {rankingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 text-center dark:border-amber-900/40 dark:bg-amber-950/20 shadow-2xs">
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Текуща позиция
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                #{rankingData.rankingPosition || "-"}
              </p>
              <span className="text-[10px] text-zinc-500">в ранглистата</span>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/50 shadow-2xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Спечелени точки
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                {rankingData.rankingPoints || 0}
              </p>
              <span className="text-[10px] text-zinc-500">
                точки от турнири
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/50 shadow-2xs">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                БФ Бадминтон статус
              </p>
              <p className="text-sm font-black text-zinc-900 dark:text-white mt-2">
                {rankingData.isLicensed ? "Картотекиран" : "Няма лиценз"}
              </p>
              <span className="text-[10px] text-zinc-500">
                официален състезателен статус
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
            Няма въведени състезателни точки за състезателя в ранглистата.
          </div>
        )}
      </div>

      {/* ── Section 2: Shadow Training & Theoretical Quizzes ─────────────── */}
      {shadowAndQuizzes && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span>Интерактивна подготовка: „Сянка“ и теория</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Резултати от дигиталните тренажори по реакция, тактика и клубни
                куизове.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-blue-600" />
                  Тренажор „Сянка“ (Footwork)
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {shadowAndQuizzes.shadowSessionsCount || 0} сесии
                </Badge>
              </div>

              {/* Значка за постоянство */}
              {shadowAndQuizzes.perseveranceBadge && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 dark:border-amber-500/20 dark:bg-amber-950/30">
                  <span className="text-lg">
                    {shadowAndQuizzes.perseveranceBadge.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      {shadowAndQuizzes.perseveranceBadge.title}
                    </p>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                      {shadowAndQuizzes.totalShadowMinutes || 0} минути
                      целенасочена работа с крака
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Общо Footwork време:</span>
                  <strong className="text-zinc-900 dark:text-white">
                    {shadowAndQuizzes.totalShadowMinutes || 0} мин.
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Последна сесия:</span>
                  <strong className="text-zinc-900 dark:text-white">
                    {shadowAndQuizzes.lastShadowDate
                      ? new Date(
                          shadowAndQuizzes.lastShadowDate
                        ).toLocaleDateString("bg-BG", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Няма данни"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Средна реакция (темпо):</span>
                  <strong className="text-zinc-900 dark:text-white">
                    {shadowAndQuizzes.averageReactionSec
                      ? `${shadowAndQuizzes.averageReactionSec} сек.`
                      : "Стандартна"}
                  </strong>
                </div>
              </div>

              {/* Графика на адаптацията към темпото */}
              {paceHistory.length >= 2 && (
                <div className="border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <TrendingUp size={12} className="text-emerald-500" />
                      Адаптация към темпото
                    </span>
                    {paceImprovement !== null && paceImprovement > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        +{paceImprovement}s по-бърза реакция
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1.5 h-10 pt-1">
                    {paceHistory.map((h, idx) => (
                      <div
                        key={`pace-${idx}`}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                        title={`${h.date}: ${h.paceSec}s`}
                      >
                        <div
                          className={`w-full rounded-t bg-blue-500/80 group-hover:bg-amber-500 transition-colors ${getPaceHeightClass(h.paceSec)}`}
                        />
                        <span className="text-[8px] text-zinc-400 truncate w-full text-center">
                          {h.paceSec}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen size={14} className="text-emerald-600" />
                  Теоретични куизове и правила
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {shadowAndQuizzes.quizzesCompletedCount || 0} решени
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                {shadowAndQuizzes.recentQuizzes.length > 0 ? (
                  shadowAndQuizzes.recentQuizzes.slice(0, 6).map((quiz) => (
                    <div
                      key={quiz.id}
                      className="rounded-xl border border-zinc-200/70 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="truncate text-zinc-900 dark:text-zinc-100">
                          {quiz.title}
                        </strong>
                        <span className="shrink-0 font-black text-emerald-600 dark:text-emerald-400">
                          {quiz.totalScore} т.
                        </span>
                      </div>
                      {quiz.submittedAt && (
                        <p className="mt-0.5 text-[10px] text-zinc-400">
                          {new Date(quiz.submittedAt).toLocaleDateString(
                            "bg-BG",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                      {quiz.coachFeedback && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 italic dark:text-zinc-400">
                          „{quiz.coachFeedback}“
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Все още няма решени теоретични тестове.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Latest Beep Test Summary */}
          {shadowAndQuizzes.latestBeepTest && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    Последен Бийп Тест (Аеробна издръжливост)
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {shadowAndQuizzes.latestBeepTest.date
                      ? new Date(
                          shadowAndQuizzes.latestBeepTest.date
                        ).toLocaleDateString("bg-BG", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Последен запис"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">
                    Ниво : Совалка
                  </p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">
                    {shadowAndQuizzes.latestBeepTest.level} :{" "}
                    {shadowAndQuizzes.latestBeepTest.shuttle}
                  </p>
                </div>
                {shadowAndQuizzes.latestBeepTest.vo2Max !== undefined && (
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">
                      VO2 Max
                    </p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {shadowAndQuizzes.latestBeepTest.vo2Max}
                    </p>
                  </div>
                )}
                {shadowAndQuizzes.latestBeepTest.score && (
                  <Badge
                    variant="outline"
                    className="border-indigo-200 bg-white text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
                  >
                    {shadowAndQuizzes.latestBeepTest.score}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: BWF Fundamental Map (Read-only) ──────────────────── */}
      {shadowAndQuizzes?.fundamentalProfile && (
        <FundamentalMapCard
          profile={shadowAndQuizzes.fundamentalProfile}
          readOnly={true}
        />
      )}

      {/* ── Section 4: Published Daily Training Reports ─────────────────── */}
      {shadowAndQuizzes?.recentSessionReports &&
        shadowAndQuizzes.recentSessionReports.length > 0 && (
          <div className="space-y-4 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-zinc-900 uppercase dark:text-white">
                <ClipboardCheck size={16} className="text-indigo-500" />
                <span>Дневни отчети от тренировки</span>
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Публикувани от треньора акценти и обратна връзка след
                тренировка.
              </p>
            </div>
            <div className="space-y-3">
              {shadowAndQuizzes.recentSessionReports.map((report) => (
                <div
                  key={`${report.sessionId}-${report.date}`}
                  className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {report.title}
                      </p>
                      {report.date && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {new Date(report.date).toLocaleDateString("bg-BG", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {report.fundamentalTitle && (
                        <Badge
                          variant="outline"
                          className="border-indigo-200 bg-indigo-50 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                        >
                          {report.fundamentalTitle}
                        </Badge>
                      )}
                      {report.effort !== undefined && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          Старание: {report.effort}/5
                        </Badge>
                      )}
                      {report.rpe !== undefined && (
                        <Badge
                          variant="outline"
                          className="border-zinc-200 bg-white text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        >
                          RPE: {report.rpe}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                  {report.note && (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {report.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
