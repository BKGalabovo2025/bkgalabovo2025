"use client";

import { useEffect, useState } from "react";
import { getAssessmentsByMemberId } from "@/services/assessment-service";
import { MemberAssessment } from "@/types/assessment.types";
import { Loader2, TrendingUp } from "lucide-react";
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
  const [assessments, setAssessments] = useState<MemberAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const data = await getAssessmentsByMemberId(memberId);
        setAssessments(
          data.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (assessments.length === 0) {
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
      {Object.entries(groupedAssessments).map(([testName, data]) => {
        // Format data for Recharts
        const chartData = data.map((d) => ({
          ...d,
          formattedDate: format(new Date(d.date), "dd MMM yy", { locale: bg }),
        }));

        return (
          <div
            key={testName}
            className="bg-white border border-zinc-100 rounded-3xl p-6"
          >
            <div className="flex justify-between items-start mb-6">
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
              <ResponsiveContainer width="100%" height="100%">
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
                ) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center text-sm bg-zinc-50 px-4 py-3 rounded-xl"
                  >
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
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
