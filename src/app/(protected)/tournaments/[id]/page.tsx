"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tournamentService } from "@/services/tournament-service";
import { Tournament, TournamentEntry, Match } from "@/types/tournament.types";
import { generateBergerMatches } from "@/lib/match-generator";
import { EntryForm } from "@/components/tournaments/entry-form";
import { ScoreDialog } from "@/components/tournaments/score-dialog";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, UserPlus, Trash2, Calendar, MapPin, Trophy, ShieldAlert, CheckCircle2, Pencil, FileDown, Download, Users, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { exportToExcel, exportToPdf, type ExportRow } from "@/lib/export-utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState("participants");

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tournData, entriesData, matchesData, membersData] = await Promise.all([
        tournamentService.getTournamentById(tournamentId),
        tournamentService.getTournamentEntries(tournamentId),
        tournamentService.getTournamentMatches(tournamentId),
        getAllMembers()
      ]);

      if (!tournData) {
        toast.error("Турнирът не е намерен!");
        router.push("/tournaments");
        return;
      }

      const dict: Record<string, Member> = {};
      membersData.forEach(m => {
        if (m.id) dict[m.id] = m;
      });

      setTournament(tournData);
      
      const sortedEntries = entriesData.sort((a, b) => {
        if (!a.registrationDate) return 1;
        if (!b.registrationDate) return -1;
        return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      });
      setEntries(sortedEntries);
      
      setMatches(matchesData);
      setMembersDict(dict);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при зареждане на данните");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!tournament) return;
    if (entries.length < 2) {
      toast.error("Нужни са поне 2 участника за генериране на схема.");
      return;
    }
    
    if (matches.length > 0) {
      if (!confirm("Вече има генерирани мачове. Искате ли да ги изтриете и да генерирате нови? Всички въведени резултати ще бъдат загубени!")) return;
    }
    
    setIsGenerating(true);
    try {
      if (matches.length > 0) {
        await tournamentService.deleteMatchesByTournament(tournamentId);
      }
      
      let allNewMatches: Omit<Match, "id">[] = [];
      
      tournament.categories.forEach(cat => {
        const catEntries = entries.filter(e => e.categoryId === cat);
        const newMatches = generateBergerMatches(tournamentId, cat as any, catEntries);
        allNewMatches = [...allNewMatches, ...newMatches];
      });
      
      if (allNewMatches.length === 0) {
        toast.error("Няма достатъчно участници в отделните категории за мачове.");
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

  const handleSaveEntry = async (data: any | any[]) => {
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

  const handleUpdateTournament = async (data: any) => {
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
    if (!confirm("Сигурни ли сте, че искате да изтриете този участник от турнира?")) return;
    try {
      await tournamentService.deleteTournamentEntry(entryId);
      toast.success("Участникът е премахнат.");
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  const getPlayerName = (memberId?: string, externalName?: string) => {
    if (externalName) return `${externalName} (Гост)`;
    if (memberId && membersDict[memberId]) {
      const m = membersDict[memberId];
      return `${m.firstName} ${m.lastName}`;
    }
    return "Неизвестен";
  };

  const getCategoryName = (cat: string) => {
    switch(cat) {
      case "singles": return "Единично";
      case "doubles": return "Двойки";
      case "mixed": return "Смесени двойки";
      default: return cat;
    }
  };

  const handleSaveScore = async (matchId: string, score: string, winnerEntryId: string) => {
    try {
      await tournamentService.updateMatchScore(matchId, { score, winnerEntryId });
      toast.success("Резултатът е записан!");
      setSelectedMatch(null);
      await loadData();
      
      const updatedMatches = await tournamentService.getTournamentMatches(tournamentId);
      const allCompleted = updatedMatches.length > 0 && updatedMatches.every(m => m.status === "completed");
      
      if (allCompleted && tournament?.status !== "completed") {
        const shouldComplete = confirm("Всички срещи в турнира са изиграни! Желаете ли да приключите турнира официално?");
        if (shouldComplete) {
          await handleCompleteTournament();
        }
      }
    } catch (error) {
      toast.error("Грешка при записване");
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament?.id) return;
    try {
      await tournamentService.updateTournament(tournament.id, { status: "completed" });
      toast.success("Турнирът е успешно приключен!");
      await loadData();
    } catch (error) {
      toast.error("Грешка при приключване");
    }
  };

  const handleExport = async (formatType: "excel" | "pdf", category: string, standings: any[]) => {
    if (!tournament) return;
    
    const rows: ExportRow[] = standings.map((s, idx) => ({
      position: idx + 1,
      name: s.name || getEntryNameById(s.entryId),
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      pointsRatio: `${s.gamesWon}:${s.gamesLost}`,
      winRate: s.played > 0 ? `${Math.round((s.wins / s.played) * 100)}%` : "0%",
      totalPoints: s.points,
    }));

    const options = {
      title: tournament.title,
      subtitle: `${format(new Date(tournament.startDate), "dd.MM.yyyy")} - ${tournament.location}`,
      category: category === "singles" ? "Единично" : category === "doubles" ? "Двойки" : "Смесени",
      rows,
    };

    if (formatType === "excel") await exportToExcel(options);
    else await exportToPdf(options);
  };

  const getEntryNameById = (entryId?: string | null) => {
    if (!entryId) return "Почива (BYE)";
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return "Неизвестен";
    const p1 = getPlayerName(entry.memberId, entry.externalName);
    if (entry.categoryId === "doubles" || entry.categoryId === "mixed") {
      const p2 = getPlayerName(entry.partnerMemberId, entry.partnerExternalName);
      return `${p1} / ${p2}`;
    }
    return p1;
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-48"><LoadingSpinner size={48} /><p className="mt-4 text-muted-foreground font-bold font-heading">Зареждане на турнира...</p></div>;
  if (!tournament) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Button variant="outline" size="icon" asChild className="h-12 w-12 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
            <Link href="/tournaments">
              <ArrowLeft className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-heading text-zinc-900 dark:text-white">{tournament.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground font-bold">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-500" /> {format(new Date(tournament.startDate), "dd.MM.yyyy")}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-red-500" /> {tournament.location}</span>
              <Badge variant={tournament.status === "completed" ? "secondary" : "default"} className="ml-2 rounded-lg font-black uppercase text-[10px] tracking-widest px-3">
                {tournament.status === "completed" ? "Приключен" : "В ход"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="flex-1 md:flex-none h-12 px-6 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
            <Pencil className="mr-2 h-4 w-4 text-zinc-400" /> Редактирай
          </Button>
          <Button onClick={() => setIsEntryDialogOpen(true)} className="flex-1 md:flex-none h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold">
            <UserPlus className="mr-2 h-4 w-4" /> Запиши
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Участници", value: entries.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
          { label: "Общо мачове", value: matches.length, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
          { label: "Изиграни", value: matches.filter(m => m.status === "completed").length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
          { label: "Категории", value: tournament.categories.length, icon: ShieldAlert, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black font-heading text-zinc-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 h-12 border border-zinc-200 dark:border-zinc-700 mb-0">
            <TabsTrigger value="participants" className="rounded-xl px-8 h-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-black font-heading transition-all">Участници</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-xl px-8 h-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-black font-heading transition-all">Схема и Мачове</TabsTrigger>
            <TabsTrigger value="results" className="rounded-xl px-8 h-10 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 font-black font-heading transition-all">Резултати</TabsTrigger>
          </TabsList>
          
          <TabsContent value="participants" className="mt-8 space-y-6">
            <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/80">
                  <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-800">
                    <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest pl-8 py-5">Категория</TableHead>
                    <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Участник 1</TableHead>
                    <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Участник 2 / Партньор</TableHead>
                    <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5 text-right pr-8">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Users className="h-16 w-16" />
                          <h3 className="text-xl font-black font-heading">Няма записани участници</h3>
                          <p className="max-w-xs mx-auto font-medium">Започнете, като добавите първия участник за турнира.</p>
                          <Button onClick={() => setIsEntryDialogOpen(true)} className="mt-4 rounded-xl font-bold bg-blue-600">
                            <PlusCircle className="mr-2 h-4 w-4" /> Запиши участник
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <Badge variant="outline" className="rounded-xl px-3 py-1 border-zinc-200 dark:border-zinc-700 font-black text-[10px] uppercase tracking-tighter">
                            {getCategoryName(entry.categoryId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black text-sm">
                              {getPlayerName(entry.memberId, entry.externalName).charAt(0)}
                            </div>
                            <span className="font-black text-zinc-900 dark:text-zinc-100 font-heading">{getPlayerName(entry.memberId, entry.externalName)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          {(entry.categoryId === "doubles" || entry.categoryId === "mixed") ? (
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-sm">
                                {getPlayerName(entry.partnerMemberId, entry.partnerExternalName).charAt(0)}
                              </div>
                              <span className="font-black text-zinc-900 dark:text-zinc-100 font-heading">{getPlayerName(entry.partnerMemberId, entry.partnerExternalName)}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic font-medium">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-5 text-right pr-8">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-colors"
                            onClick={() => handleDeleteEntry(entry.id!)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-8 space-y-10">
            <div className="flex justify-between items-center px-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black font-heading text-zinc-900 dark:text-white">Схема на срещите</h2>
                <p className="text-muted-foreground font-medium">Система Бергер за всяка от категориите.</p>
              </div>
              <Button 
                onClick={handleGenerateMatches} 
                disabled={isGenerating || entries.length < 2}
                variant={matches.length > 0 ? "outline" : "default"}
                className={cn(
                  "h-12 px-8 rounded-2xl font-bold transition-all",
                  matches.length > 0 ? "border-zinc-200 dark:border-zinc-800" : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                )}
              >
                <Trophy className="mr-2 h-5 w-5" />
                {matches.length > 0 ? "Прегенерирай схемата" : "Генерирай мачове"}
              </Button>
            </div>

            {matches.length === 0 ? (
              <div className="py-32 text-center bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <Trophy className="mx-auto h-20 w-20 mb-6 text-zinc-200 dark:text-zinc-800" />
                <h3 className="text-2xl font-black font-heading">Очаква се генериране</h3>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium mt-2">Мачовете ще могат да се генерират автоматично, когато всички участници са записани в системата.</p>
              </div>
            ) : (
              <div className="grid gap-16">
                {tournament.categories.map(cat => {
                  const catMatches = matches.filter(m => m.categoryId === cat);
                  if (catMatches.length === 0) return null;
                  
                  const pendingMatches = catMatches
                    .filter(m => m.status !== "completed")
                    .sort((a, b) => (a.round || 0) - (b.round || 0));
                  const completedMatches = catMatches
                    .filter(m => m.status === "completed")
                    .sort((a, b) => (a.round || 0) - (b.round || 0));
                  
                  return (
                    <div key={cat} className="space-y-8">
                      <div className="flex items-center gap-6">
                        <Badge className="h-10 px-6 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black text-xs uppercase tracking-widest shadow-xl">
                          {getCategoryName(cat)}
                        </Badge>
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      
                      {/* Предстоящи мачове */}
                      {pendingMatches.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center px-4">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-3 animate-pulse" />
                            Предстоящи срещи
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {pendingMatches.map(match => (
                              <Card key={match.id} className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all bg-white dark:bg-zinc-900 overflow-hidden group">
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Кръг {match.round}</span>
                                  <Badge variant="outline" className="text-[9px] rounded-lg border-zinc-200 dark:border-zinc-700 text-zinc-400">
                                    {match.stage || "Групова фаза"}
                                  </Badge>
                                </div>
                                <CardContent className="p-6 space-y-5">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                      <span className="font-black font-heading text-sm truncate">{getEntryNameById(match.player1EntryId)}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700">VS</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                                      <span className="font-black font-heading text-sm truncate">{getEntryNameById(match.player2EntryId)}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => setSelectedMatch(match)}
                                    className="w-full h-10 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black text-xs uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"
                                  >
                                    Резултат
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Изиграни мачове */}
                      {completedMatches.length > 0 && (
                        <div className="space-y-6 opacity-80">
                          <h4 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center px-4">
                            <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" />
                            Завършени срещи
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {completedMatches.map(match => (
                              <Card key={match.id} className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden">
                                <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Изигран</span>
                                  <span className="text-[10px] font-bold text-zinc-400">Кръг {match.round}</span>
                                </div>
                                <CardContent className="p-6 space-y-5">
                                  <div className="space-y-4">
                                    <div className={cn("flex items-center justify-between gap-3", match.winnerEntryId === match.player1EntryId ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-zinc-500 opacity-60")}>
                                      <div className="flex items-center gap-2 truncate">
                                        {match.winnerEntryId === match.player1EntryId && <Trophy className="h-3 w-3 flex-shrink-0" />}
                                        <span className="text-sm font-heading truncate">{getEntryNameById(match.player1EntryId)}</span>
                                      </div>
                                    </div>
                                    <div className={cn("flex items-center justify-between gap-3", match.winnerEntryId === match.player2EntryId ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-zinc-500 opacity-60")}>
                                      <div className="flex items-center gap-2 truncate">
                                        {match.winnerEntryId === match.player2EntryId && <Trophy className="h-3 w-3 flex-shrink-0" />}
                                        <span className="text-sm font-heading truncate">{getEntryNameById(match.player2EntryId)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="text-lg font-black font-heading text-zinc-900 dark:text-white tracking-widest">{match.score}</div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(match)} className="h-8 rounded-xl font-bold text-[10px] uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800">Редактирай</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-8 space-y-12">
            {tournament.categories.map(cat => {
              const catEntries = entries.filter(e => e.categoryId === cat);
              const catMatches = matches.filter(m => m.categoryId === cat && m.status === "completed");
              
              if (catEntries.length === 0) return null;

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
              catEntries.forEach(e => {
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

              catMatches.forEach(m => {
                if (!m.player1EntryId || !m.player2EntryId || !m.winnerEntryId) return;
                
                const p1 = standingsMap[m.player1EntryId];
                const p2 = standingsMap[m.player2EntryId];
                if (!p1 || !p2) return;

                p1.played++;
                p2.played++;

                if (m.score) {
                  m.score.split(",").forEach(s => {
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
                <div key={cat} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black font-heading text-zinc-900 dark:text-white">Класиране: {getCategoryName(cat)}</h3>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{catMatches.length} / {matches.filter(m => m.categoryId === cat).length} срещи изиграни</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => handleExport("excel", cat, standings)} className="h-10 rounded-xl gap-2 font-bold border-zinc-200 dark:border-zinc-800">
                        <FileDown className="h-4 w-4 text-emerald-600" /> Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport("pdf", cat, standings)} className="h-10 rounded-xl gap-2 font-bold border-zinc-200 dark:border-zinc-800">
                        <Download className="h-4 w-4 text-red-600" /> PDF
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/80">
                        <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-800">
                          <TableHead className="w-16 text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">#</TableHead>
                          <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Участник</TableHead>
                          <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">М</TableHead>
                          <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">П</TableHead>
                          <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">З</TableHead>
                          <TableHead className="text-center font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5">Рез.</TableHead>
                          <TableHead className="text-right font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-5 pr-8">Точки</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((s, idx) => (
                          <TableRow key={s.entryId} className={cn("border-zinc-100 dark:border-zinc-800 transition-colors", idx === 0 && s.played > 0 ? "bg-amber-50/30 dark:bg-amber-900/5" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50")}>
                            <TableCell className="text-center py-5">
                              <span className={cn(
                                "flex items-center justify-center h-10 w-10 mx-auto rounded-xl font-black text-sm",
                                idx === 0 && s.wins > 0 ? "bg-amber-100 text-amber-700 shadow-sm" : 
                                idx === 1 && s.wins > 0 ? "bg-zinc-100 text-zinc-600 shadow-sm" :
                                idx === 2 && s.wins > 0 ? "bg-orange-100 text-orange-700 shadow-sm" : "text-zinc-400"
                              )}>
                                {idx === 0 && s.wins > 0 ? "🥇" : idx === 1 && s.wins > 0 ? "🥈" : idx === 2 && s.wins > 0 ? "🥉" : idx + 1}
                              </span>
                            </TableCell>
                            <TableCell className="py-5 font-black font-heading text-zinc-900 dark:text-white">{s.name}</TableCell>
                            <TableCell className="text-center py-5 font-bold text-zinc-500">{s.played}</TableCell>
                            <TableCell className="text-center py-5 font-black text-emerald-600">{s.wins}</TableCell>
                            <TableCell className="text-center py-5 font-black text-red-600">{s.losses}</TableCell>
                            <TableCell className="text-center py-5">
                              <Badge variant="outline" className="rounded-lg font-mono text-xs px-2 py-0.5 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                                {s.gamesWon}:{s.gamesLost}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-5 pr-8">
                              <Badge className={cn(
                                "rounded-xl px-4 py-1 font-black text-base shadow-sm",
                                idx === 0 && s.played > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                              )}>
                                {s.points}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black font-heading">Записване за турнира</DialogTitle>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black font-heading text-center">Редактиране на турнир</DialogTitle>
          </DialogHeader>
          <TournamentForm
            onSave={handleUpdateTournament}
            onClose={() => setIsEditDialogOpen(false)}
            initialData={tournament}
          />
        </DialogContent>
      </Dialog>
      
      <ScoreDialog 
        isOpen={!!selectedMatch}
        match={selectedMatch}
        matchFormatId={tournament.matchFormatId}
        getEntryName={getEntryNameById}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSaveScore}
      />
    </div>
  );
}
