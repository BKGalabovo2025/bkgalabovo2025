"use client";

import { AlertCircle, CheckCircle2, Minus, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface GameScore {
  p1: number;
  p2: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface GameScoreRowProps {
  idx: number;
  game: GameScore;
  validation: ValidationResult | null;
  totalGames: number;
  onUpdateScore: (idx: number, player: "p1" | "p2", delta: number) => void;
  onSetScore: (idx: number, player: "p1" | "p2", value: number) => void;
  onRemoveGame: (idx: number) => void;
}

export function GameScoreRow({
  idx,
  game,
  validation,
  totalGames,
  onUpdateScore,
  onSetScore,
  onRemoveGame,
}: GameScoreRowProps) {
  const hasError = validation && !validation.valid;
  const isOk = validation && validation.valid;

  const getInputClass = () => {
    if (hasError) return "border-red-400 focus:ring-red-400";
    if (isOk) return "border-green-400 focus:ring-green-400";
    return "focus:ring-primary";
  };

  const inputClassName = cn(
    "h-10 w-14 rounded-lg border bg-background text-center text-xl font-bold transition-colors focus:ring-2 focus:outline-none",
    getInputClass()
  );

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Играч 1 */}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onUpdateScore(idx, "p1", -1)}
            className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-muted"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="number"
            min={0}
            value={game.p1}
            onChange={(e) => onSetScore(idx, "p1", parseInt(e.target.value))}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => onUpdateScore(idx, "p1", 1)}
            className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-muted"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {/* Разделител */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Гейм {idx + 1}
          </span>
          {isOk && <CheckCircle2 className="size-3 text-green-500" />}
          {hasError && <AlertCircle className="size-3 text-red-500" />}
          {totalGames > 1 && !isOk && (
            <button
              type="button"
              onClick={() => onRemoveGame(idx)}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Играч 2 */}
        <div className="flex items-center justify-start gap-1">
          <button
            type="button"
            onClick={() => onUpdateScore(idx, "p2", -1)}
            className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-muted"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="number"
            min={0}
            value={game.p2}
            onChange={(e) => onSetScore(idx, "p2", parseInt(e.target.value))}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => onUpdateScore(idx, "p2", 1)}
            className="flex size-8 items-center justify-center rounded-full border transition-colors hover:bg-muted"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      {/* Грешка за гейма */}
      {hasError && (
        <p className="flex items-center justify-center gap-1 text-center text-xs text-red-500">
          <AlertCircle className="size-3" />
          {validation?.error}
        </p>
      )}
    </div>
  );
}
