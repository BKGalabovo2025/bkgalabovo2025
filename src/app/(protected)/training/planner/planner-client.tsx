"use client";

import { CalendarRange, Loader2, MapPin, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { PlannerSession } from "@/types/planner.types";

import CreateSessionWizard from "./create-session-wizard";

function PlannerClientContent() {
  const { activeBranch } = useAppStore();
  const searchParams = useSearchParams();
  const campIdParam = searchParams.get("campId");
  const dateParam = searchParams.get("date");

  const [sessions, setSessions] = useState<PlannerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(!!campIdParam);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await plannerService.getSessions(activeBranch);
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 uppercase">
            <CalendarRange className="size-6 text-indigo-600" />
            Универсален Планировчик
          </h1>
          <p className="mt-1 font-medium text-zinc-500">
            Планиране на лагери и целогодишни тренировки
          </p>
        </div>
        <Button
          onClick={() => setIsWizardOpen(true)}
          className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
        >
          <Plus className="mr-2 size-4" />
          Планирай тренировка
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center">
          <CalendarRange className="mx-auto mb-4 size-12 text-zinc-300" />
          <h3 className="mb-2 text-lg font-bold text-zinc-900">
            Няма планирани тренировки
          </h3>
          <p className="mx-auto mb-6 max-w-md text-zinc-500">
            Използвай автоматичния съветник, за да генерираш перфектната
            тренировка спрямо възрастта и локацията.
          </p>
          <Button
            onClick={() => setIsWizardOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Започни планиране
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="overflow-hidden border-zinc-200 shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex flex-col justify-center border-zinc-200 bg-zinc-50 p-6 sm:w-48 sm:border-r">
                    <div className="mb-1 text-sm font-medium text-zinc-500">
                      {new Date(session.date).toLocaleDateString("bg-BG", {
                        weekday: "long",
                      })}
                    </div>
                    <div className="text-2xl font-black text-zinc-900">
                      {new Date(session.date).toLocaleDateString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between p-6">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          variant={
                            session.mode === "camp" ? "destructive" : "default"
                          }
                          className="text-[10px] tracking-wider uppercase"
                        >
                          {session.mode === "camp" ? "Лагер" : "Целогодишна"}
                        </Badge>
                        {session.targetGroups &&
                        session.targetGroups.length > 0 ? (
                          session.targetGroups.map((g, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="border-indigo-200 bg-indigo-50 text-[10px] tracking-wider text-indigo-700 uppercase"
                            >
                              {g}
                            </Badge>
                          ))
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-zinc-100 text-[10px] tracking-wider uppercase"
                          >
                            {session.ageGroup}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-zinc-900">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {session.location === "indoor"
                            ? "В зала"
                            : "На открито"}
                        </div>
                        <div>
                          {session.groupedExercises &&
                          session.groupedExercises.length > 0
                            ? session.groupedExercises.reduce(
                                (acc, g) => acc + g.exercises.length,
                                0
                              ) + " общо упр."
                            : (session.exercises?.length || 0) + " упражнения"}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex">
                      <Button
                        asChild
                        className="rounded-xl bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Link href={`/training/planner/${session.id}/active`}>
                          <Play className="mr-2 size-4" />
                          Старт
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSessionWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSaveSuccess={() => {
          setIsWizardOpen(false);
          loadSessions();
        }}
        initialCampId={campIdParam || undefined}
        initialDate={dateParam || undefined}
      />
    </div>
  );
}

export default function PlannerClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <PlannerClientContent />
    </Suspense>
  );
}
