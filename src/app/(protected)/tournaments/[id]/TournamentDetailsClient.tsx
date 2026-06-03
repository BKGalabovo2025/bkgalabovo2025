"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tournamentService } from "@/services/tournament-service";
import { Tournament, TournamentEntry, Match } from "@/types/tournament.types";
import { generateBergerMatches } from "@/lib/match-generator";
import { EntryForm } from "@/components/tournaments/entry-form";
import { ScoreDialog } from "@/components/tournaments/score-dialog";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/date-utils";
import {
  UserPlus,
  Trash2,
  Trophy,
  ShieldAlert,
  CheckCircle2,
  Pencil,
  FileDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPdf, type ExportRow } from "@/lib/export-utils";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";

export interface InitialTournamentData {
  tournament: Tournament;
  entries: TournamentEntry[];
  matches: Match[];
  membersDict: Record<string, Member>;
}

export default function TournamentDetailsClient({
  tournamentId,
  initialData,
}: {
  tournamentId: string;
  initialData: InitialTournamentData;
}) {
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(
    initialData.tournament
  );
  const [entries, setEntries] = useState<TournamentEntry[]>(
    initialData.entries
  );
  const [matches, setMatches] = useState<Match[]>(initialData.matches);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>(
    initialData.membersDict
  );

  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState("participants");

  const loadData = useCallback(async () => {
    if (!tournamentId) return;

    try {
      const [tournData, entriesData, matchesData, membersData] =
        await Promise.all([
          tournamentService.getTournamentById(tournamentId),
          tournamentService.getTournamentEntries(tournamentId),
          tournamentService.getTournamentMatches(tournamentId),
          getAllMembers(),
        ]);

      if (!tournData) {
        toast.error("Турнирът не е намерен!");
        router.push("/tournaments");
        return;
      }

      const dict: Record<string, Member> = {};
      membersData.forEach((m) => {
        if (m.id) dict[m.id] = m;
      });

      setTournament(tournData);

      // Sort entries by registration date (client-side) to avoid missing index errors in Firestore
      const sortedEntries = entriesData.sort((a, b) => {
        if (!a.registrationDate) return 1;
        if (!b.registrationDate) return -1;
        return (
          new Date(a.registrationDate).getTime() -
          new Date(b.registrationDate).getTime()
        );
      });
      setEntries(sortedEntries);

      setMatches(matchesData);
      setMembersDict(dict);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при зареждане на данните");
    }
  }, [tournamentId, router]);

  // Re-fetch after mutations
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateMatches = async () => {
    if (!tournament) return;
    if (entries.length < 2) {
      toast.error("Нужни са поне 2 участника за генериране на схема.");
      return;
    }

    if (matches.length > 0) {
      if (
        !confirm(
          "Вече има генерирани мачове. Искате ли да ги изтриете и да генерирате нови? Всички въведени резултати ще бъдат загубени!"
        )
      )
        return;
    }

    setIsGenerating(true);
    try {
      if (matches.length > 0) {
        await tournamentService.deleteMatchesByTournament(tournamentId);
      }

      let allNewMatches: Omit<Match, "id">[] = [];

      // Generate matches per category
      tournament.categories.forEach((cat) => {
        const catEntries = entries.filter((e) => e.categoryId === cat);
        const newMatches = generateBergerMatches(
          tournamentId,
          cat as "singles" | "doubles" | "mixed",
          catEntries
        );
        allNewMatches = [...allNewMatches, ...newMatches];
      });

      if (allNewMatches.length === 0) {
        toast.error(
          "Няма достатъчно участници в отделните категории за мачове."
        );
        setIsGenerating(false);
        return;
      }

      await tournamentService.createMatches(allNewMatches);
      toast.success("Схемата беше генерирана успешно!");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Грешка при генериране на мачове");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEntry = async (data: TournamentEntry | TournamentEntry[]) => {
    try {
      if (Array.isArray(data)) {
        for (const entry of data) {
          await tournamentService.createTournamentEntry(entry);
        }
        toast.success(`${data.length} участници бяха записани!`);
      } else {
        await tournamentService.createTournamentEntry(data);
        toast.success("Участникът е записан успешно!");
      }
      await loadData();
    } catch (error) {
      toast.error("Възникна грешка при записване");
      throw error;
    }
  };

  const handleUpdateTournament = async (data: Partial<Tournament>) => {
    if (!tournament?.id) return;
    try {
      await tournamentService.updateTournament(tournament.id, data);
      toast.success("Турнирът е обновен!");
      setIsEditDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error("Грешка при обновяване");
      throw error;
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този участник от турнира?"
      )
    )
      return;
    try {
      await tournamentService.deleteTournamentEntry(entryId);
      toast.success("Участникът е премахнат.");
      setEntries(entries.filter((e) => e.id !== entryId));
    } catch {
      toast.error("Грешка при изтриване");
    }
  };

  const getPlayerName = useCallback(
    (memberId?: string, externalName?: string) => {
      if (externalName) return `${externalName} (Гост)`;
      if (memberId && membersDict[memberId]) {
        const m = membersDict[memberId];
        return `${m.firstName} ${m.lastName}`;
      }
      return "Неизвестен";
    },
    [membersDict]
  );

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "singles":
        return "Единично";
      case "doubles":
        return "Двойки";
      case "mixed":
        return "Смесени двойки";
      default:
        return cat;
    }
  };

  const handleSaveScore = async (
    matchId: string,
    score: string,
    winnerEntryId: string
  ) => {
    try {
      await tournamentService.updateMatchScore(matchId, {
        score,
        winnerEntryId,
      });
      toast.success("Резултатът е записан!");
      setSelectedMatch(null);
      await loadData();

      // Проверка дали всички мачове са приключили
      const updatedMatches =
        await tournamentService.getTournamentMatches(tournamentId);
      const allCompleted =
        updatedMatches.length > 0 &&
        updatedMatches.every((m: Match) => m.status === "completed");

      if (allCompleted && tournament?.status !== "completed") {
        const shouldComplete = confirm(
          "Всички срещи в турнира са изиграни! Желаете ли да приключите турнира официално?"
        );
        if (shouldComplete) {
          await handleCompleteTournament();
        }
      }
    } catch {
      toast.error("Грешка при записване");
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament?.id) return;
    try {
      await tournamentService.updateTournament(tournament.id, {
        status: "completed",
      });
      toast.success("Турнирът е успешно приключен!");
      await loadData();
    } catch {
      toast.error("Грешка при приключване");
    }
  };

  const handleExport = async (
    formatType: "excel" | "pdf",
    category: string,
    standings: {
      name: string;
      played: number;
      wins: number;
      losses: number;
      gamesWon: number;
      gamesLost: number;
      points: number;
      entryId: string;
    }[]
  ) => {
    if (!tournament) return;

    const rows: ExportRow[] = standings.map((s, idx) => ({
      position: idx + 1,
      name: s.name || getEntryNameById(s.entryId),
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      pointsRatio: `${s.gamesWon}:${s.gamesLost}`,
      winRate:
        s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%",
      totalPoints: s.points,
    }));

    const options = {
      title: tournament.title,
      subtitle: `${formatDateShort(tournament.startDate)} - ${tournament.location}`,
      category:
        category === "singles"
          ? "Единично"
          : category === "doubles"
            ? "Двойки"
            : "Смесени",
      rows,
    };

    if (formatType === "excel") await exportToExcel(options);
    else await exportToPdf(options);
  };

  const getEntryNameById = useCallback(
    (entryId?: string | null) => {
      if (!entryId) return "Почива (BYE)";
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return "Неизвестен";
      const p1 = getPlayerName(entry.memberId, entry.externalName);
      if (entry.categoryId === "doubles" || entry.categoryId === "mixed") {
        const p2 = getPlayerName(
          entry.partnerMemberId,
          entry.partnerExternalName
        );
        return `${p1} / ${p2}`;
      }
      return p1;
    },
    [entries, getPlayerName]
  );

  if (!mounted) return <div className="p-12 text-center">Зареждане...</div>;
  if (!tournament) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title={tournament.title}
        description={`${formatDateShort(tournament.startDate)} • ${tournament.location}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Турнири", href: "/tournaments" },
          { label: tournament.title },
        ]}
      >
        <Button
          variant="outline"
          onClick={() => setIsEditDialogOpen(true)}
          className="rounded-xl shadow-sm border-slate-200"
        >
          <Pencil className="mr-2 h-4 w-4" /> Редактирай турнира
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Записване за турнира</DialogTitle>
            </DialogHeader>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Редактиране на турнир</DialogTitle>
            </DialogHeader>
            <TournamentForm
              onSave={handleUpdateTournament}
              onClose={() => setIsEditDialogOpen(false)}
              initialData={tournament}
            />
          </DialogContent>
        </Dialog>

        <ScoreDialog
          key={selectedMatch?.id || "none"}
          isOpen={!!selectedMatch}
          match={selectedMatch}
          matchFormatId={tournament.matchFormatId}
          getEntryName={getEntryNameById}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSaveScore}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl h-14 border border-zinc-100 dark:border-zinc-800">
            <TabsTrigger
              value="participants"
              className="rounded-xl font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white text-zinc-500 transition-all"
            >
              Участници ({entries.length})
            </TabsTrigger>
            <TabsTrigger
              value="bracket"
              className="rounded-xl font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white text-zinc-500 transition-all"
            >
              Схема
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="rounded-xl font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white text-zinc-500 transition-all"
            >
              Мачове ({matches.length})
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="rounded-xl font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white text-zinc-500 transition-all"
            >
              Резултати
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-6">
            <BentoCard>
              <div className="p-8 flex flex-row items-center justify-between border-b border-zinc-100/50">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">
                    Списък с участници
                  </h3>
                  <p className="text-sm font-light text-zinc-400 mt-1">
                    Всички регистрирани играчи за този турнир
                  </p>
                </div>
                <Button
                  onClick={() => setIsEntryDialogOpen(true)}
                  className="rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-none"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Запиши участник
                </Button>
              </div>
              <div className="p-8">
                {entries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="mx-auto h-8 w-8 mb-3 opacity-50" />
                    <p>Няма записани участници все още.</p>
                  </div>
                ) : (
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
                          <TableCell className="font-medium text-zinc-900">
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
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </BentoCard>
          </TabsContent>

          {/* Visual bracket tab */}
          <TabsContent value="bracket" className="mt-6">
            <BentoCard className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  Визуална Схема
                </h3>
                <p className="text-sm font-light text-zinc-400 mt-1">
                  Прогрес на турнира по кръгове
                </p>
              </div>
              {tournament.categories.map((cat) => (
                <div key={cat} className="mb-10">
                  <div className="bg-muted px-4 py-3 rounded-lg border mb-6 flex items-center">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
                      {getCategoryName(cat)}
                    </h3>
                  </div>
                  <TournamentBracket
                    matches={matches}
                    getEntryName={getEntryNameById}
                    category={cat}
                  />
                </div>
              ))}
            </BentoCard>
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <BentoCard>
              <div className="p-8 flex flex-row items-center justify-between border-b border-zinc-100/50">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">
                    Генератор на мачове
                  </h3>
                  <p className="text-sm font-light text-zinc-400 mt-1">
                    Схема на турнира (Система Бергер)
                  </p>
                </div>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating || entries.length < 2}
                  className={cn(
                    "rounded-xl shadow-none font-medium text-[11px] uppercase tracking-widest h-12 px-6 transition-all",
                    matches.length > 0
                      ? "bg-white border border-zinc-200 text-zinc-950 hover:bg-zinc-50"
                      : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  <Trophy className="mr-3 h-4 w-4" strokeWidth={1.5} />
                  {matches.length > 0
                    ? "Прегенерирай схемата"
                    : "Генерирай мачове"}
                </Button>
              </div>
              <div className="p-8">
                {matches.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Trophy className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>
                      Мачовете ще могат да се генерират, когато всички участници
                      са записани.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {tournament.categories.map((cat) => {
                      const catMatches = matches.filter(
                        (m) => m.categoryId === cat
                      );
                      if (catMatches.length === 0) return null;

                      const pendingMatches = catMatches
                        .filter((m) => m.status !== "completed")
                        .sort((a, b) => (a.round || 0) - (b.round || 0));
                      const completedMatches = catMatches
                        .filter((m) => m.status === "completed")
                        .sort((a, b) => (a.round || 0) - (b.round || 0));

                      return (
                        <div key={cat} className="space-y-6">
                          <div className="bg-muted px-4 py-3 rounded-lg border flex items-center">
                            <h3 className="text-lg font-medium uppercase tracking-widest text-zinc-500">
                              {getCategoryName(cat)}
                            </h3>
                          </div>

                          {/* Предстоящи мачове */}
                          {pendingMatches.length > 0 && (
                            <div className="ml-4">
                              <h4 className="text-[11px] font-medium text-zinc-400 mb-6 uppercase tracking-[0.2em] flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                                Предстоящи мачове ({pendingMatches.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {pendingMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="border border-zinc-100 rounded-4xl p-6 flex flex-col justify-between shadow-none hover:border-zinc-200 transition-all bg-white"
                                  >
                                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        Кръг {match.round}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {match.stage}
                                      </span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                      <div className="flex justify-between items-center font-light text-zinc-900">
                                        <span className="truncate pr-2">
                                          {getEntryNameById(
                                            match.player1EntryId
                                          )}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                                        срещу
                                      </div>
                                      <div className="flex justify-between items-center font-light text-zinc-900">
                                        <span className="truncate pr-2">
                                          {getEntryNameById(
                                            match.player2EntryId
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t flex justify-end items-center">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-none transition-all"
                                        onClick={() => setSelectedMatch(match)}
                                      >
                                        Въведи резултат
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Изиграни мачове */}
                          {completedMatches.length > 0 && (
                            <div className="ml-4">
                              <h4 className="text-[11px] font-medium text-zinc-400 mb-6 uppercase tracking-[0.2em] flex items-center">
                                <CheckCircle2
                                  className="w-4 h-4 mr-2 text-emerald-500"
                                  strokeWidth={1.5}
                                />
                                Изиграни мачове ({completedMatches.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 opacity-80">
                                {completedMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="border border-zinc-100 rounded-4xl p-6 flex flex-col justify-between shadow-none bg-zinc-50/50"
                                  >
                                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-muted-foreground/20">
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none"
                                      >
                                        Завършен
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Кръг {match.round}
                                      </span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                      <div
                                        className={`flex justify-between items-center font-light ${match.winnerEntryId === match.player1EntryId ? "text-emerald-600" : "text-zinc-500"}`}
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {match.winnerEntryId ===
                                            match.player1EntryId && (
                                            <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                                          )}
                                          <span className="truncate">
                                            {getEntryNameById(
                                              match.player1EntryId
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground pl-2 border-l-2 border-muted-foreground/30">
                                        срещу
                                      </div>
                                      <div
                                        className={`flex justify-between items-center font-light ${match.winnerEntryId === match.player2EntryId ? "text-emerald-600" : "text-zinc-500"}`}
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {match.winnerEntryId ===
                                            match.player2EntryId && (
                                            <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                                          )}
                                          <span className="truncate">
                                            {getEntryNameById(
                                              match.player2EntryId
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-muted-foreground/20 flex justify-between items-center">
                                      <div className="font-light text-lg font-mono tracking-widest text-zinc-900">
                                        {match.score}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 px-4 rounded-xl text-[10px] font-medium uppercase tracking-widest border-zinc-200 hover:bg-zinc-950 hover:text-white transition-all shadow-none"
                                        onClick={() => setSelectedMatch(match)}
                                      >
                                        Редактирай
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </BentoCard>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {tournament.categories.map((cat) => {
              const catEntries = entries.filter((e) => e.categoryId === cat);
              const catMatches = matches.filter(
                (m) => m.categoryId === cat && m.status === "completed"
              );

              if (catEntries.length === 0) return null;

              // Изчисляваме класирането
              type Standing = {
                entryId: string;
                name: string;
                played: number;
                wins: number;
                losses: number;
                gamesWon: number;
                gamesLost: number;
                points: number;
              };

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
                if (!m.player1EntryId || !m.player2EntryId || !m.winnerEntryId)
                  return;

                const p1 = standingsMap[m.player1EntryId];
                const p2 = standingsMap[m.player2EntryId];
                if (!p1 || !p2) return;

                p1.played++;
                p2.played++;

                // Парсираме геймове от резултата
                if (m.score) {
                  m.score.split(",").forEach((s) => {
                    const parts = s.trim().split("-");
                    const s1 = parseInt(parts[0]) || 0;
                    const s2 = parseInt(parts[1]) || 0;
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
                <BentoCard key={cat} className="mb-8">
                  <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-100/50">
                    <div>
                      <h3 className="text-lg font-medium text-zinc-900 flex items-center gap-2">
                        <Trophy
                          className="h-5 w-5 text-amber-400"
                          strokeWidth={1.5}
                        />
                        Класиране – {getCategoryName(cat)}
                      </h3>
                      <p className="text-sm font-light text-zinc-400 mt-1">
                        {catMatches.length} от{" "}
                        {matches.filter((m) => m.categoryId === cat).length}{" "}
                        мача изиграни
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => handleExport("excel", cat, standings)}
                      >
                        <FileDown className="h-4 w-4 text-green-600" /> Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => handleExport("pdf", cat, standings)}
                      >
                        <Download className="h-4 w-4 text-red-600" /> PDF
                      </Button>
                      {tournament.status !== "completed" &&
                        matches
                          .filter((m) => m.categoryId === cat)
                          .every((m) => m.status === "completed") && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 gap-2 bg-green-600 hover:bg-green-700"
                            onClick={handleCompleteTournament}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Приключи
                            турнира
                          </Button>
                        )}
                    </div>
                  </div>

                  <div className="p-8 pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>Участник</TableHead>
                          <TableHead className="text-center">
                            Изиграни
                          </TableHead>
                          <TableHead className="text-center text-green-600">
                            Победи
                          </TableHead>
                          <TableHead className="text-center text-destructive">
                            Загуби
                          </TableHead>
                          <TableHead className="text-center">
                            Т. Разлика
                          </TableHead>
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
                            <TableCell className="text-center font-medium text-zinc-900">
                              {idx === 0 && s.wins > 0 ? (
                                <span className="text-yellow-500">🥇</span>
                              ) : idx === 1 && s.wins > 0 ? (
                                <span>🥈</span>
                              ) : idx === 2 && s.wins > 0 ? (
                                <span>🥉</span>
                              ) : (
                                idx + 1
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-center">
                              {s.played}
                            </TableCell>
                            <TableCell className="text-center text-emerald-600 font-medium">
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
                    {catMatches.length === 0 && (
                      <p className="text-center text-sm font-light text-zinc-400 mt-8">
                        Все още няма изиграни мачове в тази категория.
                      </p>
                    )}
                  </div>
                </BentoCard>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
