/* eslint-disable sonarjs/no-nested-conditional */
 
 
"use client";

import { useMemo } from "react";
import { Match } from "@/types/tournament.types";
import { cn } from "@/lib/utils";
import { Trophy, Minus } from "lucide-react";

interface TournamentBracketProps {
  matches: Match[];
  getEntryName: (id?: string | null) => string;
  category: string;
}

/**
 * Visual round-robin bracket tree.
 * Renders matches grouped by round as vertical columns.
 * Completed matches show score and highlight the winner in emerald.
 * Pending matches show a subtle blue border.
 */
export function TournamentBracket({
  matches,
  getEntryName,
  category,
}: TournamentBracketProps) {
  const catMatches = useMemo(
    () => matches.filter((m) => m.categoryId === category),
    [matches, category]
  );

  const rounds = useMemo(() => {
    const roundMap = new Map<number, Match[]>();
    catMatches.forEach((m) => {
      const r = m.round ?? 1;
      if (!roundMap.has(r)) roundMap.set(r, []);
      roundMap.get(r)!.push(m);
    });
    return Array.from(roundMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => ({ round, matches: roundMatches }));
  }, [catMatches]);

  if (catMatches.length === 0) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-10" strokeWidth={1} />
        <p className="text-[11px] uppercase tracking-widest font-medium">
          Няма генерирани мачове
        </p>
      </div>
    );
  }

  const completedCount = catMatches.filter(
    (m) => m.status === "completed"
  ).length;
  const progress = Math.round((completedCount / catMatches.length) * 100);

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-2 px-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium">
            Прогрес на турнира
          </span>
          <span className="text-[11px] font-medium text-zinc-600 tabular-nums">
            {completedCount}/{catMatches.length} мача ({progress}%)
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              progress === 100
                ? "bg-emerald-500"
                : progress > 50
                  ? "bg-primary"
                  : "bg-amber-400"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Round columns — horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-4">
        <div
          className="flex gap-6 min-w-max"
          style={{ alignItems: "flex-start" }}
        >
          {rounds.map(({ round, matches: roundMatches }, colIdx) => (
            <div key={round} className="flex flex-col gap-4 w-72">
              {/* Round header */}
              <div className="flex items-center gap-2 px-2">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                    colIdx === 0
                      ? "bg-primary text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}
                >
                  {round}
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
                  Кръг {round}
                </span>
                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
              </div>

              {/* Match cards */}
              {roundMatches.map((match) => {
                const isCompleted = match.status === "completed";
                const p1Name = getEntryName(match.player1EntryId);
                const p2Name = getEntryName(match.player2EntryId);
                const isBye = !match.player1EntryId || !match.player2EntryId;

                return (
                  <div
                    key={match.id}
                    className={cn(
                      "rounded-3xl border transition-all duration-300 overflow-hidden",
                      isCompleted
                        ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10"
                        : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-primary/30"
                    )}
                  >
                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500">
                          Завършен
                        </span>
                      </div>
                    )}

                    {/* Players */}
                    <div className="px-4 pb-3 pt-2 space-y-2">
                      {isBye ? (
                        <div className="flex items-center gap-2 text-zinc-300 dark:text-zinc-600 py-2">
                          <Minus className="h-3 w-3" />
                          <span className="text-xs font-light">
                            Почивка (BYE)
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Player 1 */}
                          <div
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors",
                              isCompleted &&
                                match.winnerEntryId === match.player1EntryId
                                ? "bg-emerald-500 text-white"
                                : isCompleted
                                  ? "bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400"
                                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCompleted &&
                                match.winnerEntryId ===
                                  match.player1EntryId && (
                                  <Trophy className="h-3 w-3 text-yellow-300 shrink-0" />
                                )}
                              <span className="text-xs font-medium truncate">
                                {p1Name}
                              </span>
                            </div>
                          </div>

                          {/* VS divider with score */}
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-600 font-medium">
                              срещу
                            </span>
                            {isCompleted && match.score && (
                              <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 tracking-wider">
                                {match.score}
                              </span>
                            )}
                          </div>

                          {/* Player 2 */}
                          <div
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors",
                              isCompleted &&
                                match.winnerEntryId === match.player2EntryId
                                ? "bg-emerald-500 text-white"
                                : isCompleted
                                  ? "bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400"
                                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isCompleted &&
                                match.winnerEntryId ===
                                  match.player2EntryId && (
                                  <Trophy className="h-3 w-3 text-yellow-300 shrink-0" />
                                )}
                              <span className="text-xs font-medium truncate">
                                {p2Name}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
