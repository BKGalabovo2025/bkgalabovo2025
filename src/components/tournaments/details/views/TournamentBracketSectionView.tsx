"use client";

import { Trophy } from "lucide-react";
import React from "react";

import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTournamentDetailsContext } from "../TournamentDetailsContext";

export function TournamentBracketSectionView() {
  const {
    tournament,
    entries,
    matches,
    isGenerating,
    getCategoryName,
    getEntryNameById,
    handleGenerateMatches,
  } = useTournamentDetailsContext();

  if (!tournament) return null;

  return (
    <BentoCard className="p-3.5 sm:p-4.5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-medium text-zinc-900 sm:text-lg dark:text-white">
            Визуална Схема
          </h3>
          <p className="mt-0.5 text-xs font-light text-zinc-400 sm:text-sm">
            Прогрес на турнира по кръгове
          </p>
        </div>
        {entries.length >= 2 && (
          <Button
            onClick={handleGenerateMatches}
            disabled={isGenerating}
            className={cn(
              "h-9 rounded-xl px-4 text-xs font-semibold shadow-none transition-all",
              matches.length > 0
                ? "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            <Trophy className="mr-1.5 size-3.5" />
            {matches.length > 0
              ? "Прегенерирай схемата"
              : "Генерирай турнирната схема"}
          </Button>
        )}
      </div>

      {tournament.categories.map((cat) => (
        <div key={cat} className="mb-6">
          <div className="mb-3 flex items-center rounded-lg border border-zinc-200 bg-muted px-3 py-2 dark:border-zinc-800">
            <h3 className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
              {getCategoryName(cat)}
            </h3>
          </div>
          <TournamentBracket
            matches={matches}
            getEntryName={getEntryNameById}
            category={cat}
            onGenerateMatches={handleGenerateMatches}
            isGenerating={isGenerating}
            canGenerate={
              entries.filter((e) => e.categoryId === cat).length >= 2
            }
          />
        </div>
      ))}
    </BentoCard>
  );
}
