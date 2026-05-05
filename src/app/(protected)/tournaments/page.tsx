"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null
  );

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
    Promise.resolve().then(() => fetchTournaments());
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
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този турнир? Всички участници и мачове ще бъдат загубени!"
      )
    )
      return;
    try {
      await tournamentService.deleteTournament(id);
      toast.success("Турнирът е изтрит.");
      fetchTournaments();
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Предстоящ</Badge>;
      case "registration_open":
        return (
          <Badge variant="default" className="bg-green-600">
            Отворено записване
          </Badge>
        );
      case "ongoing":
        return <Badge variant="destructive">В ход</Badge>;
      case "completed":
        return <Badge variant="outline">Приключил</Badge>;
      default:
        return null;
    }
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case "berger":
        return "Система Бергер";
      case "knockout":
        return "Елиминация";
      case "mixed":
        return "Групи + Елиминация";
      default:
        return format;
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Турнири</h1>
          <p className="text-muted-foreground mt-1">
            Управление на състезания, схеми и участници
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Създай турнир
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Нов турнир</DialogTitle>
          </DialogHeader>
          <TournamentForm
            onSave={handleSave}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Диалог за редактиране */}
      <Dialog
        open={!!editingTournament}
        onOpenChange={(open) => !open && setEditingTournament(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl">
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

      {loading ? (
        <div className="flex justify-center p-12">
          <p>Зареждане на турнирите...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Няма създадени турнири</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mb-6">
            Все още няма създадени турнири в системата. Натиснете бутона
            &quot;Създай турнир&quot;, за да започнете.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            Създай първия турнир
          </Button>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Активни турнири */}
          {tournaments.filter((t) => t.status !== "completed").length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Активни турнири
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments
                  .filter((t) => t.status !== "completed")
                  .map((tournament) => (
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
          {tournaments.filter((t) => t.status === "completed").length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Приключили турнири
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale-[0.5]">
                {tournaments
                  .filter((t) => t.status === "completed")
                  .map((tournament) => (
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
  onDelete,
}: {
  tournament: Tournament;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Предстоящ</Badge>;
      case "registration_open":
        return (
          <Badge variant="default" className="bg-green-600">
            Отворено записване
          </Badge>
        );
      case "ongoing":
        return <Badge variant="destructive">В ход</Badge>;
      case "completed":
        return <Badge variant="outline">Приключил</Badge>;
      default:
        return null;
    }
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case "berger":
        return "Система Бергер";
      case "knockout":
        return "Елиминация";
      case "mixed":
        return "Групи + Елиминация";
      default:
        return format;
    }
  };

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

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          {getStatusBadge(tournament.status)}
          <Badge variant="outline" className="font-normal">
            {getFormatName(tournament.format)}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 leading-tight">
          {tournament.title}
        </CardTitle>
        <CardDescription className="flex items-center mt-2">
          <MapPin className="mr-1 h-3 w-3" /> {tournament.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {format(new Date(tournament.startDate), "dd.MM.yyyy")} -{" "}
              {format(new Date(tournament.endDate), "dd.MM.yyyy")}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{tournament.categories?.length || 0} категории</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-4">
          {tournament.categories?.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-[10px] bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-sm"
            >
              {getCategoryName(cat)}
            </span>
          ))}
          {(tournament.categories?.length || 0) > 3 && (
            <span className="text-[10px] bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-sm">
              +{(tournament.categories?.length || 0) - 3}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border/50 flex gap-2">
        <Button asChild className="flex-1" variant="secondary">
          <Link href={`/tournaments/${tournament.id}`}>
            <LayoutList className="mr-2 h-4 w-4" /> Управление
          </Link>
        </Button>
        <Button variant="outline" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
