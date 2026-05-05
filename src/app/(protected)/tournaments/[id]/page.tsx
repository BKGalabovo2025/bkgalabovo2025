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
import { ArrowLeft, UserPlus, Trash2, Calendar, MapPin, Trophy, ShieldAlert, CheckCircle2, Pencil, FileDown, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { exportToExcel, exportToPdf, type ExportRow } from "@/lib/export-utils";

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
      
      // Sort entries by registration date (client-side) to avoid missing index errors in Firestore
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

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

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
      
      // Generate matches per category
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
      
      // Проверка дали всички мачове са приключили
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

  if (loading) return <div className="p-12 text-center">Зареждане на детайли...</div>;
  if (!tournament) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{tournament.title}</h1>
          <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {format(new Date(tournament.startDate), "dd.MM.yyyy")}</span>
            <span>&bull;</span>
            <span className="flex items-center"><MapPin className="mr-1 h-3 w-3" /> {tournament.location}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Редактирай турнира
        </Button>
      </div>

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
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="participants">Участници ({entries.length})</TabsTrigger>
          <TabsTrigger value="matches">Схема/Мачове ({matches.length})</TabsTrigger>
          <TabsTrigger value="results">Резултати</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Списък с участници</CardTitle>
                <CardDescription>Всички регистрирани играчи за този турнир</CardDescription>
              </div>
              <Button onClick={() => setIsEntryDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Запиши участник
              </Button>
            </CardHeader>
            <CardContent>
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
                          <Badge variant="secondary">{getCategoryName(entry.categoryId)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getPlayerName(entry.memberId, entry.externalName)}
                        </TableCell>
                        <TableCell>
                          {(entry.categoryId === "doubles" || entry.categoryId === "mixed") ? 
                            getPlayerName(entry.partnerMemberId, entry.partnerExternalName) 
                            : <span className="text-muted-foreground">-</span>
                          }
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Генератор на мачове</CardTitle>
                <CardDescription>Схема на турнира (Система Бергер)</CardDescription>
              </div>
              <Button 
                onClick={handleGenerateMatches} 
                disabled={isGenerating || entries.length < 2}
                variant={matches.length > 0 ? "outline" : "default"}
              >
                <Trophy className="mr-2 h-4 w-4" />
                {matches.length > 0 ? "Прегенерирай схемата" : "Генерирай мачове"}
              </Button>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Trophy className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>Мачовете ще могат да се генерират, когато всички участници са записани.</p>
                </div>
              ) : (
                <div className="space-y-12">
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
                      <div key={cat} className="space-y-6">
                        <div className="bg-muted px-4 py-3 rounded-lg border flex items-center">
                          <h3 className="text-xl font-semibold uppercase tracking-wider">{getCategoryName(cat)}</h3>
                        </div>
                        
                        {/* Предстоящи мачове */}
                        {pendingMatches.length > 0 && (
                          <div className="ml-4">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center">
                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                              Предстоящи мачове ({pendingMatches.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {pendingMatches.map(match => (
                                <div key={match.id} className="border rounded-lg p-4 flex flex-col justify-between shadow-sm hover:border-primary/50 transition-colors bg-white dark:bg-zinc-950">
                                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <Badge variant="outline" className="text-[10px]">
                                      Кръг {match.round}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{match.stage}</span>
                                  </div>
                                  
                                  <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center font-medium">
                                      <span className="truncate pr-2">{getEntryNameById(match.player1EntryId)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">срещу</div>
                                    <div className="flex justify-between items-center font-medium">
                                      <span className="truncate pr-2">{getEntryNameById(match.player2EntryId)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-auto pt-3 border-t flex justify-end items-center">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="w-full"
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
                            <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                              Изиграни мачове ({completedMatches.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 opacity-80">
                              {completedMatches.map(match => (
                                <div key={match.id} className="border rounded-lg p-4 flex flex-col justify-between shadow-sm bg-muted/30">
                                  <div className="flex justify-between items-center mb-4 border-b pb-2 border-muted-foreground/20">
                                    <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                      Завършен
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">Кръг {match.round}</span>
                                  </div>
                                  
                                  <div className="space-y-3 mb-4">
                                    <div className={`flex justify-between items-center font-medium ${match.winnerEntryId === match.player1EntryId ? "text-green-600 dark:text-green-400" : ""}`}>
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        {match.winnerEntryId === match.player1EntryId && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                        <span className="truncate">{getEntryNameById(match.player1EntryId)}</span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground pl-2 border-l-2 border-muted-foreground/30">срещу</div>
                                    <div className={`flex justify-between items-center font-medium ${match.winnerEntryId === match.player2EntryId ? "text-green-600 dark:text-green-400" : ""}`}>
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        {match.winnerEntryId === match.player2EntryId && <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                                        <span className="truncate">{getEntryNameById(match.player2EntryId)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-auto pt-3 border-t border-muted-foreground/20 flex justify-between items-center">
                                    <div className="font-bold text-lg font-mono tracking-wider">
                                      {match.score}
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 px-2 text-xs"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {tournament.categories.map(cat => {
            const catEntries = entries.filter(e => e.categoryId === cat);
            const catMatches = matches.filter(m => m.categoryId === cat && m.status === "completed");
            
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

              // Парсираме геймове от резултата
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
              <Card key={cat} className="mb-6">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Класиране – {getCategoryName(cat)}
                      </CardTitle>
                      <CardDescription>
                        {catMatches.length} от {matches.filter(m => m.categoryId === cat).length} мача изиграни
                      </CardDescription>
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
                      {tournament.status !== "completed" && matches.filter(m => m.categoryId === cat).every(m => m.status === "completed") && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="h-8 gap-2 bg-green-600 hover:bg-green-700"
                          onClick={handleCompleteTournament}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Приключи турнира
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Участник</TableHead>
                        <TableHead className="text-center">Изиграни</TableHead>
                        <TableHead className="text-center text-green-600">Победи</TableHead>
                        <TableHead className="text-center text-destructive">Загуби</TableHead>
                        <TableHead className="text-center">Т. Разлика</TableHead>
                        <TableHead className="text-center font-bold">Точки</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((s, idx) => (
                        <TableRow
                          key={s.entryId}
                          className={idx === 0 && s.played > 0 ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}
                        >
                          <TableCell className="text-center font-bold">
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
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-center">{s.played}</TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">{s.wins}</TableCell>
                          <TableCell className="text-center text-destructive">{s.losses}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {s.gamesWon}:{s.gamesLost}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={idx === 0 && s.played > 0 ? "default" : "secondary"} className="font-bold">
                              {s.points}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {catMatches.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Все още няма изиграни мачове в тази категория.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
