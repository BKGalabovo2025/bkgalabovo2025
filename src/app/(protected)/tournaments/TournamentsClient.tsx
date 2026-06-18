"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { formatDateShort } from "@/lib/date-utils";
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
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";

interface TournamentsClientProps {
  initialTournaments: Tournament[];
}

export default function TournamentsClient({
  initialTournaments,
}: TournamentsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [tournaments, setTournaments] =
    useState<Tournament[]>(initialTournaments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshTournaments = useCallback(async () => {
    try {
      const data = await tournamentService.getTournaments();
      setTournaments(data);
    } catch {
      toast.error("Грешка при опресняване");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      refreshTournaments();
    }
  }, [mounted, refreshTournaments]);

  const handleSave = async (data: Tournament) => {
    try {
      await tournamentService.createTournament(data as Omit<Tournament, "id">);
      toast.success("Турнирът е създаден успешно!");
      setIsDialogOpen(false);
      refreshTournaments();
    } catch (error) {
      toast.error("Неуспешно създаване на турнир");
      throw error;
    }
  };

  const handleUpdate = async (data: Tournament) => {
    if (!editingTournament?.id) return;
    try {
      await tournamentService.updateTournament(
        editingTournament.id,
        data as Partial<Tournament>
      );
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
    } catch {
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

  if (!mounted) return null;

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
          className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-zinc-950 text-white hover:bg-zinc-800 shadow-none transition-all"
        >
          <Plus className="mr-3 h-4 w-4" strokeWidth={1.5} /> Нов турнир
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-4xl font-light text-zinc-900 dark:text-white mb-1">
                {activeTournaments.length}
              </p>
              <p className="text-[11px] text-zinc-400 uppercase font-medium tracking-widest">
                Активни
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <Trophy className="h-5 w-5" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-4xl font-light text-zinc-900 dark:text-white mb-1">
                {completedTournaments.length}
              </p>
              <p className="text-[11px] text-zinc-400 uppercase font-medium tracking-widest">
                Приключили
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2 p-4 flex items-center px-8">
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Търсене на турнир по име или локация..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
            />
          </div>
        </BentoCard>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-5xl shadow-2xl border-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light uppercase tracking-widest text-zinc-900 dark:text-white">
              Нов турнир
            </DialogTitle>
          </DialogHeader>
          {isDialogOpen && (
            <TournamentForm
              onSave={handleSave}
              onClose={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTournament}
        onOpenChange={(open) => !open && setEditingTournament(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-5xl shadow-2xl border-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light uppercase tracking-widest text-zinc-900 dark:text-white">
              Редактиране
            </DialogTitle>
          </DialogHeader>
          {editingTournament && (
            <TournamentForm
              onSave={handleUpdate}
              onClose={() => setEditingTournament(null)}
              initialData={editingTournament}
            />
          )}
        </DialogContent>
      </Dialog>

      {tournaments.length === 0 ? (
        <BentoCard className="flex flex-col items-center justify-center py-40 text-center border-dashed border-2 border-zinc-100 dark:border-zinc-900 rounded-5xl bg-zinc-50/30 dark:bg-zinc-900/10">
          <div className="h-32 w-32 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-10 transition-all hover:scale-105">
            <Trophy
              className="h-12 w-12 text-zinc-200 dark:text-zinc-700"
              strokeWidth={1}
            />
          </div>
          <h3 className="text-3xl font-light text-zinc-900 dark:text-white mb-4">
            Няма създадени турнири
          </h3>
          <p className="text-zinc-400 max-w-sm mb-12 font-light leading-relaxed">
            Започнете, като създадете първия турнир за вашия клуб.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-xl h-14 px-10 font-medium uppercase tracking-widest text-[11px] bg-zinc-950 text-white hover:bg-zinc-800 shadow-none transition-all"
          >
            Създай първия турнир
          </Button>
        </BentoCard>
      ) : (
        <div className="space-y-20">
          {activeTournaments.length > 0 && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                  Активни събития
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-1">
                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <h2 className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400">
                  Архив
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <Badge className="bg-primary/5 text-primary border border-primary/10 rounded-full font-medium text-[10px] uppercase tracking-wider px-3 py-1">
            Предстоящ
          </Badge>
        );
      case "registration_open":
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-medium text-[10px] uppercase tracking-wider px-3 py-1">
            Записване
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-medium text-[10px] uppercase tracking-wider px-3 py-1">
            В ход
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-full font-medium text-[10px] uppercase tracking-wider px-3 py-1">
            Завършен
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFormatLabel = (format: string) => {
    if (format === "berger") return "Бергер";
    if (format === "knockout") return "Елиминация";
    return "Микс";
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "singles") return "Singles";
    if (cat === "doubles") return "Doubles";
    return "Mixed";
  };

  return (
    <BentoCard className="flex flex-col h-full group hover:border-primary/30 transition-all duration-500 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl">
      <div className="p-8 pb-6">
        <div className="flex justify-between items-center mb-6">
          {getStatusBadge(tournament.status)}
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-300">
            {getFormatLabel(tournament.format || "")}
          </span>
        </div>
        <h3 className="text-2xl font-light text-zinc-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-16">
          {tournament.title}
        </h3>
        <div className="flex items-center mt-4 text-zinc-400 text-xs font-light tracking-wide">
          <MapPin className="mr-2 h-4 w-4" strokeWidth={1} />{" "}
          {tournament.location}
        </div>
      </div>

      <div className="px-8 py-6 bg-zinc-50/30 dark:bg-zinc-900/30 flex-1 border-y border-zinc-100/50 dark:border-zinc-900/50">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[11px] uppercase font-medium text-zinc-400 tracking-widest">
              Дата
            </p>
            <div className="flex items-center text-zinc-900 dark:text-zinc-100 font-light text-sm">
              <Calendar
                className="mr-3 h-4 w-4 text-primary/40"
                strokeWidth={1.5}
              />
              {formatDateShort(tournament.startDate)}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase font-medium text-zinc-400 tracking-widest">
              Категории
            </p>
            <div className="flex items-center text-zinc-900 dark:text-zinc-100 font-light text-sm">
              <Users
                className="mr-3 h-4 w-4 text-primary/40"
                strokeWidth={1.5}
              />
              {tournament.categories?.length || 0}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-[9px] font-medium bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-widest"
            >
              {getCategoryLabel(cat)}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6 flex gap-3 bg-white dark:bg-zinc-950 mt-auto border-t border-zinc-50 dark:border-zinc-900">
        <Button
          asChild
          className="flex-1 rounded-xl font-medium h-12 shadow-none uppercase tracking-widest text-[10px] bg-zinc-950 text-white hover:bg-zinc-800 transition-all"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-3 h-4 w-4" strokeWidth={1.5} /> Детайли
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            className="rounded-xl h-12 w-12 border-zinc-100 dark:border-zinc-800 text-zinc-600 hover:text-primary hover:border-primary/30 transition-all bg-zinc-50/30 dark:bg-zinc-900/30"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
