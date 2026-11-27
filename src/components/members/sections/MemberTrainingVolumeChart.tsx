"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrainingVolumeChartPoint {
  date: string;
  rpe: number;
}

export function MemberTrainingVolumeChart({
  data,
}: {
  data: TrainingVolumeChartPoint[];
}) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={1}
        minHeight={1}
      >
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-zinc-200 dark:stroke-zinc-800"
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
              border: "1px solid var(--border, #e4e4e7)",
              backgroundColor: "var(--card, #ffffff)",
              color: "var(--card-foreground, #18181b)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{
              fontWeight: "bold",
              color: "var(--card-foreground, #18181b)",
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
  );
}

export default MemberTrainingVolumeChart;
