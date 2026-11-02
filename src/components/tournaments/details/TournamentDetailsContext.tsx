"use client";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { syncRankingsAction } from "@/lib/actions/rankings";
import { formatDateShort } from "@/lib/date-utils";
import { generateExcelReport, generatePdfReport } from "@/lib/export-utils";
import { generateBergerMatches } from "@/lib/match-generator";
import { getAllMembers } from "@/services/member-service";
import { tournamentService } from "@/services/tournament-service";
import { Member } from "@/types/member.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

export interface InitialTournamentData {
  tournament: Tournament | null;
  entries: TournamentEntry[];
  matches: Match[];
  membersDict: Record<string, Member>;
}

export interface Standing {
  entryId: string;
  name: string;
  played: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

interface TournamentDetailsContextType {
  tournamentId: string;
  tournament: Tournament | null;
  entries: TournamentEntry[];
  matches: Match[];
  membersDict: Record<string, Member>;
  mounted: boolean;
  isLoading: boolean;
  isNotFound: boolean;
  isGenerating: boolean;
  isEntryDialogOpen: boolean;
  setIsEntryDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedMatch: Match | null;
  setSelectedMatch: (match: Match | null) => void;
  loadData: () => Promise<void>;
  handleGenerateMatches: () => Promise<void>;
  handleSaveEntry: (data: TournamentEntry | TournamentEntry[]) => Promise<void>;
  handleUpdateTournament: (data: Partial<Tournament>) => Promise<void>;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  handleSaveScore: (
    matchId: string,
    score: string,
    winnerEntryId: string
  ) => Promise<void>;
  handleCompleteTournament: () => Promise<void>;
  handleExport: (
    formatType: "excel" | "pdf",
    category: string,
    standings: Standing[]
  ) => Promise<void>;
  getPlayerName: (memberId?: string, externalName?: string) => string;
  getEntryNameById: (entryId?: string | null) => string;
  getCategoryName: (cat: string) => string;
  getMedalEmoji: (idx: number, wins: number) => React.ReactNode;
}

const TournamentDetailsContext =
  createContext<TournamentDetailsContextType | null>(null);

export function TournamentDetailsProvider({
  tournamentId,
  initialData,
  children,
}: {
  tournamentId: string;
  initialData: InitialTournamentData;
  children: React.ReactNode;
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
  const [isLoading, setIsLoading] = useState(!initialData.tournament);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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
        setIsNotFound(true);
        return;
      }

      setIsNotFound(false);
      const dict: Record<string, Member> = {};
      membersData.forEach((m) => {
        if (m.id) dict[m.id] = m;
      });

      setTournament(tournData);

      // Sort entries by registration date client-side
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
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

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

  const getCategoryName = useCallback((cat: string) => {
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
  }, []);

  const getMedalEmoji = useCallback((idx: number, wins: number) => {
    if (wins === 0) return idx + 1;
    if (idx === 0) return <span className="text-yellow-500">🥇</span>;
    if (idx === 1) return <span>🥈</span>;
    if (idx === 2) return <span>🥉</span>;
    return idx + 1;
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
      ) {
        return;
      }
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
      router.push(`/tournaments/${tournamentId}/bracket`);
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
    ) {
      return;
    }
    try {
      await tournamentService.deleteTournamentEntry(entryId);
      toast.success("Участникът е премахнат.");
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      toast.error("Грешка при изтриване");
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament?.id) return;
    try {
      await tournamentService.updateTournament(tournament.id, {
        status: "completed",
      });
      toast.success("Турнирът е успешно приключен!");

      // Auto-sync rankings
      if (tournament.countsForRanking) {
        const syncResult = await syncRankingsAction();
        if (syncResult.success) {
          toast.success("Точките за ранкинг бяха автоматично обновени!");
        } else {
          toast.error("Грешка при автоматичното обновяване на ранкинга.");
        }
      }

      await loadData();
    } catch {
      toast.error("Грешка при приключване");
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

      // Check if all matches completed
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

  const handleExport = async (
    formatType: "excel" | "pdf",
    category: string,
    standings: Standing[]
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

  return (
    <TournamentDetailsContext.Provider
      value={{
        tournamentId,
        tournament,
        entries,
        matches,
        membersDict,
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
        loadData,
        handleGenerateMatches,
        handleSaveEntry,
        handleUpdateTournament,
        handleDeleteEntry,
        handleSaveScore,
        handleCompleteTournament,
        handleExport,
        getPlayerName,
        getEntryNameById,
        getCategoryName,
        getMedalEmoji,
      }}
    >
      {children}
    </TournamentDetailsContext.Provider>
  );
}

export function useTournamentDetailsContext() {
  const context = useContext(TournamentDetailsContext);
  if (!context) {
    throw new Error(
      "useTournamentDetailsContext must be used within a TournamentDetailsProvider"
    );
  }
  return context;
}
