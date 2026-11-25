"use client";

import {
  BookOpen,
  ChevronRight,
  Clock,
  GraduationCap,
  Home,
  Printer,
  UserCheck,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BWF_FUNDAMENTAL_CHAPTERS,
  BwfFundamentalChapter,
} from "@/lib/bwf-fundamentals";
import {
  BWF_TEXTBOOK_EXERCISES,
  getExerciseCourtDiagram,
  getExerciseMethodology,
  inferFundamentalId,
} from "@/lib/exercises/bwf-textbook";
import { cn } from "@/lib/utils";
import type {
  CoachMethodology,
  DrillCourtDiagramData,
  Exercise,
  FundamentalId,
  ProgressionStage,
} from "@/types/planner.types";

import { CoachMethodologyDialog } from "./CoachMethodologyDialog";
import { DrillCourtDiagram } from "./DrillCourtDiagram";

const AGE_FILTERS = [
  "all",
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
  "Мъже и Жени",
] as const;

const STAGE_META: Record<
  ProgressionStage,
  { label: string; badgeClass: string; order: number }
> = {
  learn: {
    label: "Етап 1: Усвояване (Техника)",
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    order: 1,
  },
  consolidate: {
    label: "Етап 2: Затвърждаване (Игри и вариации)",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    order: 2,
  },
  apply: {
    label: "Етап 3: Приложение (Комбинации и тактика)",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    order: 3,
  },
};

interface BwfTextbookViewProps {
  /** Допълнителни упражнения от Firestore (ако вече са синхронизирани) */
  savedExercises?: Exercise[];
}

export function BwfTextbookView({ savedExercises = [] }: BwfTextbookViewProps) {
  const [selectedChapterId, setSelectedChapterId] =
    useState<FundamentalId>("split-step");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    dosageText?: string;
    methodology: CoachMethodology;
    courtDiagram?: DrillCourtDiagramData;
  } | null>(null);

  // Обединяваме официалния BWF учебник с наличните упражнения от базата без дублиране
  const allExercises = useMemo(() => {
    const byName = new Map<string, Exercise>();
    for (const seed of BWF_TEXTBOOK_EXERCISES) {
      byName.set(seed.name, {
        ...seed,
        id: `seed-${seed.name}`,
        siteId: "bkgalabovo",
        createdAt: "",
        updatedAt: "",
      });
    }
    for (const ex of savedExercises) {
      const existing = byName.get(ex.name);
      byName.set(ex.name, existing ? { ...existing, ...ex } : ex);
    }
    return Array.from(byName.values());
  }, [savedExercises]);

  const activeChapter: BwfFundamentalChapter =
    BWF_FUNDAMENTAL_CHAPTERS.find((c) => c.id === selectedChapterId) ||
    BWF_FUNDAMENTAL_CHAPTERS[0];

  const chapterExercises = useMemo(() => {
    return allExercises
      .filter((ex) => inferFundamentalId(ex) === activeChapter.id)
      .filter((ex) => {
        if (ageFilter === "all") return true;
        return (ex.ageGroups || []).includes(ageFilter);
      })
      .sort((a, b) => {
        const stageA = STAGE_META[a.progressionStage || "learn"].order;
        const stageB = STAGE_META[b.progressionStage || "learn"].order;
        return stageA - stageB;
      });
  }, [allExercises, activeChapter.id, ageFilter]);

  const groupedByStage = useMemo(() => {
    const groups: Record<ProgressionStage, Exercise[]> = {
      learn: [],
      consolidate: [],
      apply: [],
    };
    for (const ex of chapterExercises) {
      const stage: ProgressionStage =
        ex.progressionStage ||
        (ex.category === "games"
          ? "consolidate"
          : ex.category === "tactics"
            ? "apply"
            : "learn");
      groups[stage].push(ex);
    }
    return groups;
  }, [chapterExercises]);

  return (
    <div className="space-y-6">
      {/* Филтър по възраст + Печат */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Възрастова група:
          </span>
          {AGE_FILTERS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => setAgeFilter(age)}
              className={cn(
                "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                ageFilter === age
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              {age === "all" ? "Всички" : age}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="rounded-xl text-xs font-semibold print:hidden dark:border-zinc-700"
        >
          <Printer className="mr-1.5 size-3.5" />
          Печат на главата
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Лява колона: 10-те глави на BWF Учебника */}
        <aside className="space-y-1.5 lg:col-span-4 print:hidden">
          <p className="px-2 pb-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            10 Официални BWF Глави (Фундаменти)
          </p>
          {BWF_FUNDAMENTAL_CHAPTERS.map((ch) => {
            const count = allExercises.filter(
              (ex) => inferFundamentalId(ex) === ch.id
            ).length;
            const isSelected = ch.id === activeChapter.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChapterId(ch.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-2xl border p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-xs dark:border-indigo-500/80 dark:bg-indigo-950/40 dark:text-white"
                    : "border-zinc-200/80 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                      {ch.chapterNumber}
                    </span>
                    <span className="truncate text-xs font-bold">
                      {ch.title}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="rounded-lg px-1.5 py-0 text-[10px]"
                  >
                    {count}
                  </Badge>
                  <ChevronRight className="size-3.5 opacity-60" />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Дясна колона: Съдържание на избраната глава */}
        <div className="space-y-5 lg:col-span-8">
          <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
                    Глава {activeChapter.chapterNumber} • Официален BWF
                    Фундамент
                  </Badge>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                    {activeChapter.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {activeChapter.subtitle}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    setDialogState({
                      open: true,
                      title: `Глава ${activeChapter.chapterNumber}: ${activeChapter.title}`,
                      subtitle: activeChapter.subtitle,
                      methodology: activeChapter.methodology,
                      courtDiagram: activeChapter.defaultDiagram,
                    })
                  }
                  className="shrink-0 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <BookOpen className="mr-1.5 size-3.5" />
                  Пълна BWF методика
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-5">
                  <DrillCourtDiagram data={activeChapter.defaultDiagram} />
                </div>
                <div className="space-y-2.5 md:col-span-7 text-xs">
                  <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                    <p className="mb-1 font-bold text-blue-800 dark:text-blue-300">
                      Как да го обясня (U9–U11):
                    </p>
                    <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {activeChapter.methodology.explainKids}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                    <p className="mb-1 font-bold text-zinc-800 dark:text-zinc-200">
                      Безопасност и биомеханика:
                    </p>
                    <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {activeChapter.methodology.safetyBiomechanics}
                    </p>
                  </div>
                  <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <GraduationCap className="size-3.5 shrink-0 text-indigo-500" />
                    <span>{activeChapter.methodology.officialSource}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Упражнения по 3-те етапа */}
          {(["learn", "consolidate", "apply"] as ProgressionStage[]).map(
            (stage) => {
              const items = groupedByStage[stage];
              if (items.length === 0) return null;
              const meta = STAGE_META[stage];

              return (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-xl px-3 py-1 text-xs font-bold",
                        meta.badgeClass
                      )}
                    >
                      {meta.label} ({items.length})
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {items.map((ex) => (
                      <Card
                        key={ex.id}
                        className="rounded-2xl border-zinc-200/80 bg-white transition-all hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700"
                      >
                        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {ex.dosageText && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-semibold"
                                >
                                  <Clock className="mr-1 size-2.5" />
                                  {ex.dosageText}
                                </Badge>
                              )}
                              {ex.isHomeFriendly && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-300 text-[10px] text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                                >
                                  <Home className="mr-1 size-2.5" /> За вкъщи
                                </Badge>
                              )}
                              {ex.coachFeedRequired && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-300"
                                >
                                  <UserCheck className="mr-1 size-2.5" /> С
                                  треньор
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                              {ex.name}
                            </h3>
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {ex.description}
                            </p>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {(ex.ageGroups || []).map((ag) => (
                                <span
                                  key={ag}
                                  className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                >
                                  {ag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {ex.durationMinutes} мин.
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDialogState({
                                  open: true,
                                  title: ex.name,
                                  subtitle: ex.description,
                                  dosageText:
                                    ex.dosageText ||
                                    `${ex.durationMinutes} мин.`,
                                  methodology: getExerciseMethodology(ex),
                                  courtDiagram: getExerciseCourtDiagram(ex),
                                })
                              }
                              className="h-7 rounded-lg text-xs font-semibold dark:border-zinc-700"
                            >
                              <BookOpen className="mr-1.5 size-3" />
                              Методика & Схема
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {dialogState && (
        <CoachMethodologyDialog
          open={dialogState.open}
          onOpenChange={(open) =>
            setDialogState((prev) => (prev ? { ...prev, open } : null))
          }
          title={dialogState.title}
          subtitle={dialogState.subtitle}
          dosageText={dialogState.dosageText}
          methodology={dialogState.methodology}
          courtDiagram={dialogState.courtDiagram}
        />
      )}
    </div>
  );
}
