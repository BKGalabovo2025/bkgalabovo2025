"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { getAllMembers } from "@/services/member-service";
import { beepTestService } from "@/services/beep-test-service";
import { Member } from "@/types/member.types";
import { BeepTestPeriod, BadmintonScore } from "@/types/beep-test.types";
import {
  calculateVO2Max,
  evaluateBadmintonScore,
  getTotalShuttles,
} from "@/lib/beep-test-norms";
import { useBeepTestEngine } from "@/hooks/useBeepTestEngine";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAgeGroup } from "@/lib/utils";

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

  useEffect(() => {
    loadMembers();
  }, [activeBranch]);

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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isTestStarted) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 mb-6 uppercase">
          Бийп Тест Аналитика
        </h1>

        <Card className="border-zinc-200">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">
                Период на теста
              </label>
              <Select
                value={selectedPeriod}
                onValueChange={(v) => setSelectedPeriod(v as BeepTestPeriod)}
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
                <label className="text-sm font-bold text-zinc-700">Пол</label>
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
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-zinc-700">
                    Избрани участници ({selectedParticipantIds.length})
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedParticipantIds(
                        filteredMembers.map((m) => m.id)
                      )
                    }
                    className="text-indigo-600"
                  >
                    Маркирай всички
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                  {filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleParticipant(m.id)}
                      className={`cursor-pointer p-3 rounded-xl border text-sm transition-all ${selectedParticipantIds.includes(m.id) ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-sm" : "border-zinc-200 text-zinc-500 hover:border-indigo-300 bg-white"}`}
                    >
                      {m.firstName} {m.lastName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleSetupTest}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg mt-4"
              disabled={selectedParticipantIds.length === 0}
            >
              Старт на Теста
            </Button>
          </CardContent>
        </Card>
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
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-zinc-900 uppercase">
          Live: Бийп Тест
        </h1>
        <div className="text-sm font-bold text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full">
          {activeCount} / {participants.length} активни
        </div>
      </div>

      {/* Top Bar: Timer & Audio */}
      <Card
        className={`mb-8 border-2 transition-colors ${beepState.isPlaying ? "border-emerald-500 shadow-emerald-500/20 shadow-lg" : "border-zinc-200"}`}
      >
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Ниво : Совалка
              </div>
              <div className="text-5xl font-black text-zinc-900 tabular-nums">
                {beepState.level} <span className="text-zinc-300">:</span>{" "}
                {beepState.shuttle}
              </div>
            </div>
            <div className="border-l border-r border-zinc-100">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Скорост (km/h)
              </div>
              <div className="text-5xl font-black text-indigo-600 tabular-nums">
                {beepState.speedKmH.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Общо Време
              </div>
              <div className="text-5xl font-black text-zinc-900 tabular-nums">
                {formatTime(beepState.totalTimeMs)}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button
              size="lg"
              onClick={beepState.isPlaying ? pause : start}
              className={`w-40 h-14 text-lg ${beepState.isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
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
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout (Състезатели) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants
          .sort((a, b) => Number(a.hasDroppedOut) - Number(b.hasDroppedOut))
          .map((p) => (
            <Card
              key={p.id}
              className={`overflow-hidden transition-all duration-500 ${p.hasDroppedOut ? "bg-zinc-50 border-zinc-200 opacity-70" : "border-indigo-100 shadow-sm"}`}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-lg text-zinc-900 leading-tight">
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="text-xs font-medium text-zinc-500 mt-1">
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
                    <CheckCircle2 className="w-6 h-6 text-zinc-400" />
                  )}
                </div>

                {!p.hasDroppedOut ? (
                  <Button
                    onClick={() => handleDropout(p.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-lg h-12 uppercase tracking-widest shadow-md hover:shadow-red-500/25"
                  >
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    Отпадна
                  </Button>
                ) : (
                  <div className="bg-zinc-100 rounded-lg p-3 text-center border border-zinc-200">
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">
                      Финален резултат
                    </div>
                    <div className="text-lg font-black text-zinc-900">
                      Ниво {p.finalLevel} : {p.finalShuttle}
                    </div>
                    <div className="text-xs font-bold text-indigo-600 mt-1">
                      {p.finalScore}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Floating Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t shadow-lg z-50 flex justify-center">
        <Button
          size="lg"
          onClick={handleFinishAndSave}
          disabled={isSaving}
          className="w-full max-w-md bg-zinc-950 text-white rounded-xl shadow-xl hover:bg-zinc-800"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Завърши и Запази в Досиетата
        </Button>
      </div>
    </div>
  );
}
