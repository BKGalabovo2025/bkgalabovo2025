"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { plannerService } from "@/services/planner-service";
import { PlannerSession } from "@/types/planner.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarRange, MapPin, Loader2, Play } from "lucide-react";
import Link from "next/link";
import CreateSessionWizard from "./create-session-wizard";

export default function PlannerClient() {
  const { activeBranch } = useAppStore();
  const [sessions, setSessions] = useState<PlannerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    loadSessions();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-indigo-600" />
            Универсален Планировчик
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Планиране на лагери и целогодишни тренировки
          </p>
        </div>
        <Button
          onClick={() => setIsWizardOpen(true)}
          className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Планирай тренировка
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
          <CalendarRange className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Няма планирани тренировки
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
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
              className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="bg-zinc-50 p-6 flex flex-col justify-center sm:w-48 sm:border-r border-zinc-200">
                    <div className="text-sm text-zinc-500 font-medium mb-1">
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
                  <div className="p-6 flex-1 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            session.mode === "camp" ? "destructive" : "default"
                          }
                          className="uppercase text-[10px] tracking-wider"
                        >
                          {session.mode === "camp" ? "Лагер" : "Целогодишна"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="uppercase text-[10px] tracking-wider bg-zinc-100"
                        >
                          {session.ageGroup}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-1">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location === "indoor"
                            ? "В зала"
                            : "На открито"}
                        </div>
                        <div>{session.exercises.length} упражнения</div>
                      </div>
                    </div>
                    <div className="hidden sm:flex">
                      <Button
                        asChild
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl"
                      >
                        <Link href={`/training/planner/${session.id}/active`}>
                          <Play className="w-4 h-4 mr-2" />
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
      />
    </div>
  );
}
