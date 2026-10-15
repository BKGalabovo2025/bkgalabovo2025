"use client";

import { AlertCircle, Plus, Trophy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getMatchFormat,
  isValidGameScore,
  Match,
  MatchFormatPreset,
} from "@/types/tournament.types";

import { GameScoreRow } from "./game-score-row";

interface GameScore {
  p1: number;
  p2: number;
}

interface ScoreDialogProps {
  isOpen: boolean;
  match: Match | null;
  matchFormatId?: string;
  getEntryName: (id?: string | null) => string;
  onClose: () => void;
  onSave: (
    matchId: string,
    score: string,
    winnerEntryId: string
  ) => Promise<void>;
}

function parseScoreString(score: string): GameScore[] {
  if (!score) return [{ p1: 0, p2: 0 }];
  return score.split(",").map((s) => {
    const parts = s.trim().split("-");
    return { p1: parseInt(parts[0]) || 0, p2: parseInt(parts[1]) || 0 };
  });
}

function buildScoreString(games: GameScore[]): string {
  return games.map((g) => `${g.p1}-${g.p2}`).join(", ");
}

function countWins(
  games: GameScore[],
  fmt: MatchFormatPreset
): { p1: number; p2: number } {
  return games.reduce(
    (acc, g) => {
      const v = isValidGameScore(g.p1, g.p2, fmt);
      if (v.valid) {
        if (g.p1 > g.p2) acc.p1++;
        else if (g.p2 > g.p1) acc.p2++;
      }
      return acc;
    },
    { p1: 0, p2: 0 }
  );
}

function getPlayerHighlightClass(playerWins: number, opponentWins: number) {
  if (playerWins > opponentWins) {
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
  return "bg-muted text-muted-foreground";
}

export function ScoreDialog({
  isOpen,
  match,
  matchFormatId,
  getEntryName,
  onClose,
  onSave,
}: ScoreDialogProps) {
  const [games, setGames] = useState<GameScore[]>(() => {
    if (match?.score && isOpen) {
      return parseScoreString(match.score);
    }
    return [{ p1: 0, p2: 0 }];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmt: MatchFormatPreset = getMatchFormat(matchFormatId);
  const maxGames = fmt.gamesNeededToWin * 2 - 1;

  if (!match) return null;

  const player1Name = getEntryName(match.player1EntryId);
  const player2Name = getEntryName(match.player2EntryId);
  const wins = countWins(games, fmt);

  const gameValidations = games.map((g) => {
    if (g.p1 === 0 && g.p2 === 0) return null;
    return isValidGameScore(g.p1, g.p2, fmt);
  });

  const allGamesValid = gameValidations.every((v) => v === null || v.valid);

  const matchOver =
    wins.p1 >= fmt.gamesNeededToWin || wins.p2 >= fmt.gamesNeededToWin;

  let autoWinnerId = null;
  if (wins.p1 >= fmt.gamesNeededToWin) {
    autoWinnerId = match.player1EntryId;
  } else if (wins.p2 >= fmt.gamesNeededToWin) {
    autoWinnerId = match.player2EntryId;
  }

  const canSave = allGamesValid && !!autoWinnerId;

  const updateScore = (gameIdx: number, player: "p1" | "p2", delta: number) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== gameIdx) return g;
        const val = Math.max(0, g[player] + delta);
        return { ...g, [player]: val };
      })
    );
  };

  const setScore = (gameIdx: number, player: "p1" | "p2", value: number) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== gameIdx) return g;
        const val = Math.max(0, isNaN(value) ? 0 : value);
        return { ...g, [player]: val };
      })
    );
  };

  const addGame = () => {
    if (games.length < maxGames) {
      setGames((prev) => [...prev, { p1: 0, p2: 0 }]);
    }
  };

  const removeGame = (idx: number) =>
    setGames((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!canSave || !autoWinnerId) return;
    setIsSubmitting(true);
    try {
      const scoreString = buildScoreString(
        games.filter((g) => !(g.p1 === 0 && g.p2 === 0))
      );
      await onSave(
        match.id!,
        scoreString || buildScoreString(games),
        autoWinnerId
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewBoxContent = () => {
    if (!allGamesValid) {
      return (
        <span className="flex items-center justify-center gap-2">
          <AlertCircle className="size-4" />
          Невалиден резултат за формат &quot;{fmt.label}&quot;
        </span>
      );
    }
    if (autoWinnerId) {
      return (
        <span className="flex items-center justify-center gap-2">
          <Trophy className="size-4" />
          Победител: {getEntryName(autoWinnerId)}
        </span>
      );
    }
    if (wins.p1 === wins.p2 && games.length < maxGames) {
      return `Равен резултат – добавете ${fmt.gamesNeededToWin > 1 ? "решителен гейм" : "още точки"}`;
    }
    return "Въведете резултатите";
  };

  const getPreviewBoxClass = () => {
    if (!allGamesValid) {
      return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800";
    }
    if (autoWinnerId) {
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    }
    return "bg-muted text-muted-foreground border-transparent";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-lg flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Trophy className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                Въвеждане на резултат
              </DialogTitle>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Формат: {fmt.label}
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 min-h-0">
          {/* Заглавна лента с имената */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
            <div
              className={`truncate rounded-lg px-3 py-2 transition-colors ${getPlayerHighlightClass(wins.p1, wins.p2)}`}
            >
              {player1Name}
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="text-xs font-normal text-muted-foreground">
                VS
              </span>
              {matchOver && (
                <span className="text-[10px] font-bold text-green-600">
                  {wins.p1}–{wins.p2}
                </span>
              )}
            </div>
            <div
              className={`truncate rounded-lg px-3 py-2 transition-colors ${getPlayerHighlightClass(wins.p2, wins.p1)}`}
            >
              {player2Name}
            </div>
          </div>

          {/* Резултати по геймове */}
          <div className="space-y-3">
            {games.map((game, idx) => (
              <GameScoreRow
                key={idx}
                idx={idx}
                game={game}
                validation={gameValidations[idx] ?? null}
                totalGames={games.length}
                onUpdateScore={updateScore}
                onSetScore={setScore}
                onRemoveGame={removeGame}
              />
            ))}
          </div>

          {/* Добави гейм */}
          {!matchOver && games.length < maxGames && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addGame}
              type="button"
            >
              <Plus className="mr-2 size-4" /> Добави гейм
            </Button>
          )}

          {/* Победител preview */}
          <div
            className={`rounded-lg border p-3 text-center text-sm font-semibold transition-all ${getPreviewBoxClass()}`}
          >
            {getPreviewBoxContent()}
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl px-5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !canSave}
            className="h-10 rounded-xl bg-zinc-900 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Запази резултат
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
