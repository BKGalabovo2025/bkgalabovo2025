"use client";

import { BookOpen, Dumbbell, Trophy, Zap } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";

import { useParentPortalContext } from "../ParentPortalContext";

export function PortalDevelopmentTabView() {
  const { portal } = useParentPortalContext();
  const { rankingData, shadowAndQuizzes, selectedChild } = portal;

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
                  Тренажор „Сянка“
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {shadowAndQuizzes.shadowSessionsCount || 0} сесии
                </Badge>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>
                  Последна сесия:{" "}
                  <strong>
                    {shadowAndQuizzes.lastShadowDate || "Няма данни"}
                  </strong>
                </p>
                <p>
                  Средна реакция:{" "}
                  <strong>
                    {shadowAndQuizzes.averageReactionSec
                      ? `${shadowAndQuizzes.averageReactionSec} сек.`
                      : "Стандартна"}
                  </strong>
                </p>
              </div>
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

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>
                  Последен тест:{" "}
                  <strong>
                    {shadowAndQuizzes.recentQuizzes[0]?.title ||
                      "Правила на бадминтона"}
                  </strong>
                </p>
                <p>
                  Постигнат резултат:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {shadowAndQuizzes.recentQuizzes[0]?.totalScore !== undefined
                      ? `${shadowAndQuizzes.recentQuizzes[0]?.totalScore} т.`
                      : "—"}
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
