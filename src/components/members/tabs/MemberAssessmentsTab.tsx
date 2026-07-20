"use client";

import { useEffect, useState } from "react";
import { getAssessmentsByMemberId } from "@/services/assessment-service";
import { MemberAssessment } from "@/types/assessment.types";
import { beepTestService } from "@/services/beep-test-service";
import { BeepTestResult } from "@/types/beep-test.types";
import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { generateAssessmentAnalysis } from "@/lib/assessment-analysis";
import { useAppStore } from "@/store/use-app-store";
import { Loader2, TrendingUp, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

export const MemberAssessmentsTab = ({ memberId }: { memberId: string }) => {
  const getScoreColor = (score: string) => {
    if (score === "Елитен състезател") return "bg-purple-100 text-purple-700";
    if (score === "Отличен") return "bg-emerald-100 text-emerald-700";
    if (score === "Лош") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  const getBeepTestReport = (entry: BeepTestResult) => {
    const vo2 = entry.vo2max;
    let text = `VO2 Max (${vo2} ml/kg/min) е индикатор за аеробния капацитет. В бадминтона той отговаря за бързото възстановяване между тежките разигравания. `;

    if (entry.score === "Елитен състезател") {
      text +=
        "Този резултат показва изключителна издръжливост. Състезателят може да поддържа интензивно темпо (Smash & Net) продължително време без спад във фокуса.";
    } else if (entry.score === "Отличен") {
      text +=
        "Много силна аеробна база. Позволява стабилна игра в 3-геймови мачове и бързо изчистване на лактата в паузите.";
    } else if (entry.score === "Добър" || entry.score === "Среден") {
      text +=
        "Добра основа, но при тежки турнири (много мачове в един ден) умората ще се натрупа. Препоръчват се специфични интервални тренировки на корта.";
    } else {
      text +=
        "Критично нисък капацитет. Умората бързо ще влоши работата с крака (сплит степ) и точността на ударите. Нужна е спешна работа за обща издръжливост.";
    }
    return text;
  };
  const calculateBeepTestMetrics = (level: number, shuttle: number) => {
    const shuttlesPerLevel = [
      0, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15,
      16, 16,
    ];
    let totalDistance = 0;
    let totalTimeSec = 0;

    for (let l = 1; l < level; l++) {
      const s = shuttlesPerLevel[l] || 16;
      totalDistance += s * 20;
      const speed = 8.0 + l * 0.5;
      const timePerShuttle = 20 / (speed / 3.6);
      totalTimeSec += s * timePerShuttle;
    }

    totalDistance += shuttle * 20;
    const currentSpeed = 8.0 + level * 0.5;
    const timePerShuttle = 20 / (currentSpeed / 3.6);
    totalTimeSec += shuttle * timePerShuttle;

    const m = Math.floor(totalTimeSec / 60);
    const s = Math.floor(totalTimeSec % 60);

    return {
      distance: totalDistance,
      maxSpeed: currentSpeed,
      timeDisplay: `${m}:${s.toString().padStart(2, "0")}`,
    };
  };

  const { activeBranch } = useAppStore();
  const [assessments, setAssessments] = useState<MemberAssessment[]>([]);
  const [beepResults, setBeepResults] = useState<BeepTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const [data, beepData] = await Promise.all([
          getAssessmentsByMemberId(memberId),
          beepTestService.getMemberResults(activeBranch, memberId),
        ]);

        setAssessments(
          data.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
        setBeepResults(beepData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, [memberId, activeBranch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (assessments.length === 0 && beepResults.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 border border-zinc-100 rounded-3xl">
        <TrendingUp className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-700">
          Няма данни от тестове
        </h3>
        <p className="text-sm text-zinc-500 mt-2">
          Започнете да провеждате тестове от меню &quot;Тренировъчен процес
          -&gt; Тестове&quot;.
        </p>
      </div>
    );
  }

  // Group by testName for separate charts
  const groupedAssessments = assessments.reduce(
    (acc, curr) => {
      if (!acc[curr.testName]) acc[curr.testName] = [];
      acc[curr.testName].push(curr);
      return acc;
    },
    {} as Record<string, MemberAssessment[]>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* BEEP TEST RESULTS CARD */}
      {beepResults.length > 0 && (
        <div className="bg-white border border-indigo-100 shadow-sm shadow-indigo-100/50 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h3 className="text-xl font-black text-indigo-950 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Бийп Тест (VO2 Max)
              </h3>
              <p className="text-sm text-zinc-500">
                История и Прогрес на аеробния капацитет
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={1}
              minHeight={1}
            >
              <LineChart
                data={beepResults.map((r) => ({
                  ...r,
                  formattedDate: format(new Date(r.date), "dd MMM yy", {
                    locale: bg,
                  }),
                }))}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <Line
                  type="monotone"
                  dataKey="vo2max"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#4f46e5" }}
                  activeDot={{ r: 8 }}
                  name="VO2 Max"
                />
                <CartesianGrid stroke="#f4f4f5" strokeDasharray="5 5" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#71717a" }}
                  tickMargin={10}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4 space-y-4">
            {[...beepResults].reverse().map((entry) => {
              const metrics = calculateBeepTestMetrics(
                entry.level,
                entry.shuttle
              );
              return (
                <div
                  key={entry.id}
                  className="flex flex-col bg-indigo-50/30 rounded-xl overflow-hidden border border-indigo-100/50"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm px-5 py-4 gap-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-zinc-900 text-lg">
                          Ниво {entry.level}:{entry.shuttle}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(entry.score)}`}
                        >
                          {entry.score}
                        </span>
                      </div>
                      <div className="text-zinc-600 font-medium text-sm">
                        VO2 Max:{" "}
                        <span className="text-indigo-600 font-black">
                          {entry.vo2max} ml/kg/min
                        </span>{" "}
                        <span className="text-zinc-400 mx-1">•</span>{" "}
                        {entry.period}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <div className="bg-white/80 px-2 py-1 rounded-md border border-indigo-100/50 flex items-center gap-1.5 shadow-sm">
                          <span className="text-zinc-500 font-medium">
                            Разстояние:
                          </span>
                          <span className="font-bold text-zinc-900">
                            {metrics.distance} м
                          </span>
                        </div>
                        <div className="bg-white/80 px-2 py-1 rounded-md border border-indigo-100/50 flex items-center gap-1.5 shadow-sm">
                          <span className="text-zinc-500 font-medium">
                            Общо време:
                          </span>
                          <span className="font-bold text-zinc-900">
                            {metrics.timeDisplay} мин
                          </span>
                        </div>
                        <div className="bg-white/80 px-2 py-1 rounded-md border border-indigo-100/50 flex items-center gap-1.5 shadow-sm">
                          <span className="text-zinc-500 font-medium">
                            Макс. скорост:
                          </span>
                          <span className="font-bold text-zinc-900">
                            {metrics.maxSpeed.toFixed(1)} км/ч
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-zinc-500 font-bold text-xs sm:text-right bg-white/60 px-3 py-1.5 rounded-lg shadow-sm">
                      {format(new Date(entry.date), "dd MMMM yyyy", {
                        locale: bg,
                      })}
                    </div>
                  </div>

                  {/* AI / Coach Report Section */}
                  <div className="bg-white/60 px-5 py-3 border-t border-indigo-100/50 flex gap-3 items-start">
                    <div className="mt-0.5 text-indigo-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide block mb-1">
                        Треньорски Анализ
                      </span>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {getBeepTestReport(entry)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(groupedAssessments).map(([testName, data]) => {
        // Format data for Recharts
        const chartData = data.map((d) => ({
          ...d,
          formattedDate: format(new Date(d.date), "dd MMM yy", { locale: bg }),
        }));

        return (
          <div
            key={testName}
            className="bg-white border border-zinc-100 rounded-3xl p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold">{testName}</h3>
                <p className="text-sm text-zinc-500">Прогрес във времето</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                {data[0].ageGroupAtTest}
              </span>
            </div>

            {/* CHART */}
            <div className="h-64 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#4f46e5" }}
                    activeDot={{ r: 8 }}
                  />
                  <CartesianGrid stroke="#f4f4f5" strokeDasharray="5 5" />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 12, fill: "#71717a" }}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#71717a" }}
                    tickMargin={10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(
                      _value: unknown,
                      _name: unknown,
                      props: { payload?: { scoreDisplay?: string } }
                    ) => [
                      props.payload?.scoreDisplay || String(_value),
                      "Резултат",
                    ]}
                    labelFormatter={(label) => `Дата: ${label}`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* HISTORY LIST */}
            <div className="mt-6 border-t border-zinc-100 pt-4 space-y-3">
              {data.reverse().map(
                (
                  entry // Reverse just for the list to show newest first
                ) => {
                  let analysis = entry.coachAnalysis;
                  let recommendation = entry.recommendedExercises;

                  if (!analysis && !recommendation) {
                    const testDef = BADMINTON_TESTS.find(
                      (t) => t.id === entry.testId
                    );
                    if (testDef) {
                      const dynamicResult = generateAssessmentAnalysis(
                        entry.testId,
                        entry.score,
                        testDef.scoreType
                      );
                      analysis = dynamicResult.analysis;
                      recommendation = dynamicResult.recommendation;
                    }
                  }

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col bg-zinc-50 rounded-xl overflow-hidden"
                    >
                      <div className="flex justify-between items-center text-sm px-4 py-3">
                        <div>
                          <span className="font-bold text-zinc-900">
                            {entry.scoreDisplay}
                          </span>
                          {entry.notes && (
                            <span className="ml-2 text-zinc-500 italic">
                              - {entry.notes}
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-500 text-xs text-right">
                          {format(new Date(entry.date), "dd MMMM yyyy", {
                            locale: bg,
                          })}
                          <br />
                          от {entry.recordedBy.userName}
                        </div>
                      </div>
                      {/* Coach Analysis & Recommendations */}
                      {(analysis || recommendation) && (
                        <div className="bg-indigo-50/50 px-4 py-3 border-t border-indigo-100/50 space-y-2">
                          {analysis && (
                            <div>
                              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide block mb-1">
                                Треньорски Анализ
                              </span>
                              <p className="text-sm text-zinc-700">
                                {analysis}
                              </p>
                            </div>
                          )}
                          {recommendation && (
                            <div>
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1 mt-2">
                                Препоръка
                              </span>
                              <p className="text-sm text-zinc-700">
                                {recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
