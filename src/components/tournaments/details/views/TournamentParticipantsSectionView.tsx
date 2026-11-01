"use client";

import { ShieldAlert, Trash2, Trophy, UserPlus } from "lucide-react";
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

import { useTournamentDetailsContext } from "../TournamentDetailsContext";

export function TournamentParticipantsSectionView() {
  const {
    entries,
    matches,
    isGenerating,
    setIsEntryDialogOpen,
    handleGenerateMatches,
    handleDeleteEntry,
    getPlayerName,
    getCategoryName,
  } = useTournamentDetailsContext();

  return (
    <BentoCard className="overflow-hidden p-0">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-zinc-100 p-3.5 sm:flex-row sm:items-center sm:p-4.5 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-medium text-zinc-900 sm:text-lg dark:text-white">
            Списък с участници
          </h3>
          <p className="mt-0.5 text-xs font-light text-zinc-400 sm:text-sm">
            Всички регистрирани играчи за този турнир
          </p>
        </div>
        <div className="flex items-center gap-2">
          {entries.length >= 2 && (
            <Button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="h-9 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Trophy className="mr-1.5 size-3.5" />
              {matches.length > 0 ? "Прегенерирай схемата" : "Генерирай схема"}
            </Button>
          )}
          <Button
            onClick={() => setIsEntryDialogOpen(true)}
            className="h-9 rounded-xl bg-zinc-950 px-3.5 text-xs font-medium text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <UserPlus className="mr-1.5 size-3.5" /> Запиши участник
          </Button>
        </div>
      </div>
      <div className="p-3.5 sm:p-4.5">
        {entries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto mb-3 size-8 opacity-50" />
            <p>Няма записани участници все още.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Категория</TableHead>
                    <TableHead>Участник 1</TableHead>
                    <TableHead>Участник 2</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {getCategoryName(entry.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        {getPlayerName(entry.memberId, entry.externalName)}
                      </TableCell>
                      <TableCell>
                        {entry.categoryId === "doubles" ||
                        entry.categoryId === "mixed" ? (
                          getPlayerName(
                            entry.partnerMemberId,
                            entry.partnerExternalName
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEntry(entry.id!)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="border-none px-2 py-0.5 text-[10px] tracking-widest uppercase"
                    >
                      {getCategoryName(entry.categoryId)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => handleDeleteEntry(entry.id!)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="size-1.5 shrink-0 rounded-full bg-primary/40" />
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {getPlayerName(entry.memberId, entry.externalName)}
                      </span>
                    </div>

                    {(entry.categoryId === "doubles" ||
                      entry.categoryId === "mixed") && (
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 shrink-0 rounded-full bg-primary/40" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {getPlayerName(
                            entry.partnerMemberId,
                            entry.partnerExternalName
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {matches.length === 0 && entries.length >= 2 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Всички участници са записани ({entries.length})
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Можете да изтеглите жребия и да генерирате схемата на
                      мачовете веднага.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                  className="h-10 shrink-0 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Trophy className="mr-2 size-4" />
                  {isGenerating
                    ? "Генериране..."
                    : "Генерирай турнирната схема"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </BentoCard>
  );
}
