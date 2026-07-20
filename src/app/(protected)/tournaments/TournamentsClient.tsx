"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
import dynamic from "next/dynamic";
const TournamentForm = dynamic(() => import("@/components/tournaments/tournament-form").then(m => m.TournamentForm), { ssr: false });
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
    <div className="space-y-8 duration-500 animate-in fade-in">
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
          className="h-12 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
        >
          <Plus className="mr-3 size-4" strokeWidth={1.5} /> Нов турнир
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <BentoCard className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-4xl font-light text-zinc-900 dark:text-white">
                {activeTournaments.length}
              </p>
              <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Активни
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <Trophy className="size-5" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-4xl font-light text-zinc-900 dark:text-white">
                {completedTournaments.length}
              </p>
              <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Приключили
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900">
              <CheckCircle2 className="size-5" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="flex items-center p-4 px-8 md:col-span-2">
          <div className="relative w-full">
            <Search
              className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Търсене на турнир по име или локация..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 pl-12 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
            />
          </div>
        </BentoCard>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-5xl border-zinc-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-widest text-zinc-900 uppercase dark:text-white">
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-5xl border-zinc-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-widest text-zinc-900 uppercase dark:text-white">
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
        <BentoCard className="flex flex-col items-center justify-center rounded-5xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-40 text-center dark:border-zinc-900 dark:bg-zinc-900/10">
          <div className="mb-10 flex size-32 items-center justify-center rounded-full border border-zinc-100 bg-white transition-all hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
            <Trophy
              className="size-12 text-zinc-200 dark:text-zinc-700"
              strokeWidth={1}
            />
          </div>
          <h3 className="mb-4 text-3xl font-light text-zinc-900 dark:text-white">
            Няма създадени турнири
          </h3>
          <p className="mb-12 max-w-sm leading-relaxed font-light text-zinc-400">
            Започнете, като създадете първия турнир за вашия клуб.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-14 rounded-xl bg-zinc-950 px-10 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            Създай първия турнир
          </Button>
        </BentoCard>
      ) : (
        <div className="space-y-20">
          {activeTournaments.length > 0 && (
            <div className="space-y-10">
              <div className="flex items-center gap-4 px-1">
                <div className="size-2 animate-pulse rounded-full bg-primary" />
                <h2 className="text-sm font-medium tracking-[0.3em] text-zinc-400 uppercase">
                  Активни събития
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                <div className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <h2 className="text-sm font-medium tracking-[0.3em] text-zinc-400 uppercase">
                  Архив
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
          <Badge className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-medium tracking-wider text-primary uppercase">
            Предстоящ
          </Badge>
        );
      case "registration_open":
        return (
          <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
            Записване
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-medium tracking-wider text-rose-600 uppercase">
            В ход
          </Badge>
        );
      case "completed":
        return (
          <Badge className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
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
    <BentoCard className="group flex h-full flex-col overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none transition-all duration-500 hover:border-primary/30 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="p-8 pb-6">
        <div className="mb-6 flex items-center justify-between">
          {getStatusBadge(tournament.status)}
          <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-300 uppercase">
            {getFormatLabel(tournament.format || "")}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-16 text-2xl leading-tight font-light text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
          {tournament.title}
        </h3>
        <div className="mt-4 flex items-center text-xs font-light tracking-wide text-zinc-400">
          <MapPin className="mr-2 size-4" strokeWidth={1} />{" "}
          {tournament.location}
        </div>
      </div>

      <div className="flex-1 border-y border-zinc-100/50 bg-zinc-50/30 px-8 py-6 dark:border-zinc-900/50 dark:bg-zinc-900/30">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Дата
            </p>
            <div className="flex items-center text-sm font-light text-zinc-900 dark:text-zinc-100">
              <Calendar
                className="mr-3 size-4 text-primary/40"
                strokeWidth={1.5}
              />
              {formatDateShort(tournament.startDate)}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Категории
            </p>
            <div className="flex items-center text-sm font-light text-zinc-900 dark:text-zinc-100">
              <Users
                className="mr-3 size-4 text-primary/40"
                strokeWidth={1.5}
              />
              {tournament.categories?.length || 0}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-zinc-100 bg-white px-3 py-1 text-[9px] font-medium tracking-widest text-zinc-400 uppercase dark:border-zinc-800 dark:bg-zinc-900"
            >
              {getCategoryLabel(cat)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex gap-3 border-t border-zinc-50 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950">
        <Button
          asChild
          className="h-12 flex-1 rounded-xl bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-3 size-4" strokeWidth={1.5} /> Детайли
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            className="size-12 rounded-xl border-zinc-100 bg-zinc-50/30 text-zinc-600 transition-all hover:border-primary/30 hover:text-primary dark:border-zinc-800 dark:bg-zinc-900/30"
          >
            <Pencil className="size-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12 rounded-xl text-zinc-400 transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            onClick={onDelete}
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
