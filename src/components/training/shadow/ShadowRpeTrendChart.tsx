"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrainingSession } from "@/types/training.types";

export interface ShadowRpeTrendChartProps {
  sessions: TrainingSession[];
  athleteId?: string | null;
  athleteName?: string;
  className?: string;
}

interface TrendPoint {
  date: Date;
  dateLabel: string;
  rpe: number;
  paceSec?: number;
  durationMinutes: number;
  mode: string;
  sessionId?: string;
}

export function ShadowRpeTrendChart({
  sessions,
  athleteId,
  athleteName,
  className,
}: ShadowRpeTrendChartProps) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `rpeGradient-${rawId}`;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Extract chronological data points
  const points = useMemo<TrendPoint[]>(() => {
    if (!sessions || sessions.length === 0) return [];

    const relevantSessions = athleteId
      ? sessions.filter(
          (s) => Array.isArray(s.memberIds) && s.memberIds.includes(athleteId)
        )
      : sessions;

    // Sort chronologically ascending (oldest first)
    const sorted = [...relevantSessions].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });

    // Take up to latest 12 sessions for a clear sparkline
    const latest = sorted.slice(-12);

    return latest
      .map((s) => {
        const detailsWithIndiv =
          s.shadowDetails as TrainingSession["shadowDetails"] & {
            individualRpe?: Record<string, number>;
          };

        let rpe = 5;
        if (athleteId) {
          rpe =
            detailsWithIndiv?.individualRpe?.[athleteId] ??
            s.shadowDetails?.rpeScores?.[athleteId] ??
            s.rpeScores?.[athleteId] ??
            5;
        } else {
          // Club average for this session
          const scores =
            detailsWithIndiv?.individualRpe ||
            s.shadowDetails?.rpeScores ||
            s.rpeScores;
          if (scores) {
            const values = Object.values(scores).filter(
              (v): v is number => typeof v === "number" && v > 0
            );
            if (values.length > 0) {
              rpe = Math.round(
                values.reduce((sum, v) => sum + v, 0) / values.length
              );
            }
          }
        }

        const sessionDate = new Date(s.date);
        return {
          date: sessionDate,
          dateLabel: format(sessionDate, "dd MMM", { locale: bg }),
          rpe: Math.max(1, Math.min(10, rpe)),
          paceSec: s.shadowDetails?.paceSec,
          durationMinutes: Math.round((s.durationMs || 0) / 60000),
          mode: s.shadowDetails?.mode || s.type,
          sessionId: s.id,
        };
      })
      .filter((p) => !isNaN(p.date.getTime()));
  }, [sessions, athleteId]);

  // Compute trend and stats
  const stats = useMemo(() => {
    if (points.length === 0) {
      return { avgRpe: 0, delta: 0, trend: "none" as const };
    }

    const sum = points.reduce((acc, p) => acc + p.rpe, 0);
    const avgRpe = Number((sum / points.length).toFixed(1));

    if (points.length < 2) {
      return { avgRpe, delta: 0, trend: "stable" as const };
    }

    const mid = Math.floor(points.length / 2);
    const firstHalf = points.slice(0, mid);
    const secondHalf = points.slice(mid);

    const firstAvg =
      firstHalf.reduce((acc, p) => acc + p.rpe, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((acc, p) => acc + p.rpe, 0) / secondHalf.length;

    const delta = Number((secondAvg - firstAvg).toFixed(1));

    let trend: "improving" | "stable" | "fatigue" = "stable";
    if (delta <= -0.5) {
      trend = "improving"; // Lower RPE for same work = physiological adaptation!
    } else if (delta >= 0.5) {
      trend = "fatigue"; // Rising RPE = fatigue / overreaching
    }

    return { avgRpe, delta, trend };
  }, [points]);

  // SVG Chart Geometry
  const width = 500;
  const height = 160;
  const paddingX = 35;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Convert points to SVG coordinates (RPE 1-10)
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    if (points.length === 1) {
      return [
        {
          x: width / 2,
          y: height - paddingY - ((points[0].rpe - 1) / 9) * chartHeight,
          point: points[0],
        },
      ];
    }

    const stepX = chartWidth / (points.length - 1);
    return points.map((p, idx) => {
      const x = paddingX + idx * stepX;
      // y=10 is at top (paddingY), y=1 is at bottom (height - paddingY)
      const ratio = (p.rpe - 1) / 9;
      const y = height - paddingY - ratio * chartHeight;
      return { x, y, point: p };
    });
  }, [points, chartWidth, chartHeight, width, height, paddingX, paddingY]);

  // Path strings
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length < 2) return { linePath: "", areaPath: "" };

    const first = coords[0];
    const last = coords[coords.length - 1];

    let lPath = `M ${first.x} ${first.y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      // Subtle bezier curve
      const cpX = (prev.x + curr.x) / 2;
      lPath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const aPath = `${lPath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [coords, height, paddingY]);

  if (points.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950",
          className
        )}
      >
        <Activity className="mb-2 size-8 text-zinc-400" />
        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          Няма достатъчно данни за крива на умората
        </h4>
        <p className="mt-1 max-w-xs text-xs text-zinc-500">
          {athleteName
            ? `Състезателят ${athleteName} няма регистрирани индивидуални сесии с RPE оценка.`
            : "Регистрирайте тренировки с RPE оценка, за да активирате анализа на адаптацията."}
        </p>
      </div>
    );
  }

  const activePoint =
    hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1];

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs transition-all sm:p-5 dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
    >
      {/* Header with Title and Trend Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl",
              stats.trend === "improving"
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : stats.trend === "fatigue"
                  ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            )}
          >
            {stats.trend === "improving" ? (
              <TrendingDown className="size-4" />
            ) : stats.trend === "fatigue" ? (
              <TrendingUp className="size-4" />
            ) : (
              <Activity className="size-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wider text-zinc-900 uppercase sm:text-sm dark:text-white">
              Тенденция на умората (RPE Trend)
            </h4>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {athleteName
                ? `Динамика на натоварването за ${athleteName}`
                : "Средно клубна крива на натоварването (последен цикъл)"}
            </p>
          </div>
        </div>

        {/* Adaptation Status Badge */}
        {stats.trend === "improving" && (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
            <ArrowDownRight className="mr-1 size-3.5" />
            Повишена издръжливост ({stats.delta} RPE)
          </Badge>
        )}
        {stats.trend === "fatigue" && (
          <Badge className="border-amber-500/30 bg-amber-500/10 text-[11px] font-bold text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
            <ArrowUpRight className="mr-1 size-3.5" />
            Повишено натоварване (+{stats.delta} RPE)
          </Badge>
        )}
        {stats.trend === "stable" && (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-[11px] font-bold text-blue-700 dark:text-blue-300"
          >
            <ArrowRight className="mr-1 size-3.5" />
            Стабилно натоварване (±{Math.abs(stats.delta)} RPE)
          </Badge>
        )}
      </div>

      {/* Interactive Sparkline Chart */}
      <div className="relative my-3 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={
                  stats.trend === "improving"
                    ? "#10b981"
                    : stats.trend === "fatigue"
                      ? "#f59e0b"
                      : "#3b82f6"
                }
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor={
                  stats.trend === "improving"
                    ? "#10b981"
                    : stats.trend === "fatigue"
                      ? "#f59e0b"
                      : "#3b82f6"
                }
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Horizontal RPE Reference Lines */}
          {[
            { rpe: 10, label: "10 Макс" },
            { rpe: 7, label: "7 Тежко" },
            { rpe: 5, label: "5 Умерено" },
            { rpe: 2, label: "2 Леко" },
          ].map((refLine) => {
            const y = height - paddingY - ((refLine.rpe - 1) / 9) * chartHeight;
            return (
              <g key={`ref-${refLine.rpe}`}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(148, 163, 184, 0.7)"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {refLine.label}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Sparkline Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={
                stats.trend === "improving"
                  ? "#10b981"
                  : stats.trend === "fatigue"
                    ? "#f59e0b"
                    : "#3b82f6"
              }
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {coords.map((c, idx) => {
            const isHovered = hoveredIndex === idx;
            const isLatest = idx === coords.length - 1;

            return (
              <g
                key={`point-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover target */}
                <circle cx={c.x} cy={c.y} r="14" fill="transparent" />

                {/* Point Outer Ring */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isHovered ? "8" : "6"}
                    fill={
                      stats.trend === "improving"
                        ? "#10b981"
                        : stats.trend === "fatigue"
                          ? "#f59e0b"
                          : "#3b82f6"
                    }
                    fillOpacity="0.3"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? "5" : "3.5"}
                  fill={
                    c.point.rpe >= 8
                      ? "#ef4444"
                      : c.point.rpe >= 6
                        ? "#f59e0b"
                        : "#10b981"
                  }
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* X-axis Date Label */}
                <text
                  x={c.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? "#3b82f6" : "rgba(148, 163, 184, 0.85)"}
                  fontSize="9.5"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {c.point.dateLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Point Detail Tooltip Card */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white">
              {format(activePoint.point.date, "dd MMMM yyyy г.", {
                locale: bg,
              })}
              :
            </span>
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">
              {activePoint.point.durationMinutes} мин
            </span>
            {activePoint.point.paceSec && (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                Темпо: {activePoint.point.paceSec}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Натоварване:</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-black",
                activePoint.point.rpe <= 3
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : activePoint.point.rpe <= 6
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : activePoint.point.rpe <= 8
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              )}
            >
              RPE {activePoint.point.rpe}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
