"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { plannerService } from "@/services/planner-service";
import { SessionAttendance, PlannerSession } from "@/types/planner.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  memberId: string;
}

export function MemberTrainingVolumeTab({ memberId }: Props) {
  const { activeBranch } = useAppStore();
  const [attendances, setAttendances] = useState<SessionAttendance[]>([]);
  const [sessions, setSessions] = useState<Record<string, PlannerSession>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, activeBranch]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const atts = await plannerService.getMemberAttendance(
        activeBranch,
        memberId
      );
      // Sort chronologically for charts
      atts.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const sessList = await plannerService.getSessions(activeBranch);
      const sessMap: Record<string, PlannerSession> = {};
      sessList.forEach((s) => {
        sessMap[s.id] = s;
      });

      setAttendances(atts);
      setSessions(sessMap);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
        <Activity className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 mb-2">
          Няма данни за натоварване
        </h3>
        <p className="text-zinc-500 max-w-md mx-auto">
          Този състезател все още няма записани присъствия в Универсалния
          Планировчик.
        </p>
      </div>
    );
  }

  // Calculate Stats
  let indoorCount = 0;
  let outdoorCount = 0;
  let medicalIssues = 0;

  const chartData = attendances.map((att) => {
    const s = sessions[att.sessionId];
    if (s) {
      if (s.location === "indoor") indoorCount++;
      if (s.location === "outdoor") outdoorCount++;
    }
    if (att.medicalStatus !== "healthy") medicalIssues++;

    return {
      date: new Date(att.date).toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
      }),
      rpe: att.rpe,
      effort: att.effort,
      medicalStatus: att.medicalStatus,
      isCamp: s?.mode === "camp",
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-indigo-900">
              {attendances.length}
            </div>
            <div className="text-xs text-indigo-700 font-medium uppercase tracking-wider">
              Общо Тренировки
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-zinc-900">
              {indoorCount}
            </div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              В Зала
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-zinc-900">
              {outdoorCount}
            </div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              На Открито
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-100 bg-rose-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-rose-900">
              {medicalIssues}
            </div>
            <div className="text-xs text-rose-700 font-medium uppercase tracking-wider">
              Оплаквания
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Мониторинг на Умората (RPE 1-10)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e4e4e7"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{
                    fontWeight: "bold",
                    color: "#18181b",
                    marginBottom: "4px",
                  }}
                />
                <ReferenceLine
                  y={8}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    position: "top",
                    value: "Зона на преумора",
                    fill: "#ef4444",
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rpe"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
                  name="Ниво на умора (RPE)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 px-1">
          История на присъствията
        </h3>
        {attendances
          .slice()
          .reverse()
          .map((att) => {
            const s = sessions[att.sessionId];
            if (!s) return null;

            return (
              <div
                key={att.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-zinc-900">
                      {new Date(att.date).toLocaleDateString("bg-BG")}
                    </span>
                    {s.mode === "camp" && (
                      <Badge
                        variant="destructive"
                        className="text-[9px] uppercase"
                      >
                        Лагер
                      </Badge>
                    )}
                    {att.medicalStatus === "discomfort" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase bg-amber-50 text-amber-700 border-amber-200"
                      >
                        Болки
                      </Badge>
                    )}
                    {att.medicalStatus === "injured" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase bg-red-50 text-red-700 border-red-200"
                      >
                        Контузия
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">
                    {s.title} •{" "}
                    {s.location === "indoor" ? "В зала" : "На открито"}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">
                      Умора
                    </div>
                    <div
                      className={`text-lg font-black ${att.rpe >= 8 ? "text-red-600" : "text-indigo-600"}`}
                    >
                      {att.rpe}/10
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-0.5">
                      Старание
                    </div>
                    <div className="text-lg font-black text-emerald-600">
                      {att.effort}/5
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
