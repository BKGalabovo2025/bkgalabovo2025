/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Match,
  MatchFormatPreset,
  isValidGameScore,
  getMatchFormat,
} from "@/types/tournament.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Trophy,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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

  // Use useEffect to reset games when match or isOpen changes,
  // though key={match.id} in parent handles most cases.

  if (!match) return null;

  const player1Name = getEntryName(match.player1EntryId);
  const player2Name = getEntryName(match.player2EntryId);
  const wins = countWins(games);

  // Валидираме всеки гейм
  const gameValidations = games.map((g) => {
    if (g.p1 === 0 && g.p2 === 0) return null; // Непопълнен гейм
    return isValidGameScore(g.p1, g.p2, fmt);
  });

  const allGamesValid = gameValidations.every((v) => v === null || v.valid);

  // Проверяваме дали мачът е приключил (някой е достигнал нужния брой геймове)
  const matchOver =
    wins.p1 >= fmt.gamesNeededToWin || wins.p2 >= fmt.gamesNeededToWin;

  const autoWinnerId =
    wins.p1 >= fmt.gamesNeededToWin
      ? match.player1EntryId
      : wins.p2 >= fmt.gamesNeededToWin
        ? match.player2EntryId
        : null;

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

        // Автоматично попълване: ако другият играч е на 0, предлагаме победен резултат
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Въвеждане на резултат</DialogTitle>
        </DialogHeader>

        {/* Формат */}
        <div className="text-xs text-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
          📋 Формат:{" "}
          <span className="font-medium text-foreground">{fmt.label}</span>
        </div>

        <div className="py-2 space-y-5">
          {/* Заглавна лента с имената */}
          <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-center">
            <div
              className={`px-3 py-2 rounded-lg truncate transition-colors ${
                wins.p1 > wins.p2
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : wins.p2 > wins.p1
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted"
              }`}
            >
              {player1Name}
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="text-muted-foreground text-xs font-normal">
                VS
              </span>
              {matchOver && (
                <span className="text-[10px] font-bold text-green-600">
                  {wins.p1}–{wins.p2}
                </span>
              )}
            </div>
            <div
              className={`px-3 py-2 rounded-lg truncate transition-colors ${
                wins.p2 > wins.p1
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : wins.p1 > wins.p2
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted"
              }`}
            >
              {player2Name}
            </div>
          </div>

          {/* Резултати по геймове */}
          <div className="space-y-3">
            {games.map((game, idx) => {
              const validation = gameValidations[idx];
              const hasError = validation && !validation.valid;
              const isOk = validation && validation.valid;

              return (
                <div key={idx} className="space-y-1">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    {/* Играч 1 */}
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => updateScore(idx, "p1", -1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={game.p1}
                        onChange={(e) =>
                          setScore(idx, "p1", parseInt(e.target.value))
                        }
                        className={`w-14 h-10 text-center text-xl font-bold border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
                          hasError
                            ? "border-red-400 focus:ring-red-400"
                            : isOk
                              ? "border-green-400 focus:ring-green-400"
                              : "focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => updateScore(idx, "p1", 1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Разделител */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Гейм {idx + 1}
                      </span>
                      {isOk && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                      {hasError && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      {games.length > 1 && !isOk && (
                        <button
                          type="button"
                          onClick={() => removeGame(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Играч 2 */}
                    <div className="flex items-center gap-1 justify-start">
                      <button
                        type="button"
                        onClick={() => updateScore(idx, "p2", -1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={game.p2}
                        onChange={(e) =>
                          setScore(idx, "p2", parseInt(e.target.value))
                        }
                        className={`w-14 h-10 text-center text-xl font-bold border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors ${
                          hasError
                            ? "border-red-400 focus:ring-red-400"
                            : isOk
                              ? "border-green-400 focus:ring-green-400"
                              : "focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => updateScore(idx, "p2", 1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Грешка за гейма */}
                  {hasError && (
                    <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation?.error}
                    </p>
                  )}
                </div>
              );
            })}
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
              <Plus className="w-4 h-4 mr-2" /> Добави гейм
            </Button>
          )}

          {/* Победител preview */}
          <div
            className={`p-3 rounded-lg text-center text-sm font-semibold transition-all border ${
              autoWinnerId && allGamesValid
                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                : !allGamesValid
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800"
                  : "bg-muted text-muted-foreground border-transparent"
            }`}
          >
            {!allGamesValid ? (
              <span className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Невалиден резултат за формат &quot;{fmt.label}&quot;
              </span>
            ) : autoWinnerId ? (
              <span className="flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" />
                Победител: {getEntryName(autoWinnerId)}
              </span>
            ) : wins.p1 === wins.p2 && games.length < maxGames ? (
              `Равен резултат – добавете ${fmt.gamesNeededToWin > 1 ? "решителен гейм" : "още точки"}`
            ) : (
              "Въведете резултатите"
            )}
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
