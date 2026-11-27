"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface FinancialChartSlice {
  name: string;
  value: number;
  color: string;
}

export function FinancialReportPieChart({
  data,
  formatPrice,
}: {
  data: FinancialChartSlice[];
  formatPrice: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "1px solid #f4f4f5",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)",
            fontSize: "12px",
            fontWeight: "300",
          }}
          formatter={(value: unknown) => formatPrice(Number(value))}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default FinancialReportPieChart;
