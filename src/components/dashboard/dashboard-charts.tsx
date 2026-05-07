"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/currency";

interface DashboardChartsProps {
  data: { name: string; revenue: number }[];
}

export const RevenueChart = ({ data }: DashboardChartsProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[300px] w-full bg-zinc-50 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#09090b" stopOpacity={0.05} />
              <stop offset="95%" stopColor="#09090b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f4f4f5"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#a1a1aa",
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 500 }}
            tickFormatter={(value) => formatPrice(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "1rem",
              border: "1px solid #f4f4f5",
              boxShadow: "none",
              padding: "12px",
            }}
            itemStyle={{
              color: "#09090b",
              fontWeight: "500",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#09090b"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
