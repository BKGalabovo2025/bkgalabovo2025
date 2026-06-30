/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { plannerService } from "@/services/planner-service";
import { getAllMembers } from "@/services/member-service";
import {
  PlannerSession,
  SessionAttendance,
  Exercise,
} from "@/types/planner.types";
import { Member } from "@/types/member.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  Save,
  Loader2,
  ArrowLeft,
  Activity,
  Target,
  Timer,
  SkipForward,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Props {
  sessionId: string;
}

// Simple synthesizer for a loud, clear whistle/beep sound
const playWhistle = () => {
  try {
    const audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "square";
    // Start high pitch (like a whistle)
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1800,
      audioCtx.currentTime + 0.2
    );

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Volume
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.5
    );

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch {
    console.log("Audio not supported or interaction required");
  }
};

export default function ActiveSessionClient({ sessionId }: Props) {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const [session, setSession] = useState<PlannerSession | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Interval Timer State
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [timerState, setTimerState] = useState<
    "idle" | "work" | "rest" | "finished"
  >("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Global Notes
  const [coachNotes, setCoachNotes] = useState("");

  // Attendance State
  const [attendance, setAttendance] = useState<
    Record<string, SessionAttendance>
  >({});

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, activeBranch]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allSessions = await plannerService.getSessions(activeBranch);
      const targetSession = allSessions.find((s) => s.id === sessionId);
      if (!targetSession) throw new Error("Session not found");
      setSession(targetSession);

      const allMembers = await getAllMembers();
      const activeMembers = allMembers.filter(
        (m: Member) => m.status === "active"
      );
      setMembers(activeMembers);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Interval Timer Logic ---
  const startExercise = (ex: Exercise) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveExercise(ex);
    setCurrentSet(1);

    if (ex.defaultWorkSec) {
      setTimerState("work");
      setTimeRemaining(ex.defaultWorkSec);
      playWhistle(); // Start sound
    } else {
      // Fallback simple timer
      setTimerState("work");
      setTimeRemaining(ex.durationMinutes * 60);
    }
  };

  const stopExercise = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveExercise(null);
    setTimerState("idle");
  };

  const skipInterval = () => {
    if (!activeExercise) return;
    advanceTimer();
  };

  const advanceTimer = () => {
    if (!activeExercise) return;

    if (timerState === "work") {
      if (currentSet >= (activeExercise.defaultSets || 1)) {
        setTimerState("finished");
        setTimeRemaining(0);
        playWhistle();
        setTimeout(playWhistle, 500); // Double beep for finished
      } else {
        setTimerState("rest");
        setTimeRemaining(activeExercise.defaultRestSec || 30);
        playWhistle();
      }
    } else if (timerState === "rest") {
      setCurrentSet((s) => s + 1);
      setTimerState("work");
      setTimeRemaining(activeExercise.defaultWorkSec || 60);
      playWhistle();
    }
  };

  useEffect(() => {
    if (timerState === "work" || timerState === "rest") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            advanceTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, currentSet, activeExercise]);

  const toggleTimerPause = () => {
    if (timerState === "idle" || timerState === "finished") return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      // Note: A true pause would need a third state "paused", but for simplicity we just clear the interval
      // and let the UI know. We'll add a pseudo-pause by nullifying the ref and checking it.
    } else {
      // Resume
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            advanceTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Attendance Handlers ---
  const toggleAttendance = (memberId: string) => {
    setAttendance((prev) => {
      const next = { ...prev };
      if (next[memberId]) {
        delete next[memberId];
      } else {
        next[memberId] = {
          id: "",
          siteId: activeBranch,
          sessionId,
          memberId,
          date: session?.date || new Date().toISOString(),
          rpe: 5,
          effort: 3,
          medicalStatus: "healthy",
          createdAt: "",
          updatedAt: "",
        };
      }
      return next;
    });
  };

  const updateAttendance = (
    memberId: string,
    field: keyof SessionAttendance,
    value: string | number | boolean
  ) => {
    setAttendance((prev) => {
      if (!prev[memberId]) return prev;
      return {
        ...prev,
        [memberId]: { ...prev[memberId], [field]: value },
      };
    });
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const records = Object.values(attendance);
      if (records.length > 0) {
        await plannerService.saveAttendanceBatch(
          activeBranch,
          sessionId,
          records
        );
      }

      if (session) {
        await plannerService.updateSession(sessionId, {
          status: "completed",
          coachNotes,
        });
      }

      router.push("/training/planner");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const presentCount = Object.keys(attendance).length;
  // Get unique exercises across all groups to display for timing
  const allSessionExercises =
    session.groupedExercises?.flatMap((g) => g.exercises) || [];
  const uniqueExercises = Array.from(
    new Map(allSessionExercises.map((e) => [e.id, e])).values()
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/training/planner")}
          className="text-zinc-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <div className="text-right">
          <h1 className="text-xl font-bold text-zinc-900">{session.title}</h1>
          <div className="text-sm text-zinc-500">
            {session.targetGroups?.join(", ") || session.ageGroup} |{" "}
            {session.location === "indoor" ? "В зала" : "На открито"}
          </div>
        </div>
      </div>

      {/* Interval Timer Panel */}
      <Card className="mb-8 border-indigo-100 shadow-sm bg-zinc-950 text-white overflow-hidden">
        <CardContent className="p-0">
          {activeExercise ? (
            <div
              className={cn(
                "p-8 text-center transition-colors duration-500",
                timerState === "work"
                  ? "bg-emerald-900/50"
                  : timerState === "rest"
                    ? "bg-amber-900/50"
                    : timerState === "finished"
                      ? "bg-indigo-900/50"
                      : "bg-zinc-900"
              )}
            >
              <div className="mb-4">
                <Badge
                  variant="outline"
                  className="text-indigo-300 border-indigo-500/30 mb-2"
                >
                  {activeExercise.category.toUpperCase()}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {activeExercise.name}
                </h2>
                {activeExercise.defaultSets && (
                  <p className="text-zinc-400 mt-2 font-medium">
                    Серия {currentSet} от {activeExercise.defaultSets}
                  </p>
                )}
              </div>

              <div className="text-7xl sm:text-9xl font-black tracking-tighter mb-2 tabular-nums">
                {formatTime(timeRemaining)}
              </div>

              <div className="text-xl font-bold mb-8 uppercase tracking-widest text-white/50">
                {timerState === "work"
                  ? "РАБОТА"
                  : timerState === "rest"
                    ? "ПОЧИВКА"
                    : timerState === "finished"
                      ? "КРАЙ"
                      : ""}
              </div>

              <div className="flex justify-center gap-4">
                {timerState !== "finished" && (
                  <Button
                    size="lg"
                    onClick={() => toggleTimerPause()}
                    className="bg-white text-zinc-950 hover:bg-zinc-200"
                  >
                    <Pause className="w-5 h-5" />
                  </Button>
                )}
                {timerState !== "finished" && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={skipInterval}
                    className="border-white/20 hover:bg-white/10"
                  >
                    <SkipForward className="w-5 h-5 mr-2" /> Пропусни
                  </Button>
                )}
                <Button size="lg" variant="destructive" onClick={stopExercise}>
                  Затвори
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-zinc-900">
              <div className="flex items-center gap-2 mb-4 text-zinc-400">
                <Timer className="w-5 h-5" />
                <h3 className="font-bold">
                  План на тренировката (Изберете за старт)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {uniqueExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex justify-between items-center bg-zinc-800 p-3 rounded-xl border border-zinc-700"
                  >
                    <div>
                      <div className="font-bold text-sm text-zinc-100">
                        {ex.name}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {ex.defaultSets
                          ? `${ex.defaultSets} серии x ${ex.defaultWorkSec}с`
                          : `${ex.durationMinutes} мин`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => startExercise(ex)}
                      className="bg-indigo-600 hover:bg-indigo-500"
                    >
                      <Play className="w-4 h-4 mr-1" /> Старт
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            Присъствия и Натоварване
          </h2>
          <Badge variant="secondary" className="text-sm">
            {presentCount} / {members.length} присъстват
          </Badge>
        </div>

        <div className="space-y-4">
          {members.map((member) => {
            const isPresent = !!attendance[member.id];
            const att = attendance[member.id];

            return (
              <div
                key={member.id}
                className={`p-4 rounded-xl border transition-all ${isPresent ? "border-indigo-200 bg-white shadow-sm" : "border-zinc-200 bg-zinc-50/50"}`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isPresent}
                    onCheckedChange={() => toggleAttendance(member.id)}
                    className="w-6 h-6 rounded-md"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-zinc-900 text-lg">
                      {member.firstName} {member.lastName}
                    </div>
                  </div>
                  {isPresent && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          att.medicalStatus === "healthy"
                            ? "default"
                            : "outline"
                        }
                        className={
                          att.medicalStatus === "healthy"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : ""
                        }
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "medicalStatus",
                            "healthy"
                          )
                        }
                      >
                        ОК
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          att.medicalStatus === "discomfort"
                            ? "default"
                            : "outline"
                        }
                        className={
                          att.medicalStatus === "discomfort"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : ""
                        }
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "medicalStatus",
                            "discomfort"
                          )
                        }
                      >
                        Болки
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          att.medicalStatus === "injured"
                            ? "default"
                            : "outline"
                        }
                        className={
                          att.medicalStatus === "injured"
                            ? "bg-red-500 hover:bg-red-600"
                            : ""
                        }
                        onClick={() =>
                          updateAttendance(
                            member.id,
                            "medicalStatus",
                            "injured"
                          )
                        }
                      >
                        Контузия
                      </Button>
                    </div>
                  )}
                </div>

                {isPresent && (
                  <div className="mt-6 pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in fade-in duration-300">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2 text-zinc-600">
                          <Activity className="w-4 h-4" /> RPE (Умора: 1-10)
                        </Label>
                        <span className="font-black text-lg text-indigo-600">
                          {att.rpe}
                        </span>
                      </div>
                      <input
                        type="range"
                        value={att.rpe}
                        min={1}
                        max={10}
                        step={1}
                        onChange={(e) =>
                          updateAttendance(
                            member.id,
                            "rpe",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <span>Много леко</span>
                        <span>Изтощение</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2 text-zinc-600">
                          <Target className="w-4 h-4" /> Старание (1-5)
                        </Label>
                        <span className="font-black text-lg text-emerald-600">
                          {att.effort}
                        </span>
                      </div>
                      <input
                        type="range"
                        value={att.effort}
                        min={1}
                        max={5}
                        step={1}
                        onChange={(e) =>
                          updateAttendance(
                            member.id,
                            "effort",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full accent-emerald-600"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <span>Слабо</span>
                        <span>Перфектно</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Coach Notes */}
      <div className="mb-8 space-y-2">
        <Label>Треньорски Дневник (Бележки за сесията)</Label>
        <Textarea
          placeholder="Напр. Групата беше много разсеяна днес. Утре да наблегнем на дисциплината..."
          className="h-32 bg-amber-50/50 border-amber-200 focus-visible:ring-amber-500"
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
        />
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t shadow-lg z-50 flex justify-center">
        <Button
          size="lg"
          onClick={handleFinish}
          disabled={isSaving}
          className="w-full max-w-md bg-zinc-950 text-white rounded-xl shadow-xl hover:bg-zinc-800"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Завърши и Запази ({presentCount} деца)
        </Button>
      </div>
    </div>
  );
}
