"use client";

import { Minus, Plus, X, AlertCircle, CheckCircle2 } from "lucide-react";
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
    "w-14 h-10 text-center text-xl font-bold border rounded-lg bg-background focus:outline-none focus:ring-2 transition-colors",
    getInputClass()
  );

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Играч 1 */}
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={() => onUpdateScore(idx, "p1", -1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minus className="w-3 h-3" />
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
          {isOk && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {hasError && <AlertCircle className="w-3 h-3 text-red-500" />}
          {totalGames > 1 && !isOk && (
            <button
              type="button"
              onClick={() => onRemoveGame(idx)}
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
            onClick={() => onUpdateScore(idx, "p2", -1)}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minus className="w-3 h-3" />
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
}
