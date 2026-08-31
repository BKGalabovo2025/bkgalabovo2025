/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  Archive,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Eye,
  Filter,
  GraduationCap,
  History,
  Loader2,
  MapPin,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CoachNotesCard } from "@/components/training/CoachNotesCard";
import { SessionDetailsDialog } from "@/components/training/SessionDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { PlannerSession } from "@/types/planner.types";

import CreateSessionWizard from "./create-session-wizard";

const formatLocationLabel = (loc: string) => {
  if (loc === "court") return "В зала";
  if (loc === "stadium") return "Стадион";
  if (loc === "beach") return "Плаж";
  return loc || "На открито";
};

function PlannerClientContent() {
  const { activeBranch } = useAppStore();
  const searchParams = useSearchParams();
  const campIdParam = searchParams.get("campId");
  const dateParam = searchParams.get("date");
  const importTemplateParam = searchParams.get("importTemplate");

  const [sessions, setSessions] = useState<PlannerSession[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "archive">(
    "upcoming"
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // Preview & Edit state
  const [selectedSessionForPreview, setSelectedSessionForPreview] =
    useState<PlannerSession | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [editingSession, setEditingSession] = useState<PlannerSession | null>(
    null
  );
  const [isWizardOpen, setIsWizardOpen] = useState(
    !!campIdParam || !!importTemplateParam
  );

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const [sessionsData, attendancesData] = await Promise.all([
        plannerService.getSessions(activeBranch),
        plannerService.getAttendanceBySite(activeBranch).catch(() => []),
      ]);
      setSessions(sessionsData);

      const counts: Record<string, number> = {};
      attendancesData.forEach((att) => {
        if (att.sessionId) {
          counts[att.sessionId] = (counts[att.sessionId] || 0) + 1;
        }
      });
      setAttendanceCounts(counts);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (
      !window.confirm("Сигурни ли сте, че искате да изтриете тази тренировка?")
    )
      return;
    try {
      await plannerService.deleteSession(sessionId);
      toast.success("Тренировката е изтрита успешно");
      if (selectedSessionForPreview?.id === sessionId) {
        setIsPreviewOpen(false);
      }
      loadSessions();
    } catch (error) {
      console.error("Failed to delete session", error);
      toast.error("Възникна грешка при изтриването");
    }
  };

  const handleRevertToPlanned = async (sessionId: string) => {
    if (
      !window.confirm(
        "Искате ли да върнете тази тренировка в списъка с Предстоящи тренировки?"
      )
    )
      return;
    try {
      await plannerService.updateSession(sessionId, { status: "planned" });
      toast.success("Тренировката е върната в предстоящи");
      loadSessions();
    } catch (error) {
      console.error("Failed to revert session status", error);
      toast.error("Възникна грешка при промяната на статуса");
    }
  };

  const openPreview = (session: PlannerSession) => {
    setSelectedSessionForPreview(session);
    setIsPreviewOpen(true);
  };

  const getExerciseCount = (session: PlannerSession): string => {
    const blocksCount =
      session.blocks?.reduce((acc, b) => acc + b.items.length, 0) || 0;
    const groupsCount =
      session.groupedExercises?.reduce(
        (acc, g) => acc + g.exercises.length,
        0
      ) || 0;
    const flatCount = session.exercises?.length || 0;

    const total = Math.max(blocksCount, groupsCount, flatCount);
    return `${total} общо упр.`;
  };

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status !== "completed"),
    [sessions]
  );
  const archivedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions]
  );

  const baseSessions =
    activeTab === "upcoming" ? upcomingSessions : archivedSessions;

  const filteredSessions = useMemo(() => {
    return baseSessions.filter((session) => {
      // Date filter
      if (dateFilter) {
        const sessionDateOnly = session.date?.split("T")[0];
        if (sessionDateOnly !== dateFilter) return false;
      }

      // Location filter
      if (locationFilter !== "all") {
        if (session.location !== locationFilter) return false;
      }

      // Search query (title, coachNotes, exercises)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = session.title?.toLowerCase().includes(query);
        const matchesNotes = session.coachNotes?.toLowerCase().includes(query);
        const matchesGroups = session.targetGroups?.some((g) =>
          g.toLowerCase().includes(query)
        );
        const matchesLegacyEx = session.exercises?.some(
          (e) =>
            e.name?.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query)
        );
        const matchesBlockEx = session.blocks?.some((b) =>
          b.items.some(
            (i) =>
              i.exercise?.name?.toLowerCase().includes(query) ||
              i.exercise?.description?.toLowerCase().includes(query) ||
              i.rotations?.some(
                (r) =>
                  r.exercise?.name?.toLowerCase().includes(query) ||
                  r.exercise?.description?.toLowerCase().includes(query)
              )
          )
        );

        if (
          !matchesTitle &&
          !matchesNotes &&
          !matchesGroups &&
          !matchesLegacyEx &&
          !matchesBlockEx
        ) {
          return false;
        }
      }

      return true;
    });
  }, [baseSessions, dateFilter, locationFilter, searchQuery]);

  const hasActiveFilters = Boolean(
    dateFilter || searchQuery.trim() || locationFilter !== "all"
  );

  const clearFilters = () => {
    setDateFilter("");
    setSearchQuery("");
    setLocationFilter("all");
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
      {/* Header */}
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
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Link href="/training/theory">
              <GraduationCap className="mr-2 size-4" />
              Теория / Викторина
            </Link>
          </Button>
          <Button
            onClick={() => {
              setEditingSession(null);
              setIsWizardOpen(true);
            }}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Plus className="mr-2 size-4" />
            Планирай тренировка
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "upcoming" | "archive")}
        >
          <TabsList className="grid h-12 w-full max-w-md grid-cols-2 rounded-2xl bg-zinc-100 p-1">
            <TabsTrigger
              value="upcoming"
              className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs sm:text-sm"
            >
              <CalendarRange className="size-4" />
              <span>Предстоящи</span>
              <Badge
                variant="secondary"
                className={`ml-1 px-1.5 py-0.5 text-[11px] font-black ${
                  activeTab === "upcoming"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {upcomingSessions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs sm:text-sm"
            >
              <Archive className="size-4" />
              <span>Архив / Проведени</span>
              <Badge
                variant="secondary"
                className={`ml-1 px-1.5 py-0.5 text-[11px] font-black ${
                  activeTab === "archive"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {archivedSessions.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търси по заглавие, упражнение, бележки..."
              className="rounded-xl border-zinc-200 pl-9 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Date Picker Input */}
          <div className="relative w-full sm:w-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5">
              <Calendar className="size-4 shrink-0 text-indigo-600" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 outline-hidden sm:text-sm"
                title="Избери дата"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="text-zinc-400 hover:text-zinc-600"
                  title="Изчисти избраната дата"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Location Select */}
          <div className="w-full sm:w-44">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="rounded-xl border-zinc-200 text-xs font-medium sm:text-sm">
                <SelectValue placeholder="Всички локации" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички локации</SelectItem>
                <SelectItem value="court">В зала</SelectItem>
                <SelectItem value="stadium">Стадион</SelectItem>
                <SelectItem value="beach">Плаж</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="mr-1 size-3.5" />
              Изчисти филтрите
            </Button>
          )}
        </div>

        {/* Filter results info */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-zinc-500">
            <span>
              Намерени са{" "}
              <strong className="text-zinc-900">
                {filteredSessions.length}
              </strong>{" "}
              тренировки от общо {baseSessions.length}
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center">
          {hasActiveFilters ? (
            <>
              <Filter className="mx-auto mb-4 size-12 text-zinc-300" />
              <h3 className="mb-2 text-lg font-bold text-zinc-900">
                Няма намерени тренировки за тези филтри
              </h3>
              <p className="mx-auto mb-6 max-w-md text-sm text-zinc-500">
                Опитайте да изчистите датата или думата за търсене, за да видите
                всички тренировки.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-xl"
              >
                Изчисти всички филтри
              </Button>
            </>
          ) : activeTab === "upcoming" ? (
            <>
              <CalendarRange className="mx-auto mb-4 size-12 text-zinc-300" />
              <h3 className="mb-2 text-lg font-bold text-zinc-900">
                Няма предстоящи тренировки
              </h3>
              <p className="mx-auto mb-6 max-w-md text-zinc-500">
                Всички планирани тренировки са проведени или все още не сте
                създали нови.
              </p>
              <Button
                onClick={() => {
                  setEditingSession(null);
                  setIsWizardOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Планирай нова тренировка
              </Button>
            </>
          ) : (
            <>
              <History className="mx-auto mb-4 size-12 text-zinc-300" />
              <h3 className="mb-2 text-lg font-bold text-zinc-900">
                Няма архивирани тренировки
              </h3>
              <p className="mx-auto max-w-md text-zinc-500">
                Когато стартирате и финализирате тренировка през бутона „Старт“,
                тя автоматично ще се появи тук в архива.
              </p>
            </>
          )}
        </div>
      ) : (
        /* Sessions List */
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const attendeeCount = attendanceCounts[session.id] || 0;
            const isCompleted = session.status === "completed";

            return (
              <Card
                key={session.id}
                className="overflow-hidden border-zinc-200 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    {/* Date Sidebar - Clickable to open preview */}
                    <button
                      type="button"
                      onClick={() => openPreview(session)}
                      className="flex flex-col justify-center border-zinc-200 bg-zinc-50 p-6 text-left transition-colors hover:bg-indigo-50/40 sm:w-48 sm:border-r"
                      title="Кликнете за пълен преглед на тренировката"
                    >
                      <div className="mb-1 text-sm font-medium text-zinc-500 capitalize">
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
                      <div className="mt-1 text-[11px] font-semibold text-indigo-600">
                        {new Date(session.date).getFullYear()} г.
                      </div>
                    </button>

                    {/* Main Content */}
                    <div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        {/* Badges row */}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {isCompleted ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                              <CheckCircle2 className="mr-1 size-3" />
                              Проведена
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                session.mode === "camp"
                                  ? "destructive"
                                  : "default"
                              }
                              className="text-[10px] tracking-wider uppercase"
                            >
                              {session.mode === "camp"
                                ? "Лагер"
                                : "Целогодишна"}
                            </Badge>
                          )}

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
                          ) : session.ageGroup ? (
                            <Badge
                              variant="outline"
                              className="bg-zinc-100 text-[10px] tracking-wider uppercase"
                            >
                              {session.ageGroup}
                            </Badge>
                          ) : null}

                          {isCompleted && attendeeCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-indigo-200 bg-indigo-50/50 text-[10px] font-semibold text-indigo-800"
                            >
                              <Users className="mr-1 size-3 text-indigo-600" />
                              {attendeeCount} присъствали
                            </Badge>
                          )}
                        </div>

                        {/* Title - clickable to open preview */}
                        <button
                          type="button"
                          onClick={() => openPreview(session)}
                          className="group mb-1 text-left"
                        >
                          <h3 className="text-lg font-bold text-zinc-900 transition-colors group-hover:text-indigo-600">
                            {session.title}
                          </h3>
                        </button>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-zinc-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {formatLocationLabel(session.location)}
                          </div>
                          <div>{getExerciseCount(session)}</div>
                          {(session.startTime || session.endTime) && (
                            <div>
                              {session.startTime || "--:--"} -{" "}
                              {session.endTime || "--:--"}
                            </div>
                          )}
                        </div>

                        {/* Coach Notes */}
                        {session.coachNotes && (
                          <CoachNotesCard
                            notes={session.coachNotes}
                            className="mt-2.5 max-w-xl"
                          />
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-2">
                        {/* Eye Button - Detailed preview */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                          onClick={() => openPreview(session)}
                          title="Пълен преглед на упражненията и детайлите"
                        >
                          <Eye className="mr-1.5 size-3.5 text-indigo-600" />
                          <span>Преглед</span>
                        </Button>

                        {isCompleted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                            onClick={() => handleRevertToPlanned(session.id)}
                            title="Върни в списъка с Предстоящи"
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          onClick={() => {
                            setEditingSession(session);
                            setIsWizardOpen(true);
                          }}
                          title="Редактирай тренировка"
                        >
                          <Pencil className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteSession(session.id)}
                          title="Изтрий тренировка"
                        >
                          <Trash2 className="size-4" />
                        </Button>

                        {isCompleted ? (
                          <Button
                            asChild
                            variant="outline"
                            className="rounded-xl border-emerald-200 bg-emerald-50/50 font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Link
                              href={`/training/planner/${session.id}/active`}
                            >
                              <Users className="mr-2 size-4" />
                              <span className="hidden sm:inline">
                                Присъствия
                              </span>
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className="rounded-xl bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100"
                          >
                            <Link
                              href={`/training/planner/${session.id}/active`}
                            >
                              <Play className="mr-2 size-4" />
                              <span className="hidden sm:inline">Старт</span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session Details Dialog (Preview) */}
      <SessionDetailsDialog
        session={selectedSessionForPreview}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        attendeeCount={
          selectedSessionForPreview
            ? attendanceCounts[selectedSessionForPreview.id] || 0
            : 0
        }
        onEdit={(sessionToEdit) => {
          setEditingSession(sessionToEdit);
          setIsWizardOpen(true);
        }}
        onRevertToPlanned={handleRevertToPlanned}
      />

      {/* Wizard */}
      <CreateSessionWizard
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open);
          if (!open) {
            setEditingSession(null);
            // Remove all specific query params on close so re-opening works fresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("campId");
            newUrl.searchParams.delete("date");
            newUrl.searchParams.delete("importTemplate");
            window.history.replaceState({}, "", newUrl.toString());
          }
        }}
        onSaveSuccess={() => {
          loadSessions();
        }}
        initialCampId={campIdParam || undefined}
        initialDate={dateParam || undefined}
        initialImportTemplateId={importTemplateParam || undefined}
        initialSession={editingSession || undefined}
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
