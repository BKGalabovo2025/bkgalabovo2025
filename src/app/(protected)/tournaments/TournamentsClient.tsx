"use client";

import { useState, useMemo } from "react";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";

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
      <PageHeader
        title="Турнири"
        description="Организирайте и управлявайте спортни събития, схеми на игра и класирания."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Турнири" },
        ]}
      >
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-xl shadow-md font-bento"
        >
          <Plus className="mr-2 h-4 w-4" /> Нов турнир
        </Button>
      </PageHeader>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-6 border-b-4 border-b-yellow-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black">{activeTournaments.length}</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Активни
              </p>
            </div>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
        </BentoCard>
        <BentoCard className="p-6 border-b-4 border-b-slate-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black">
                {completedTournaments.length}
              </p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Приключили
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2 p-4 flex items-center px-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Търсене на турнир по име или локация..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-slate-50/50"
            />
          </div>
        </BentoCard>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-bento">
              Нов турнир
            </DialogTitle>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-bento">
              Редактиране
            </DialogTitle>
          </DialogHeader>
          <TournamentForm
            onSave={handleUpdate}
            onClose={() => setEditingTournament(null)}
            initialData={editingTournament ?? undefined}
          />
        </DialogContent>
      </Dialog>

      {tournaments.length === 0 ? (
        <BentoCard className="flex flex-col items-center justify-center py-32 text-center border-dashed">
          <div className="rounded-3xl bg-slate-100 p-8 mb-6">
            <Trophy className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black font-bento">
            Няма създадени турнири
          </h3>
          <p className="text-slate-500 mt-2 max-w-sm mb-8">
            Започнете, като създадете първия турнир за вашия клуб.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-xl h-12 px-8 font-bold shadow-lg"
          >
            Създай първия турнир
          </Button>
        </BentoCard>
      ) : (
        <div className="space-y-12">
          {activeTournaments.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                <h2 className="text-xl font-black font-bento uppercase tracking-tight">
                  Активни събития
                </h2>
              </div>
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
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <CheckCircle2 className="h-6 w-6 text-slate-400" />
                <h2 className="text-xl font-black font-bento text-slate-400 uppercase tracking-tight">
                  Архив
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
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
          <Badge className="bg-blue-100 text-blue-700 border-none rounded-lg font-bold text-[10px] uppercase">
            Предстоящ
          </Badge>
        );
      case "registration_open":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-lg font-bold text-[10px] uppercase">
            Записване
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="bg-rose-100 text-rose-700 border-none rounded-lg font-bold text-[10px] uppercase">
            В ход
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-slate-100 text-slate-500 border-none rounded-lg font-bold text-[10px] uppercase">
            Завършен
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <BentoCard className="flex flex-col h-full group hover:shadow-xl transition-all duration-500 overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          {getStatusBadge(tournament.status)}
          <Badge
            variant="outline"
            className="font-bold text-[9px] uppercase tracking-wider rounded-md border-slate-200"
          >
            {tournament.format === "berger"
              ? "Бергер"
              : tournament.format === "knockout"
                ? "Елиминация"
                : "Микс"}
          </Badge>
        </div>
        <h3 className="text-xl font-black font-bento leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {tournament.title}
        </h3>
        <div className="flex items-center mt-3 text-slate-400 text-xs font-medium">
          <MapPin className="mr-1.5 h-3.5 w-3.5" /> {tournament.location}
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Дата
            </p>
            <div className="flex items-center text-slate-700 font-bold text-sm">
              <Calendar className="mr-2 h-4 w-4 text-primary/60" />
              {format(new Date(tournament.startDate), "dd.MM.yyyy")}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Обхват
            </p>
            <div className="flex items-center text-slate-700 font-bold text-sm">
              <Users className="mr-2 h-4 w-4 text-primary/60" />
              {tournament.categories?.length || 0} катег.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-[9px] font-black bg-white border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase"
            >
              {cat === "singles"
                ? "Single"
                : cat === "doubles"
                  ? "Doubles"
                  : "Mixed"}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
        <Button
          asChild
          className="flex-1 rounded-xl font-bold h-10 shadow-sm"
          variant="default"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-2 h-4 w-4" /> Детайли
          </Link>
        </Button>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            className="rounded-xl h-10 w-10 border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
