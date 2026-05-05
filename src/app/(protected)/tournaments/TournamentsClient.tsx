"use client";

import { useState, useMemo } from "react";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Trophy,
  Calendar,
  MapPin,
  Plus,
  Users,
  LayoutList,
  Pencil,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TournamentsClientProps {
  initialTournaments: Tournament[];
}

export default function TournamentsClient({
  initialTournaments,
}: TournamentsClientProps) {
  const [tournaments, setTournaments] =
    useState<Tournament[]>(initialTournaments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const refreshTournaments = async () => {
    try {
      const data = await tournamentService.getTournaments();
      setTournaments(data);
    } catch (error) {
      toast.error("Грешка при опресняване");
    }
  };

  const handleSave = async (data: any) => {
    try {
      await tournamentService.createTournament(data);
      toast.success("Турнирът е създаден успешно!");
      setIsDialogOpen(false);
      refreshTournaments();
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
      refreshTournaments();
    } catch (error) {
      toast.error("Грешка при обновяване");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този турнир?")) return;
    try {
      await tournamentService.deleteTournament(id);
      toast.success("Турнирът е изтрит.");
      refreshTournaments();
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tournaments, searchTerm]);

  const activeTournaments = filteredTournaments.filter(
    (t) => t.status !== "completed"
  );
  const completedTournaments = filteredTournaments.filter(
    (t) => t.status === "completed"
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Bento */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12 lg:col-span-8 p-8 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600">
              <Trophy className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Турнири</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Организирайте и управлявайте спортни събития, схеми на игра и
            класирания за всички категории.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Търсене на турнир..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200"
              />
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-xl shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" /> Нов турнир
            </Button>
          </div>
        </div>

        <div className="md:col-span-6 lg:col-span-2 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-3xl font-bold text-emerald-600">
            {activeTournaments.length}
          </span>
          <span className="text-xs text-emerald-600/70 font-medium uppercase tracking-wider">
            Активни
          </span>
        </div>

        <div className="md:col-span-6 lg:col-span-2 p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-3xl font-bold text-slate-600">
            {completedTournaments.length}
          </span>
          <span className="text-xs text-slate-600/70 font-medium uppercase tracking-wider">
            Приключили
          </span>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>Нов турнир</DialogTitle>
          </DialogHeader>
          <TournamentForm
            onSave={handleSave}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTournament}
        onOpenChange={(open) => !open && setEditingTournament(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle>Редактиране на турнир</DialogTitle>
          </DialogHeader>
          <TournamentForm
            onSave={handleUpdate}
            onClose={() => setEditingTournament(null)}
            initialData={editingTournament ?? undefined}
          />
        </DialogContent>
      </Dialog>

      {tournaments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed rounded-3xl">
          <div className="rounded-full bg-slate-100 p-6 mb-6">
            <Trophy className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-semibold">Няма създадени турнири</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mb-8">
            Започнете, като създадете първия турнир за вашия клуб.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="rounded-xl"
          >
            Създай първия турнир
          </Button>
        </Card>
      ) : (
        <div className="space-y-12">
          {activeTournaments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Активни турнири
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    onEdit={() => setEditingTournament(t)}
                    onDelete={() => handleDelete(t.id!)}
                  />
                ))}
              </div>
            </div>
          )}

          {completedTournaments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2 px-1">
                <CheckCircle2 className="h-5 w-5" /> Приключили турнири
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 grayscale-[0.3]">
                {completedTournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    onEdit={() => setEditingTournament(t)}
                    onDelete={() => handleDelete(t.id!)}
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
  onDelete,
}: {
  tournament: Tournament;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50 rounded-lg">
            Предстоящ
          </Badge>
        );
      case "registration_open":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg">
            Отворено записване
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50 rounded-lg">
            В ход
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="rounded-lg">
            Приключил
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-3">
          {getStatusBadge(tournament.status)}
          <Badge
            variant="secondary"
            className="font-medium text-[10px] uppercase tracking-wider rounded-lg"
          >
            {tournament.format === "berger"
              ? "Бергер"
              : tournament.format === "knockout"
                ? "Елиминация"
                : "Микс"}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {tournament.title}
        </CardTitle>
        <CardDescription className="flex items-center mt-2 text-slate-500">
          <MapPin className="mr-1 h-3 w-3" /> {tournament.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-slate-600">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            <span>{format(new Date(tournament.startDate), "dd.MM.yyyy")}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Users className="mr-2 h-4 w-4 text-slate-400" />
            <span>{tournament.categories?.length || 0} категории</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-tighter"
            >
              {cat === "singles"
                ? "Единично"
                : cat === "doubles"
                  ? "Двойки"
                  : "Смесени"}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-slate-50 flex gap-2 p-4">
        <Button
          asChild
          className="flex-1 rounded-xl shadow-sm"
          variant="default"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-2 h-4 w-4" /> Преглед
          </Link>
        </Button>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            className="rounded-xl hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
