"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { syncRankingsAction } from "@/lib/actions/rankings";
import { tournamentService } from "@/services/tournament-service";
import { Tournament } from "@/types/tournament.types";
const TournamentForm = dynamic(
  () =>
    import("@/components/tournaments/tournament-form").then(
      (m) => m.TournamentForm
    ),
  { ssr: false }
);
import {
  Calendar,
  CheckCircle2,
  LayoutList,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDateShort } from "@/lib/date-utils";

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

      // Auto-sync rankings if it affects rankings
      if (editingTournament.countsForRanking || data.countsForRanking) {
        await syncRankingsAction();
      }

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

      // Auto-sync rankings (if the deleted tournament had countsForRanking=true)
      // Since we don't have the tournament object here, we'll just safely sync
      await syncRankingsAction();

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
          className="h-11 sm:h-12 w-full sm:w-auto rounded-xl bg-zinc-950 px-6 sm:px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
        >
          <Plus className="mr-3 size-4" strokeWidth={1.5} /> Нов турнир
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-4">
        <BentoCard className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-0.5 text-2xl sm:text-3xl font-light text-zinc-900 dark:text-white">
                {activeTournaments.length}
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Активни
              </p>
            </div>
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <Trophy className="size-3.5 sm:size-4" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-0.5 text-2xl sm:text-3xl font-light text-zinc-900 dark:text-white">
                {completedTournaments.length}
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                Приключили
              </p>
            </div>
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900">
              <CheckCircle2 className="size-3.5 sm:size-4" strokeWidth={1.5} />
            </div>
          </div>
        </BentoCard>
        <BentoCard className="col-span-2 flex items-center p-2.5 sm:p-3 px-3 sm:px-4 md:col-span-2 rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="relative w-full">
            <Search
              className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.5}
            />
            <Input
              placeholder="Търсене на турнир по име или локация..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9.5 sm:h-10 rounded-xl border-zinc-100 bg-zinc-50/50 pl-9 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
            />
          </div>
        </BentoCard>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
          {/* Fixed Sticky Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Trophy className="size-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                  Нов турнир
                </DialogTitle>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Попълнете параметрите на турнира
                </p>
              </div>
            </div>
          </div>
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
        <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
          {/* Fixed Sticky Header */}
          <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Trophy className="size-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                  Редактиране на турнир
                </DialogTitle>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Променете параметрите на турнира
                </p>
              </div>
            </div>
          </div>
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
        <BentoCard className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/30 py-10 sm:py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/10">
          <div className="mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full border border-zinc-200 bg-white transition-all hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
            <Trophy
              className="size-6 sm:size-7 text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="mb-2 text-xl sm:text-2xl font-light text-zinc-900 dark:text-white">
            Няма създадени турнири
          </h3>
          <p className="mb-6 max-w-sm leading-relaxed text-xs sm:text-sm font-light text-zinc-400">
            Започнете, като създадете първия турнир за вашия клуб.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] sm:text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            Създай първия турнир
          </Button>
        </BentoCard>
      ) : (
        <div className="space-y-8 sm:space-y-12">
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
    <BentoCard className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none transition-all duration-300 hover:border-primary/40 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="p-4 sm:p-5 pb-3 sm:pb-3.5">
        <div className="mb-3 flex items-center justify-between">
          {getStatusBadge(tournament.status)}
          <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            {getFormatLabel(tournament.format || "")}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-12 text-lg sm:text-xl leading-tight font-normal text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
          {tournament.title}
        </h3>
        <div className="mt-2.5 flex items-center text-xs font-light tracking-wide text-zinc-400">
          <MapPin className="mr-1.5 size-3.5" strokeWidth={1.5} />{" "}
          {tournament.location}
        </div>
      </div>

      <div className="flex-1 border-y border-zinc-100 bg-zinc-50/40 px-4 sm:p-5 py-3 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Дата
            </p>
            <div className="flex items-center text-xs sm:text-sm font-light text-zinc-900 dark:text-zinc-100">
              <Calendar
                className="mr-2 size-3.5 text-primary/60"
                strokeWidth={1.5}
              />
              {formatDateShort(tournament.startDate)}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Категории
            </p>
            <div className="flex items-center text-xs sm:text-sm font-light text-zinc-900 dark:text-zinc-100">
              <Users
                className="mr-2 size-3.5 text-primary/60"
                strokeWidth={1.5}
              />
              {tournament.categories?.length || 0}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[9px] font-medium tracking-widest text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {getCategoryLabel(cat)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex gap-2 border-t border-zinc-100 bg-white p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <Button
          asChild
          className="h-9.5 sm:h-10 flex-1 rounded-xl bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-2 size-3.5" strokeWidth={1.5} /> Детайли
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
