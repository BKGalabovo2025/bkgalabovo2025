"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBeepTestEngine } from "@/hooks/useBeepTestEngine";
import {
  calculateVO2Max,
  evaluateBadmintonScore,
  getTotalShuttles,
} from "@/lib/beep-test-norms";
import { getAgeGroup } from "@/lib/utils";
import { beepTestService } from "@/services/beep-test-service";
import { getAllMembers } from "@/services/member-service";
import { useAppStore } from "@/store/use-app-store";
import { BadmintonScore, BeepTestPeriod } from "@/types/beep-test.types";
import { BeepTestResult } from "@/types/beep-test.types";
import { Member } from "@/types/member.types";

const PERIODS: BeepTestPeriod[] = [
  "Предсезонна подготовка (Август-Септември)",
  "Средата на сезона (Януари-Февруари)",
  "Край на сезона (Май-Юни)",
  "Специален Лагер",
];

// Extend member with specific test state
interface Participant extends Member {
  testAgeGroup: string;
  hasDroppedOut: boolean;
  finalLevel: number | null;
  finalShuttle: number | null;
  finalVO2: number | null;
  finalScore: BadmintonScore | null;
}

const getScoreColor = (score: string) => {
  if (score === "Елитен състезател") return "bg-purple-100 text-purple-700";
  if (score === "Отличен") return "bg-emerald-100 text-emerald-700";
  if (score === "Лош") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
};

export default function BeepTestClient() {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const { state: beepState, start, pause, reset } = useBeepTestEngine();

  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  // Setup state
  const [selectedPeriod, setSelectedPeriod] = useState<BeepTestPeriod>(
    PERIODS[0]
  );
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);

  // Active Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  // History State
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [history, setHistory] = useState<BeepTestResult[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [activeBranch]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeBranch]);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const results = await beepTestService.getAllResults(activeBranch);
      setHistory(results);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при зареждане на историята");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този резултат? Той ще бъде премахнат и от досието на състезателя."
      )
    ) {
      return;
    }

    try {
      await beepTestService.deleteResult(resultId);
      setHistory((prev) => prev.filter((r) => r.id !== resultId));
      toast.success("Резултатът е изтрит успешно.");
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при изтриването.");
    }
  };

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const allMembers = await getAllMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при зареждане на състезателите");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const ageGroup = m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "Adults";
      const genderMatch =
        selectedGender === "all" || m.gender === selectedGender;
      const ageMatch =
        selectedAgeGroup === "all" || ageGroup === selectedAgeGroup;
      return genderMatch && ageMatch;
    });
  }, [members, selectedAgeGroup, selectedGender]);

  useEffect(() => {
    setSelectedParticipantIds(filteredMembers.map((m) => m.id));
  }, [filteredMembers]);

  const groupedHistory = useMemo(() => {
    return history.reduce(
      (acc, curr) => {
        const dateStr = curr.date.split("T")[0]; // Group by simple date YYYY-MM-DD
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(curr);
        return acc;
      },
      {} as Record<string, BeepTestResult[]>
    );
  }, [history]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSetupTest = () => {
    if (selectedParticipantIds.length === 0) {
      toast.error("Моля, изберете поне един състезател");
      return;
    }

    const finalParticipants = members.filter((m) =>
      selectedParticipantIds.includes(m.id)
    );

    const initialParticipants: Participant[] = finalParticipants.map((m) => ({
      ...m,
      testAgeGroup: m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "Adults",
      hasDroppedOut: false,
      finalLevel: null,
      finalShuttle: null,
      finalVO2: null,
      finalScore: null,
    }));

    setParticipants(initialParticipants);
    setIsTestStarted(true);
  };

  const handleDropout = (memberId: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== memberId) return p;

        const level = beepState.level;
        const shuttle = beepState.shuttle;
        const total = getTotalShuttles(level, shuttle);
        const vo2 = calculateVO2Max(total);
        const score = evaluateBadmintonScore(
          level,
          p.testAgeGroup,
          p.gender as "male" | "female"
        );

        return {
          ...p,
          hasDroppedOut: true,
          finalLevel: level,
          finalShuttle: shuttle,
          finalVO2: vo2,
          finalScore: score,
        };
      })
    );
  };

  const handleFinishAndSave = async () => {
    // Check if anyone hasn't dropped out yet
    const activeLeft = participants.filter((p) => !p.hasDroppedOut);
    if (
      activeLeft.length > 0 &&
      !confirm(
        `Има ${activeLeft.length} състезатели, които не са отпаднали. Да прекратя ли теста им с текущия резултат (Ниво ${beepState.level})?`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      pause();

      const now = new Date().toISOString();
      const promises = participants.map((p) => {
        const level = p.finalLevel || beepState.level;
        const shuttle = p.finalShuttle || beepState.shuttle;
        const total = getTotalShuttles(level, shuttle);
        const vo2 = p.finalVO2 || calculateVO2Max(total);
        const score =
          p.finalScore ||
          evaluateBadmintonScore(
            level,
            p.testAgeGroup,
            p.gender as "male" | "female"
          );

        return beepTestService.saveResult(activeBranch, {
          siteId: activeBranch,
          memberId: p.id,
          date: now,
          period: selectedPeriod,
          level,
          shuttle,
          vo2max: vo2,
          score: score,
        });
      });

      await Promise.all(promises);
      toast.success("Резултатите са запазени успешно в досиетата!");
      router.push("/training/assessments"); // Redirect back to general tests or stay
    } catch (error) {
      console.error(error);
      toast.error("Грешка при запазване");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isTestStarted) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">
            Бийп Тест Аналитика
          </h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "new" | "history")}
        >
          <TabsList className="mb-6 grid h-12 w-full max-w-sm grid-cols-2">
            <TabsTrigger value="new" className="h-10 text-sm font-bold">
              Нов Тест
            </TabsTrigger>
            <TabsTrigger value="history" className="h-10 text-sm font-bold">
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="duration-300 animate-in fade-in">
            <Card className="border-zinc-200">
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">
                    Период на теста
                  </label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={(v) =>
                      setSelectedPeriod(v as BeepTestPeriod)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Възрастова група
                    </label>
                    <Select
                      value={selectedAgeGroup}
                      onValueChange={setSelectedAgeGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Всички" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всички възрасти</SelectItem>
                        <SelectItem value="U9">U9</SelectItem>
                        <SelectItem value="U11">U11</SelectItem>
                        <SelectItem value="U13">U13</SelectItem>
                        <SelectItem value="U15">U15</SelectItem>
                        <SelectItem value="U17">U17</SelectItem>
                        <SelectItem value="U19">U19</SelectItem>
                        <SelectItem value="Adults">Мъже/Жени</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">
                      Пол
                    </label>
                    <Select
                      value={selectedGender}
                      onValueChange={setSelectedGender}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Всички" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всички</SelectItem>
                        <SelectItem value="male">Момчета / Мъже</SelectItem>
                        <SelectItem value="female">Момичета / Жени</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredMembers.length > 0 && (
                  <div className="space-y-3 border-t border-zinc-100 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-zinc-700">
                        Избрани участници ({selectedParticipantIds.length})
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            selectedParticipantIds.length ===
                            filteredMembers.length
                          ) {
                            setSelectedParticipantIds([]);
                          } else {
                            setSelectedParticipantIds(
                              filteredMembers.map((m) => m.id)
                            );
                          }
                        }}
                        className="text-indigo-600"
                      >
                        {selectedParticipantIds.length ===
                        filteredMembers.length
                          ? "Размаркирай всички"
                          : "Маркирай всички"}
                      </Button>
                    </div>
                    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">
                      {filteredMembers.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleParticipant(m.id)}
                          className={`cursor-pointer rounded-xl border p-3 text-sm transition-all ${selectedParticipantIds.includes(m.id) ? "border-indigo-600 bg-indigo-50 font-bold text-indigo-900 shadow-sm" : "border-zinc-200 bg-white text-zinc-500 hover:border-indigo-300"}`}
                        >
                          {m.firstName} {m.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSetupTest}
                  className="mt-4 h-12 w-full bg-indigo-600 text-lg text-white hover:bg-indigo-700"
                  disabled={selectedParticipantIds.length === 0}
                >
                  Старт на Теста
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-6 duration-300 animate-in fade-in"
          >
            {isHistoryLoading && (
              <div className="flex justify-center p-12">
                <Loader2 className="size-8 animate-spin text-indigo-600" />
              </div>
            )}

            {!isHistoryLoading && Object.keys(groupedHistory).length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center">
                <p className="font-medium text-zinc-500">
                  Няма проведени тестове до момента.
                </p>
              </div>
            )}

            {!isHistoryLoading &&
              Object.keys(groupedHistory).length > 0 &&
              Object.entries(groupedHistory).map(([dateStr, results]) => {
                const dateObj = new Date(dateStr);
                return (
                  <Card
                    key={dateStr}
                    className="overflow-hidden border-zinc-200"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          {format(dateObj, "dd MMMM yyyy", { locale: bg })}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {results[0]?.period}
                        </p>
                      </div>
                      <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800">
                        {results.length} участници
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-zinc-100">
                        {results.map((r) => {
                          const member = members.find(
                            (m) => m.id === r.memberId
                          );
                          const memberName = member
                            ? `${member.firstName} ${member.lastName}`
                            : "Неизвестен";
                          return (
                            <div
                              key={r.id}
                              className="group flex items-center justify-between p-4 transition-colors hover:bg-zinc-50 sm:px-6"
                            >
                              <Link
                                href={`/members/${r.memberId}?tab=assessments`}
                                className="flex flex-1 items-center justify-between pr-4"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900 transition-colors group-hover:text-indigo-600">
                                    {memberName}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                                    <span>
                                      Ниво {r.level}:{r.shuttle}
                                    </span>
                                    <span className="text-zinc-300">•</span>
                                    <span className="font-bold text-indigo-600">
                                      VO2: {r.vo2max}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${getScoreColor(r.score)}`}
                                  >
                                    {r.score}
                                  </span>
                                  <span className="text-[10px] font-medium text-zinc-400 transition-colors group-hover:text-indigo-500">
                                    Към досие &rarr;
                                  </span>
                                </div>
                              </Link>

                              {/* Delete Button */}
                              <div className="border-l border-zinc-100 pl-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteResult(r.id);
                                  }}
                                  className="text-zinc-400 hover:bg-red-50 hover:text-red-500"
                                  title="Изтрий резултата"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Active Test UI
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const activeCount = participants.filter((p) => !p.hasDroppedOut).length;

  return (
    <div className="mx-auto max-w-5xl p-4 pb-32 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-zinc-900 uppercase">
          Live: Бийп Тест
        </h1>
        <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-500">
          {activeCount} / {participants.length} активни
        </div>
      </div>

      {/* Top Bar: Timer & Audio */}
      <Card
        className={`mb-8 border-2 transition-colors ${beepState.isPlaying ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-zinc-200"}`}
      >
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="mb-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Ниво : Совалка
              </div>
              <div className="text-5xl font-black text-zinc-900 tabular-nums">
                {beepState.level} <span className="text-zinc-300">:</span>{" "}
                {beepState.shuttle}
              </div>
            </div>
            <div className="border-x border-zinc-100">
              <div className="mb-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Скорост (km/h)
              </div>
              <div className="text-5xl font-black text-indigo-600 tabular-nums">
                {beepState.speedKmH.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                Общо Време
              </div>
              <div className="text-5xl font-black text-zinc-900 tabular-nums">
                {formatTime(beepState.totalTimeMs)}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              size="lg"
              onClick={beepState.isPlaying ? pause : start}
              className={`h-14 w-40 text-lg ${beepState.isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
            >
              {beepState.isPlaying ? (
                <>
                  <Pause className="mr-2" /> Пауза
                </>
              ) : (
                <>
                  <Play className="mr-2" /> СТАРТ
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={reset}
              className="h-14 px-8"
            >
              <RotateCcw className="size-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout (Състезатели) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {participants
          .sort((a, b) => Number(a.hasDroppedOut) - Number(b.hasDroppedOut))
          .map((p) => (
            <Card
              key={p.id}
              className={`overflow-hidden transition-all duration-500 ${p.hasDroppedOut ? "border-zinc-200 bg-zinc-50 opacity-70" : "border-indigo-100 shadow-sm"}`}
            >
              <CardContent className="flex h-full min-h-35 flex-col justify-between p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="text-lg leading-tight font-bold text-zinc-900">
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="mt-1 text-xs font-medium text-zinc-500">
                      <span
                        className={
                          p.gender === "male"
                            ? "text-blue-600"
                            : "text-pink-600"
                        }
                      >
                        {p.gender === "male" ? "М" : "Ж"}
                      </span>
                      <span className="mx-2">•</span>
                      {p.testAgeGroup}
                    </div>
                  </div>
                  {p.hasDroppedOut && (
                    <CheckCircle2 className="size-6 text-zinc-400" />
                  )}
                </div>

                {!p.hasDroppedOut ? (
                  <Button
                    onClick={() => handleDropout(p.id)}
                    className="h-12 w-full bg-red-500 text-lg font-black tracking-widest text-white uppercase shadow-md hover:bg-red-600 hover:shadow-red-500/25"
                  >
                    <Square className="mr-2 size-5 fill-current" />
                    Отпадна
                  </Button>
                ) : (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-center">
                    <div className="mb-1 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                      Финален резултат
                    </div>
                    <div className="text-lg font-black text-zinc-900">
                      Ниво {p.finalLevel} : {p.finalShuttle}
                    </div>
                    <div className="mt-1 text-xs font-bold text-indigo-600">
                      {p.finalScore}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Floating Save */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center border-t bg-white/80 p-4 shadow-lg backdrop-blur-md">
        <Button
          size="lg"
          onClick={handleFinishAndSave}
          disabled={isSaving}
          className="w-full max-w-md rounded-xl bg-zinc-950 text-white shadow-xl hover:bg-zinc-800"
        >
          {isSaving ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            <Save className="mr-2 size-5" />
          )}
          Завърши и Запази в Досиетата
        </Button>
      </div>
    </div>
  );
}
