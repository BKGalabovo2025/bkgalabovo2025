"use client";

import {
  CheckCircle2,
  Download,
  FileDown,
  Pencil,
  ShieldAlert,
  Trash2,
  Trophy,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/components/tournaments/entry-form";
import { ScoreDialog } from "@/components/tournaments/score-dialog";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/lib/date-utils";
import { generateExcelReport, generatePdfReport } from "@/lib/export-utils";
import { generateBergerMatches } from "@/lib/match-generator";
import { cn } from "@/lib/utils";
import { getAllMembers } from "@/services/member-service";
import { tournamentService } from "@/services/tournament-service";
import { Member } from "@/types/member.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

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

  const getMedalEmoji = (idx: number, wins: number) => {
    if (wins === 0) return idx + 1;
    if (idx === 0) return <span className="text-yellow-500">🥇</span>;
    if (idx === 1) return <span>🥈</span>;
    if (idx === 2) return <span>🥉</span>;
    return idx + 1;
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

    const rows = standings.map((s, idx) => ({
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

    const columns = [
      { header: "#", key: "position", width: 5, align: "center" as const },
      { header: "Участник", key: "name", width: 30, align: "left" as const },
      {
        header: "Изиграни",
        key: "played",
        width: 12,
        align: "center" as const,
      },
      { header: "Победи", key: "wins", width: 10, align: "center" as const },
      { header: "Загуби", key: "losses", width: 10, align: "center" as const },
      {
        header: "Т. Разлика",
        key: "pointsRatio",
        width: 15,
        align: "center" as const,
      },
      {
        header: "% Победи",
        key: "winRate",
        width: 12,
        align: "center" as const,
      },
      {
        header: "Точки",
        key: "totalPoints",
        width: 10,
        align: "center" as const,
      },
    ];

    const options = {
      title: tournament.title,
      subtitle: `${formatDateShort(tournament.startDate)} - ${tournament.location}`,
      metaData: `Категория: ${getCategoryName(category)}`,
      columns,
      data: rows,
      filenamePrefix:
        tournament.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, "_") + "_класиране",
    };

    if (formatType === "excel") await generateExcelReport(options);
    else await generatePdfReport(options);
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
        <Button
          variant="outline"
          onClick={() => setIsEditDialogOpen(true)}
          className="rounded-xl border-slate-200 shadow-sm"
        >
          <Pencil className="mr-2 size-4" /> Редактирай турнира
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
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
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
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
          <TabsList className="grid h-14 w-full max-w-xl grid-cols-4 rounded-2xl border border-zinc-100 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="participants"
              className="rounded-xl text-[11px] font-medium tracking-widest text-zinc-500 uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-none dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              Участници ({entries.length})
            </TabsTrigger>
            <TabsTrigger
              value="bracket"
              className="rounded-xl text-[11px] font-medium tracking-widest text-zinc-500 uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-none dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              Схема
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="rounded-xl text-[11px] font-medium tracking-widest text-zinc-500 uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-none dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              Мачове ({matches.length})
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="rounded-xl text-[11px] font-medium tracking-widest text-zinc-500 uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-none dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              Резултати
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-6">
            <BentoCard>
              <div className="flex flex-row items-center justify-between border-b border-zinc-100/50 p-8">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">
                    Списък с участници
                  </h3>
                  <p className="mt-1 text-sm font-light text-zinc-400">
                    Всички регистрирани играчи за този турнир
                  </p>
                </div>
                <Button
                  onClick={() => setIsEntryDialogOpen(true)}
                  className="rounded-xl bg-zinc-950 text-white shadow-none hover:bg-zinc-800"
                >
                  <UserPlus className="mr-2 size-4" /> Запиши участник
                </Button>
              </div>
              <div className="p-8">
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
                            <TableHead className="text-right">
                              Действия
                            </TableHead>
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
                                {getPlayerName(
                                  entry.memberId,
                                  entry.externalName
                                )}
                              </TableCell>
                              <TableCell>
                                {entry.categoryId === "doubles" ||
                                entry.categoryId === "mixed" ? (
                                  getPlayerName(
                                    entry.partnerMemberId,
                                    entry.partnerExternalName
                                  )
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
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
                                {getPlayerName(
                                  entry.memberId,
                                  entry.externalName
                                )}
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
                  </>
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
                <p className="mt-1 text-sm font-light text-zinc-400">
                  Прогрес на турнира по кръгове
                </p>
              </div>
              {tournament.categories.map((cat) => (
                <div key={cat} className="mb-10">
                  <div className="mb-6 flex items-center rounded-lg border bg-muted px-4 py-3">
                    <h3 className="text-sm font-medium tracking-widest text-zinc-500 uppercase">
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
              <div className="flex flex-row items-center justify-between border-b border-zinc-100/50 p-8">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900">
                    Генератор на мачове
                  </h3>
                  <p className="mt-1 text-sm font-light text-zinc-400">
                    Схема на турнира (Система Бергер)
                  </p>
                </div>
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating || entries.length < 2}
                  className={cn(
                    "h-12 rounded-xl px-6 text-[11px] font-medium tracking-widest uppercase shadow-none transition-all",
                    matches.length > 0
                      ? "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50"
                      : "bg-zinc-950 text-white hover:bg-zinc-800"
                  )}
                >
                  <Trophy className="mr-3 size-4" strokeWidth={1.5} />
                  {matches.length > 0
                    ? "Прегенерирай схемата"
                    : "Генерирай мачове"}
                </Button>
              </div>
              <div className="p-8">
                {matches.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Trophy className="mx-auto mb-4 size-12 opacity-20" />
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
                          <div className="flex items-center rounded-lg border bg-muted px-4 py-3">
                            <h3 className="text-lg font-medium tracking-widest text-zinc-500 uppercase">
                              {getCategoryName(cat)}
                            </h3>
                          </div>

                          {/* Предстоящи мачове */}
                          {pendingMatches.length > 0 && (
                            <div className="ml-4">
                              <h4 className="mb-6 flex items-center text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                                <span className="mr-2 size-2 rounded-full bg-blue-400"></span>
                                Предстоящи мачове ({pendingMatches.length})
                              </h4>
                              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-6 shadow-none transition-all hover:border-zinc-200"
                                  >
                                    <div className="mb-4 flex items-center justify-between border-b pb-2">
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

                                    <div className="mb-4 space-y-3">
                                      <div className="flex items-center justify-between font-light text-zinc-900">
                                        <span className="truncate pr-2">
                                          {getEntryNameById(
                                            match.player1EntryId
                                          )}
                                        </span>
                                      </div>
                                      <div className="border-l-2 border-primary/30 pl-2 text-xs text-muted-foreground">
                                        срещу
                                      </div>
                                      <div className="flex items-center justify-between font-light text-zinc-900">
                                        <span className="truncate pr-2">
                                          {getEntryNameById(
                                            match.player2EntryId
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-end border-t pt-3">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full rounded-xl bg-zinc-950 text-white shadow-none transition-all hover:bg-zinc-800"
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
                              <h4 className="mb-6 flex items-center text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                                <CheckCircle2
                                  className="mr-2 size-4 text-emerald-500"
                                  strokeWidth={1.5}
                                />
                                Изиграни мачове ({completedMatches.length})
                              </h4>
                              <div className="mb-6 grid grid-cols-1 gap-4 opacity-80 md:grid-cols-2 lg:grid-cols-3">
                                {completedMatches.map((match) => (
                                  <div
                                    key={match.id}
                                    className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-zinc-50/50 p-6 shadow-none"
                                  >
                                    <div className="mb-4 flex items-center justify-between border-b border-muted-foreground/20 pb-2">
                                      <Badge
                                        variant="secondary"
                                        className="border-emerald-100 bg-emerald-50 text-[10px] text-emerald-600 shadow-none"
                                      >
                                        Завършен
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Кръг {match.round}
                                      </span>
                                    </div>

                                    <div className="mb-4 space-y-3">
                                      <div
                                        className={`flex items-center justify-between font-light ${match.winnerEntryId === match.player1EntryId ? "text-emerald-600" : "text-zinc-500"}`}
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {match.winnerEntryId ===
                                            match.player1EntryId && (
                                            <Trophy className="size-3 shrink-0 text-yellow-500" />
                                          )}
                                          <span className="truncate">
                                            {getEntryNameById(
                                              match.player1EntryId
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="border-l-2 border-muted-foreground/30 pl-2 text-xs text-muted-foreground">
                                        срещу
                                      </div>
                                      <div
                                        className={`flex items-center justify-between font-light ${match.winnerEntryId === match.player2EntryId ? "text-emerald-600" : "text-zinc-500"}`}
                                      >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          {match.winnerEntryId ===
                                            match.player2EntryId && (
                                            <Trophy className="size-3 shrink-0 text-yellow-500" />
                                          )}
                                          <span className="truncate">
                                            {getEntryNameById(
                                              match.player2EntryId
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-muted-foreground/20 pt-3">
                                      <div className="font-mono text-lg font-light tracking-widest text-zinc-900">
                                        {match.score}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-xl border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase shadow-none transition-all hover:bg-zinc-950 hover:text-white"
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
                  <div className="flex flex-col items-start justify-between gap-6 border-b border-zinc-100/50 p-8 md:flex-row md:items-center">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-medium text-zinc-900">
                        <Trophy
                          className="size-5 text-amber-400"
                          strokeWidth={1.5}
                        />
                        Класиране – {getCategoryName(cat)}
                      </h3>
                      <p className="mt-1 text-sm font-light text-zinc-400">
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
                        <FileDown className="size-4 text-green-600" /> Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => handleExport("pdf", cat, standings)}
                      >
                        <Download className="size-4 text-red-600" /> PDF
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
                            <CheckCircle2 className="size-4" /> Приключи турнира
                          </Button>
                        )}
                    </div>
                  </div>

                  <div className="p-8 pt-0">
                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 text-center">
                              #
                            </TableHead>
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
                                {getMedalEmoji(idx, s.wins)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {s.name}
                              </TableCell>
                              <TableCell className="text-center">
                                {s.played}
                              </TableCell>
                              <TableCell className="text-center font-medium text-emerald-600">
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
                          className={`flex flex-col gap-4 p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900 ${idx === 0 && s.played > 0 ? "bg-yellow-50/50 dark:bg-yellow-900/5" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 shrink-0 text-center text-2xl font-light">
                                {getMedalEmoji(idx, s.wins)}
                              </div>
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                {s.name}
                              </span>
                            </div>
                            <Badge
                              variant={
                                idx === 0 && s.played > 0
                                  ? "default"
                                  : "secondary"
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
