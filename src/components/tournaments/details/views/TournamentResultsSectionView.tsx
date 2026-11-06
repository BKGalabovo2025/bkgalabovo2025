"use client";

import { CheckCircle2, Download, FileDown, Trophy } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  type Standing,
  useTournamentDetailsContext,
} from "../TournamentDetailsContext";

export function TournamentResultsSectionView() {
  const {
    tournament,
    entries,
    matches,
    getPlayerName,
    getEntryNameById,
    getCategoryName,
    getMedalEmoji,
    handleExport,
    handleCompleteTournament,
  } = useTournamentDetailsContext();

  if (!tournament) return null;

  const renderEntryParticipantLinks = (
    entryId: string,
    fallbackName: string
  ) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return fallbackName;

    const p1Name = getPlayerName(entry.memberId, entry.externalName);
    const p1Node = entry.memberId ? (
      <Link
        href={`/members/${entry.memberId}`}
        className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
      >
        {p1Name}
      </Link>
    ) : (
      <span>{p1Name}</span>
    );

    if (entry.categoryId === "doubles" || entry.categoryId === "mixed") {
      const p2Name = getPlayerName(
        entry.partnerMemberId,
        entry.partnerExternalName
      );
      const p2Node = entry.partnerMemberId ? (
        <Link
          href={`/members/${entry.partnerMemberId}`}
          className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
        >
          {p2Name}
        </Link>
      ) : (
        <span>{p2Name}</span>
      );
      return (
        <span>
          {p1Node} / {p2Node}
        </span>
      );
    }

    return p1Node;
  };

  return (
    <div className="space-y-6">
      {tournament.categories.map((cat) => {
        const catEntries = entries.filter((e) => e.categoryId === cat);
        const catMatches = matches.filter(
          (m) => m.categoryId === cat && m.status === "completed"
        );

        if (catEntries.length === 0) return null;

        const standingsMap: Record<string, Standing> = {};
        catEntries.forEach((e) => {
          if (!e.id) return;
          standingsMap[e.id] = {
            entryId: e.id,
            name: getEntryNameById(e.id),
            played: 0,
            wins: 0,
            losses: 0,
            gamesWon: 0,
            gamesLost: 0,
            points: 0,
          };
        });

        catMatches.forEach((m) => {
          if (!m.player1EntryId || !m.player2EntryId || !m.winnerEntryId) {
            return;
          }

          const p1 = standingsMap[m.player1EntryId];
          const p2 = standingsMap[m.player2EntryId];
          if (!p1 || !p2) return;

          p1.played++;
          p2.played++;

          // Парсираме геймове от резултата
          if (m.score) {
            m.score.split(",").forEach((s) => {
              const parts = s.trim().split("-");
              const s1 = parseInt(parts[0], 10) || 0;
              const s2 = parseInt(parts[1], 10) || 0;
              p1.gamesWon += s1;
              p1.gamesLost += s2;
              p2.gamesWon += s2;
              p2.gamesLost += s1;
            });
          }

          if (m.winnerEntryId === m.player1EntryId) {
            p1.wins++;
            p1.points += 2;
            p2.losses++;
          } else {
            p2.wins++;
            p2.points += 2;
            p1.losses++;
          }
        });

        const standings = Object.values(standingsMap).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          const aDiff = a.gamesWon - a.gamesLost;
          const bDiff = b.gamesWon - b.gamesLost;
          return bDiff - aDiff;
        });

        return (
          <BentoCard key={cat} className="mb-4 overflow-hidden p-0">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-zinc-100 p-3.5 sm:p-4.5 md:flex-row md:items-center dark:border-zinc-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-medium text-zinc-900 sm:text-lg dark:text-white">
                  <Trophy
                    className="size-4 text-amber-400 sm:size-5"
                    strokeWidth={1.5}
                  />
                  Класиране – {getCategoryName(cat)}
                </h3>
                <p className="mt-0.5 text-xs font-light text-zinc-400 sm:text-sm">
                  {catMatches.length} от{" "}
                  {matches.filter((m) => m.categoryId === cat).length} мача
                  изиграни
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleExport("excel", cat, standings)}
                >
                  <FileDown className="size-3.5 text-green-600" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleExport("pdf", cat, standings)}
                >
                  <Download className="size-3.5 text-red-600" /> PDF
                </Button>
                {tournament.status !== "completed" &&
                  matches.length > 0 &&
                  matches.every((m) => m.status === "completed") && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 gap-1.5 bg-green-600 text-xs hover:bg-green-700"
                      onClick={handleCompleteTournament}
                    >
                      <CheckCircle2 className="size-3.5" /> Приключи турнира
                    </Button>
                  )}
              </div>
            </div>

            <div className="p-3.5 pt-0 sm:p-4.5">
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Участник</TableHead>
                      <TableHead className="text-center">Изиграни</TableHead>
                      <TableHead className="text-center text-green-600">
                        Победи
                      </TableHead>
                      <TableHead className="text-center text-destructive">
                        Загуби
                      </TableHead>
                      <TableHead className="text-center">Т. Разлика</TableHead>
                      <TableHead className="text-center font-medium text-zinc-400">
                        Точки
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((s, idx) => (
                      <TableRow
                        key={s.entryId}
                        className={
                          idx === 0 && s.played > 0
                            ? "bg-yellow-50 dark:bg-yellow-900/10"
                            : ""
                        }
                      >
                        <TableCell className="text-center font-medium text-zinc-900 dark:text-zinc-100">
                          {getMedalEmoji(idx, s.wins)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {renderEntryParticipantLinks(s.entryId, s.name)}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.played}
                        </TableCell>
                        <TableCell className="text-center font-medium text-emerald-600 dark:text-emerald-400">
                          {s.wins}
                        </TableCell>
                        <TableCell className="text-center text-destructive">
                          {s.losses}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {s.gamesWon}:{s.gamesLost}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              idx === 0 && s.played > 0
                                ? "default"
                                : "secondary"
                            }
                            className="font-medium shadow-none"
                          >
                            {s.points}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View: Standings Cards */}
              <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
                {standings.map((s, idx) => (
                  <div
                    key={s.entryId}
                    className={`flex flex-col gap-4 p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900 ${
                      idx === 0 && s.played > 0
                        ? "bg-yellow-50/50 dark:bg-yellow-900/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 shrink-0 text-center text-2xl font-light">
                          {getMedalEmoji(idx, s.wins)}
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {renderEntryParticipantLinks(s.entryId, s.name)}
                        </span>
                      </div>
                      <Badge
                        variant={
                          idx === 0 && s.played > 0 ? "default" : "secondary"
                        }
                        className="font-medium tabular-nums shadow-none"
                      >
                        {s.points} т.
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 border-t border-zinc-50 pt-3 dark:border-zinc-900">
                      <div className="rounded-lg bg-zinc-50 py-2 text-center dark:bg-zinc-800/50">
                        <div className="mb-1 text-[9px] tracking-widest text-zinc-400 uppercase">
                          Из.
                        </div>
                        <div className="text-xs font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
                          {s.played}
                        </div>
                      </div>
                      <div className="rounded-lg bg-emerald-50 py-2 text-center dark:bg-emerald-950/20">
                        <div className="mb-1 text-[9px] tracking-widest text-emerald-600/70 uppercase">
                          Поб.
                        </div>
                        <div className="text-xs font-semibold text-emerald-600 tabular-nums">
                          {s.wins}
                        </div>
                      </div>
                      <div className="rounded-lg bg-rose-50 py-2 text-center dark:bg-rose-950/20">
                        <div className="mb-1 text-[9px] tracking-widest text-rose-500/70 uppercase">
                          Заг.
                        </div>
                        <div className="text-xs font-semibold text-rose-500 tabular-nums">
                          {s.losses}
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-50 py-2 text-center dark:bg-zinc-800/50">
                        <div className="mb-1 text-[9px] tracking-widest text-zinc-400 uppercase">
                          Разл.
                        </div>
                        <span className="font-mono text-xs font-semibold tracking-wider text-zinc-700 tabular-nums dark:text-zinc-300">
                          {s.gamesWon}:{s.gamesLost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {catMatches.length === 0 && (
                <p className="mt-8 text-center text-sm font-light text-zinc-400">
                  Все още няма изиграни мачове в тази категория.
                </p>
              )}
            </div>
          </BentoCard>
        );
      })}
    </div>
  );
}
