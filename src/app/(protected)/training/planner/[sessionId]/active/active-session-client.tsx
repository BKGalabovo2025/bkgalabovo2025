"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { plannerService } from "@/services/planner-service";
import { getAllMembers } from "@/services/member-service";
import { PlannerSession, SessionAttendance } from "@/types/planner.types";
import { Member } from "@/types/member.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Loader2,
  ArrowLeft,
  Activity,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  sessionId: string;
}

export default function ActiveSessionClient({ sessionId }: Props) {
  const router = useRouter();
  const { activeBranch } = useAppStore();
  const [session, setSession] = useState<PlannerSession | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Global Notes
  const [coachNotes, setCoachNotes] = useState("");

  // Attendance State
  // Map memberId -> SessionAttendance record
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
      // For a real app, you might filter members by ageGroup, but we'll show all active for now
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

  // Timer Logic
  const toggleTimer = () => {
    if (isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Attendance Handlers
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
    value: any
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
      // Save all attendance records
      const records = Object.values(attendance);
      if (records.length > 0) {
        await plannerService.saveAttendanceBatch(
          activeBranch,
          sessionId,
          records
        );
      }

      // Update session status and notes
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
            {session.ageGroup} |{" "}
            {session.location === "indoor" ? "В зала" : "На открито"}
          </div>
        </div>
      </div>

      {/* Interval Timer */}
      <Card className="mb-8 border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
        <CardContent className="p-8 text-center">
          <div className="text-6xl sm:text-8xl font-black text-indigo-900 tracking-tighter mb-6 tabular-nums">
            {formatTime(timerSeconds)}
          </div>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={toggleTimer}
              className={
                isTimerRunning
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }
            >
              {isTimerRunning ? (
                <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isTimerRunning ? "Пауза" : "Старт Таймер"}
            </Button>
            <Button size="lg" variant="outline" onClick={resetTimer}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
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
