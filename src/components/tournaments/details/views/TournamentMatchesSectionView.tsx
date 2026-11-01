"use client";

import { CheckCircle2, Trophy } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTournamentDetailsContext } from "../TournamentDetailsContext";

export function TournamentMatchesSectionView() {
  const {
    tournament,
    entries,
    matches,
    isGenerating,
    getCategoryName,
    getEntryNameById,
    handleGenerateMatches,
    setSelectedMatch,
  } = useTournamentDetailsContext();

  if (!tournament) return null;

  return (
    <BentoCard className="overflow-hidden p-0">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-zinc-100 p-3.5 sm:flex-row sm:items-center sm:p-4.5 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-medium text-zinc-900 sm:text-lg dark:text-white">
            Генератор на мачове
          </h3>
          <p className="mt-0.5 text-xs font-light text-zinc-400 sm:text-sm">
            Схема на турнира (Система Бергер)
          </p>
        </div>
        <Button
          onClick={handleGenerateMatches}
          disabled={isGenerating || entries.length < 2}
          className={cn(
            "h-9.5 rounded-xl px-4 text-[10px] sm:text-[11px] font-medium tracking-widest uppercase shadow-none transition-all",
            matches.length > 0
              ? "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
              : "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          )}
        >
          <Trophy className="mr-2 size-3.5" strokeWidth={1.5} />
          {matches.length > 0 ? "Прегенерирай схемата" : "Генерирай мачове"}
        </Button>
      </div>
      <div className="p-3.5 sm:p-4.5">
        {matches.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-4 size-12 opacity-20" />
            <p>
              Мачовете ще могат да се генерират, когато всички участници са
              записани.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {tournament.categories.map((cat) => {
              const catMatches = matches.filter((m) => m.categoryId === cat);
              if (catMatches.length === 0) return null;

              const pendingMatches = catMatches
                .filter((m) => m.status !== "completed")
                .sort((a, b) => (a.round || 0) - (b.round || 0));
              const completedMatches = catMatches
                .filter((m) => m.status === "completed")
                .sort((a, b) => (a.round || 0) - (b.round || 0));

              return (
                <div key={cat} className="space-y-6">
                  <div className="flex items-center rounded-lg border bg-muted px-4 py-3">
                    <h3 className="text-lg font-medium tracking-widest text-zinc-500 uppercase">
                      {getCategoryName(cat)}
                    </h3>
                  </div>

                  {/* Предстоящи мачове */}
                  {pendingMatches.length > 0 && (
                    <div className="ml-0 sm:ml-4">
                      <h4 className="mb-6 flex items-center text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                        <span className="mr-2 size-2 rounded-full bg-blue-400"></span>
                        Предстоящи мачове ({pendingMatches.length})
                      </h4>
                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
                          >
                            <div className="mb-3 flex items-center justify-between border-b pb-2 dark:border-zinc-800">
                              <Badge variant="outline" className="text-[10px]">
                                Кръг {match.round}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {match.stage}
                              </span>
                            </div>

                            <div className="mb-3 space-y-2">
                              <div className="flex items-center justify-between font-light text-zinc-900 dark:text-white">
                                <span className="truncate pr-2 text-sm">
                                  {getEntryNameById(match.player1EntryId)}
                                </span>
                              </div>
                              <div className="border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                                срещу
                              </div>
                              <div className="flex items-center justify-between font-light text-zinc-900 dark:text-white">
                                <span className="truncate pr-2 text-sm">
                                  {getEntryNameById(match.player2EntryId)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-auto flex items-center justify-end border-t pt-2.5 dark:border-zinc-800">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8.5 w-full rounded-xl bg-zinc-950 text-xs text-white shadow-none transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                onClick={() => setSelectedMatch(match)}
                              >
                                Въведи резултат
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Изиграни мачове */}
                  {completedMatches.length > 0 && (
                    <div className="ml-0 sm:ml-4">
                      <h4 className="mb-4 flex items-center text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                        <CheckCircle2
                          className="mr-2 size-4 text-emerald-500"
                          strokeWidth={1.5}
                        />
                        Изиграни мачове ({completedMatches.length})
                      </h4>
                      <div className="mb-4 grid grid-cols-1 gap-3 opacity-80 md:grid-cols-2 lg:grid-cols-3">
                        {completedMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
                          >
                            <div className="mb-4 flex items-center justify-between border-b border-muted-foreground/20 pb-2">
                              <Badge
                                variant="secondary"
                                className="border-emerald-100 bg-emerald-50 text-[10px] text-emerald-600 shadow-none dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400"
                              >
                                Завършен
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Кръг {match.round}
                              </span>
                            </div>

                            <div className="mb-4 space-y-3">
                              <div
                                className={`flex items-center justify-between font-light ${match.winnerEntryId === match.player1EntryId ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  {match.winnerEntryId ===
                                    match.player1EntryId && (
                                    <Trophy className="size-3 shrink-0 text-yellow-500" />
                                  )}
                                  <span className="truncate">
                                    {getEntryNameById(match.player1EntryId)}
                                  </span>
                                </div>
                              </div>
                              <div className="border-l-2 border-muted-foreground/30 pl-2 text-xs text-muted-foreground">
                                срещу
                              </div>
                              <div
                                className={`flex items-center justify-between font-light ${match.winnerEntryId === match.player2EntryId ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  {match.winnerEntryId ===
                                    match.player2EntryId && (
                                    <Trophy className="size-3 shrink-0 text-yellow-500" />
                                  )}
                                  <span className="truncate">
                                    {getEntryNameById(match.player2EntryId)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between border-t border-muted-foreground/20 pt-3">
                              <div className="font-mono text-lg font-light tracking-widest text-zinc-900 dark:text-zinc-100">
                                {match.score}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase shadow-none transition-all hover:bg-zinc-950 hover:text-white dark:border-zinc-800 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                                onClick={() => setSelectedMatch(match)}
                              >
                                Редактирай
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
