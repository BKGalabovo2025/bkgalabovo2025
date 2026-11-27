"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface AssessmentChartPoint {
  score?: number | string;
  vo2max?: number;
  scoreDisplay?: string;
  formattedDate: string;
}

export function MemberAssessmentsChart({
  data,
  dataKey = "score",
  seriesName = "Резултат",
  yDomain,
}: {
  data: AssessmentChartPoint[];
  dataKey?: "score" | "vo2max";
  seriesName?: string;
  yDomain?: [string | number, string | number];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 6, fill: "#4f46e5" }}
            activeDot={{ r: 8 }}
            name={seriesName}
          />
          <CartesianGrid
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeDasharray="5 5"
          />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickMargin={10}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickMargin={10}
            domain={yDomain}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border, #e4e4e7)",
              backgroundColor: "var(--card, #ffffff)",
              color: "var(--card-foreground, #18181b)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
            }}
            labelStyle={{ color: "var(--card-foreground, #18181b)" }}
            formatter={
              dataKey === "score"
                ? (
                    _value: unknown,
                    _name: unknown,
                    props: { payload?: { scoreDisplay?: string } }
                  ) => [
                    props.payload?.scoreDisplay || String(_value),
                    seriesName,
                  ]
                : undefined
            }
            labelFormatter={(label) => `Дата: ${label}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MemberAssessmentsChart;
