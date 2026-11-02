"use client";

import { Pencil, Trophy, UserPlus } from "lucide-react";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/components/tournaments/entry-form";
import { ScoreDialog } from "@/components/tournaments/score-dialog";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateShort } from "@/lib/date-utils";

import {
  type InitialTournamentData,
  TournamentDetailsProvider,
  useTournamentDetailsContext,
} from "./TournamentDetailsContext";
import { TournamentDetailsNav } from "./TournamentDetailsNav";

function TournamentDetailsInner({ children }: { children: React.ReactNode }) {
  const {
    tournament,
    entries,
    matches,
    mounted,
    isLoading,
    isNotFound,
    isGenerating,
    isEntryDialogOpen,
    setIsEntryDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedMatch,
    setSelectedMatch,
    handleGenerateMatches,
    handleSaveEntry,
    handleUpdateTournament,
    handleSaveScore,
    getEntryNameById,
  } = useTournamentDetailsContext();

  if (!mounted || (isLoading && !tournament)) {
    return (
      <div className="space-y-8 pb-12" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isNotFound || !tournament) {
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-bold tracking-tight uppercase">
            Турнирът не бе намерен
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма намерен турнир с посочения идентификатор или е бил изтрит.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title={tournament.title}
        description={`${formatDateShort(tournament.startDate)} • ${tournament.location}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Турнири", href: "/tournaments" },
          { label: tournament.title },
        ]}
      >
        <div className="flex items-center gap-2">
          {entries.length >= 2 && (
            <Button
              onClick={handleGenerateMatches}
              disabled={isGenerating}
              className="rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Trophy className="mr-2 size-4" />
              {matches.length > 0 ? "Прегенерирай схемата" : "Генерирай схема"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
            className="rounded-xl border-slate-200 shadow-sm dark:border-zinc-800"
          >
            <Pencil className="mr-2 size-4" /> Редактирай
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Диалог за записване на участник */}
        <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
          <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl sm:max-h-[85vh] sm:w-full sm:max-w-2xl lg:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 pr-10 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                  <UserPlus className="size-4" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                    Записване за турнира
                  </DialogTitle>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Изберете състезатели и дисциплина
                  </p>
                </div>
              </div>
            </div>
            <EntryForm
              tournamentId={tournament.id!}
              allowedCategories={tournament.categories}
              existingEntries={entries}
              onSave={handleSaveEntry}
              onClose={() => setIsEntryDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Диалог за редактиране на турнира */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl sm:max-h-[85vh] sm:w-full sm:max-w-2xl lg:max-w-3xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 pr-10 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Trophy className="size-4" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                    Редактиране на турнир
                  </DialogTitle>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Променете параметрите на турнира
                  </p>
                </div>
              </div>
            </div>
            <TournamentForm
              onSave={handleUpdateTournament}
              onClose={() => setIsEditDialogOpen(false)}
              initialData={tournament}
            />
          </DialogContent>
        </Dialog>

        {/* Диалог за въвеждане на резултат */}
        <ScoreDialog
          key={selectedMatch?.id || "none"}
          isOpen={!!selectedMatch}
          match={selectedMatch}
          matchFormatId={tournament.matchFormatId}
          getEntryName={getEntryNameById}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSaveScore}
        />

        {/* Навигация между секциите (реални маршрути) */}
        <TournamentDetailsNav />

        {/* Активна подстраница (Section View) */}
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

export function TournamentDetailsLayoutClient({
  tournamentId,
  initialData,
  children,
}: {
  tournamentId: string;
  initialData: InitialTournamentData;
  children: React.ReactNode;
}) {
  return (
    <TournamentDetailsProvider
      tournamentId={tournamentId}
      initialData={initialData}
    >
      <TournamentDetailsInner>{children}</TournamentDetailsInner>
    </TournamentDetailsProvider>
  );
}
