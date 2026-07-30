"use client";

import { AlertCircle, Plus, Trophy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function countWins(games: GameScore[]): { p1: number; p2: number } {
  return games.reduce(
    (acc, g) => {
      if (g.p1 > g.p2) acc.p1++;
      else if (g.p2 > g.p1) acc.p2++;
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
  const wins = countWins(games);

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
        const otherPlayer = player === "p1" ? "p2" : "p1";

        let newOtherVal = g[otherPlayer];
        if (delta > 0 && val > 0 && newOtherVal === 0) {
          if (val < fmt.pointsPerGame - 1) {
            newOtherVal = fmt.pointsPerGame;
          } else {
            newOtherVal = val + 2;
            if (fmt.maxPoints > 0 && newOtherVal > fmt.maxPoints)
              newOtherVal = fmt.maxPoints;
          }
        }

        return { ...g, [player]: val, [otherPlayer]: newOtherVal };
      })
    );
  };

  const setScore = (gameIdx: number, player: "p1" | "p2", value: number) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== gameIdx) return g;
        const val = Math.max(0, isNaN(value) ? 0 : value);
        const otherPlayer = player === "p1" ? "p2" : "p1";

        let newOtherVal = g[otherPlayer];
        if (val > 0 && newOtherVal === 0) {
          if (val < fmt.pointsPerGame - 1) {
            newOtherVal = fmt.pointsPerGame;
          } else {
            newOtherVal = val + 2;
            if (fmt.maxPoints > 0 && newOtherVal > fmt.maxPoints)
              newOtherVal = fmt.maxPoints;
          }
        }

        return { ...g, [player]: val, [otherPlayer]: newOtherVal };
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
      <DialogContent className="border-zinc-200 bg-white sm:max-w-lg dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Въвеждане на резултат</DialogTitle>
        </DialogHeader>

        {/* Формат */}
        <div className="rounded-md border bg-muted/50 px-3 py-1.5 text-center text-xs text-muted-foreground">
          📋 Формат:{" "}
          <span className="font-medium text-foreground">{fmt.label}</span>
        </div>

        <div className="space-y-5 py-2">
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отказ
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !canSave}>
            Запази резултат
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
