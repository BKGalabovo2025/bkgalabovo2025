"use client";

import { useState, useEffect } from "react";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Trophy, Calendar, MapPin, Plus, Users, LayoutList, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getTournaments();
      setTournaments(data);
    } catch (error) {
      toast.error("Грешка при зареждане на турнирите");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSave = async (data: any) => {
    try {
      await tournamentService.createTournament(data);
      toast.success("Турнирът е създаден успешно!");
      fetchTournaments();
    } catch (error) {
      toast.error("Неуспешно създаване на турнир");
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingTournament?.id) return;
    try {
      await tournamentService.updateTournament(editingTournament.id, data);
      toast.success("Турнирът е обновен успешно!");
      setEditingTournament(null);
      fetchTournaments();
    } catch (error) {
      toast.error("Грешка при обновяване");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този турнир? Всички участници и мачове ще бъдат загубени!")) return;
    try {
      await tournamentService.deleteTournament(id);
      toast.success("Турнирът е изтрит.");
      fetchTournaments();
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight font-heading text-zinc-900 dark:text-white flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Турнири
          </h1>
          <p className="text-muted-foreground text-lg">
            Управление на състезания, схеми и участници в клуба.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
          <Plus className="mr-2 h-5 w-5" /> Създай турнир
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Нов турнир</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <TournamentForm 
              onSave={handleSave} 
              onClose={() => setIsDialogOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTournament} onOpenChange={(open) => !open && setEditingTournament(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Редактиране на турнир</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <TournamentForm 
              onSave={handleUpdate}
              onClose={() => setEditingTournament(null)}
              initialData={editingTournament ?? undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Trophy className="h-12 w-12 text-zinc-200 animate-pulse mb-4" />
          <p className="text-zinc-500 font-medium font-heading">Зареждане на турнирите...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white dark:bg-zinc-800 p-6 shadow-sm mb-6">
            <Trophy className="h-10 w-10 text-zinc-300" />
          </div>
          <h3 className="text-2xl font-bold font-heading">Няма създадени турнири</h3>
          <p className="text-muted-foreground mt-3 max-w-sm mb-8 text-lg">
            Организирайте първото си състезание още сега и зарадвайте членовете на клуба.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl h-12 px-8 border-zinc-200 hover:bg-white transition-all">
            <Plus className="mr-2 h-4 w-4" /> Създай първия турнир
          </Button>
        </Card>
      ) : (
        <div className="space-y-16">
          {/* Активни турнири */}
          {tournaments.filter(t => t.status !== "completed").length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-blue-600 rounded-full" />
                <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
                  Активни турнири
                </h2>
                <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  {tournaments.filter(t => t.status !== "completed").length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tournaments.filter(t => t.status !== "completed").map((tournament) => (
                  <TournamentCard 
                    key={tournament.id} 
                    tournament={tournament} 
                    onEdit={() => setEditingTournament(tournament)}
                    onDelete={() => handleDelete(tournament.id!)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Приключили турнири */}
          {tournaments.filter(t => t.status === "completed").length > 0 && (
            <div className="space-y-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-zinc-400 rounded-full" />
                <h2 className="text-2xl font-bold font-heading text-zinc-500 flex items-center gap-2">
                  Приключили турнири
                </h2>
                <Badge variant="outline" className="rounded-full bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                  {tournaments.filter(t => t.status === "completed").length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-70 hover:opacity-100 transition-opacity">
                {tournaments.filter(t => t.status === "completed").map((tournament) => (
                  <TournamentCard 
                    key={tournament.id} 
                    tournament={tournament} 
                    onEdit={() => setEditingTournament(tournament)}
                    onDelete={() => handleDelete(tournament.id!)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TournamentCard({ 
  tournament, 
  onEdit, 
  onDelete 
}: { 
  tournament: Tournament; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming": return <Badge variant="secondary" className="rounded-full px-3 py-0.5">Предстоящ</Badge>;
      case "registration_open": return <Badge className="rounded-full px-3 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">Отворено записване</Badge>;
      case "ongoing": return <Badge className="rounded-full px-3 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none animate-pulse">В ход</Badge>;
      case "completed": return <Badge variant="outline" className="rounded-full px-3 py-0.5 border-zinc-200 dark:border-zinc-700 text-zinc-500">Приключил</Badge>;
      default: return null;
    }
  };

  const getFormatName = (format: string) => {
    switch(format) {
      case "berger": return "Система Бергер";
      case "knockout": return "Елиминация";
      case "mixed": return "Групи + Елиминация";
      default: return format;
    }
  };

  const getCategoryName = (cat: string) => {
    switch(cat) {
      case "singles": return "Единично";
      case "doubles": return "Двойки";
      case "mixed": return "Смесени";
      default: return cat;
    }
  };

  return (
    <Card className="flex flex-col group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-lg shadow-zinc-200/50 dark:shadow-none">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex justify-between items-center">
          {getStatusBadge(tournament.status)}
          <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-tighter border-zinc-200 dark:border-zinc-800 text-zinc-400">
            {getFormatName(tournament.format)}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 leading-tight font-heading text-xl group-hover:text-blue-600 transition-colors">
          {tournament.title}
        </CardTitle>
        <div className="flex items-center text-zinc-500 text-sm font-medium">
          <MapPin className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> 
          {tournament.location}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Период
            </p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {format(new Date(tournament.startDate), "dd.MM")} - {format(new Date(tournament.endDate), "dd.MM.yy")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3" /> Категории
            </p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {tournament.categories?.length || 0} дисциплини
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tournament.categories?.slice(0, 3).map(cat => (
            <span key={cat} className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg">
              {getCategoryName(cat)}
            </span>
          ))}
          {(tournament.categories?.length || 0) > 3 && (
            <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg">
              +{(tournament.categories?.length || 0) - 3}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
        <Button asChild className="flex-1 rounded-xl h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all" variant="outline">
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-2 h-4 w-4" /> Управление
          </Link>
        </Button>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="rounded-xl h-11 w-11 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4 text-zinc-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-11 w-11 hover:bg-red-50 text-red-400 hover:text-red-600 dark:hover:bg-red-900/20"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
