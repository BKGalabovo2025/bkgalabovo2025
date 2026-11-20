"use client";

import { Flame, Sparkles } from "lucide-react";
import React, { useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type HeatmapZoneKey =
  | "frontForehand"
  | "frontBackhand"
  | "midForehand"
  | "midBackhand"
  | "backForehand"
  | "backBackhand"
  | "overhead";

export const HEATMAP_ZONE_LABELS: Record<string, string> = {
  frontForehand: "Мрежа Форхенд",
  frontBackhand: "Мрежа Бекхенд",
  midForehand: "Среда Форхенд",
  midBackhand: "Среда Бекхенд",
  backForehand: "Задна Форхенд",
  backBackhand: "Задна Бекхенд",
  overhead: "Задна линия (Овърхед)",
};

const ZONE_DESCRIPTIONS: Record<string, string> = {
  frontForehand:
    "Придвижване към преден десен ъгъл. Акцент върху мек контакт на мрежата, тумблиращ удар и бързо изтласкване назад.",
  frontBackhand:
    "Придвижване към преден ляв ъгъл. Изпитва лунгираща стабилност и баланс на водещия крак при бекхенд пресичане.",
  midForehand:
    "Странично придвижване надясно за форхенд драйв или контра-атака от средна зона. Развива експлозивна странична стъпка.",
  midBackhand:
    "Странично придвижване наляво за бекхенд защита или плосък драйв. Ключово за бърза реакция при смечове.",
  backForehand:
    "Дълбоко изтегляне към заден форхенд ъгъл. Изисква пълен ножичен скок (scissors kick) или чист крос-степ.",
  backBackhand:
    "Изтегляне към заден бекхенд ъгъл. Най-трудното биомеханично движение за обръщане на гръб и овърхед отиграване.",
  overhead:
    "Централно или диагонално изтегляне за директна атака от въздуха. Развива взривна сила за атакуващ смеч.",
};

export interface CourtHeatmapPreviewProps {
  heatmap?: Record<string, number>;
  leftHanded?: boolean;
  className?: string;
  interactive?: boolean;
  showDetailsCard?: boolean;
  onZoneClick?: (zoneKey: string) => void;
}

export function CourtHeatmapPreview({
  heatmap = {},
  leftHanded = false,
  className,
  interactive = true,
  showDetailsCard = true,
  onZoneClick,
}: CourtHeatmapPreviewProps) {
  const rawId = useId().replace(/:/g, "");
  const filterId = `heatGlow-${rawId}`;

  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Normalize overhead to backBackhand if needed or keep counted
  const normalizedData = useMemo(() => {
    const data: Record<string, number> = {
      frontForehand: heatmap.frontForehand || 0,
      frontBackhand: heatmap.frontBackhand || 0,
      midForehand: heatmap.midForehand || 0,
      midBackhand: heatmap.midBackhand || 0,
      backForehand: heatmap.backForehand || 0,
      backBackhand: (heatmap.backBackhand || 0) + (heatmap.overhead || 0),
    };
    return data;
  }, [heatmap]);

  const totalHits = useMemo(() => {
    return Object.values(normalizedData).reduce((sum, count) => sum + count, 0);
  }, [normalizedData]);

  const maxHits = useMemo(() => {
    return Math.max(...Object.values(normalizedData), 1);
  }, [normalizedData]);

  // Identify most active zone
  const dominantZone = useMemo(() => {
    let topZone = "";
    let topCount = 0;
    Object.entries(normalizedData).forEach(([zone, count]) => {
      if (count > topCount) {
        topCount = count;
        topZone = zone;
      }
    });
    return topCount > 0 ? { zone: topZone, count: topCount } : null;
  }, [normalizedData]);

  const handleZoneSelect = (zoneKey: string) => {
    if (!interactive) return;
    const next = selectedZone === zoneKey ? null : zoneKey;
    setSelectedZone(next);
    if (onZoneClick) onZoneClick(zoneKey);
  };

  const getHeatStyling = (count: number, isSelected: boolean) => {
    if (count === 0) {
      return {
        fill: isSelected
          ? "rgba(59, 130, 246, 0.15)"
          : "rgba(148, 163, 184, 0.04)",
        stroke: isSelected ? "#3b82f6" : "rgba(148, 163, 184, 0.2)",
        strokeWidth: isSelected ? 3 : 1.5,
        strokeDasharray: count === 0 && !isSelected ? "4 4" : undefined,
      };
    }

    const ratio = count / maxHits;

    if (ratio >= 0.65) {
      // High intensity: neon red/crimson
      return {
        fill: isSelected ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 0.42)",
        stroke: "#ef4444",
        strokeWidth: isSelected ? 3.5 : 2,
        filter: `url(#${filterId})`,
      };
    }

    if (ratio >= 0.3) {
      // Medium intensity: amber/orange
      return {
        fill: isSelected
          ? "rgba(245, 158, 11, 0.5)"
          : "rgba(245, 158, 11, 0.35)",
        stroke: "#f59e0b",
        strokeWidth: isSelected ? 3 : 2,
      };
    }

    // Low intensity: emerald green
    return {
      fill: isSelected ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.25)",
      stroke: "#10b981",
      strokeWidth: isSelected ? 3 : 1.5,
    };
  };

  // Map coordinates according to left-handed orientation
  const zonesConfig = useMemo(() => {
    // Normal:
    // Left: frontBackhand, midBackhand, backBackhand
    // Right: frontForehand, midForehand, backForehand
    // Left-handed:
    // Left: frontForehand, midForehand, backForehand
    // Right: frontBackhand, midBackhand, backBackhand
    const leftKey = leftHanded ? "frontForehand" : "frontBackhand";
    const rightKey = leftHanded ? "frontBackhand" : "frontForehand";
    const midLeftKey = leftHanded ? "midForehand" : "midBackhand";
    const midRightKey = leftHanded ? "midBackhand" : "midForehand";
    const backLeftKey = leftHanded ? "backForehand" : "backBackhand";
    const backRightKey = leftHanded ? "backBackhand" : "backForehand";

    return [
      {
        key: leftKey,
        label: leftHanded ? "МРЕЖА ФОРХЕНД" : "МРЕЖА БЕКХЕНД",
        shortLabel: leftHanded ? "МРЕЖА Д" : "МРЕЖА Л",
        x: 0,
        y: 670,
        w: 305,
        h: 198,
        labelX: 152,
        labelY: 765,
      },
      {
        key: rightKey,
        label: leftHanded ? "МРЕЖА БЕКХЕНД" : "МРЕЖА ФОРХЕНД",
        shortLabel: leftHanded ? "МРЕЖА Л" : "МРЕЖА Д",
        x: 305,
        y: 670,
        w: 305,
        h: 198,
        labelX: 457,
        labelY: 765,
      },
      {
        key: midLeftKey,
        label: leftHanded ? "СРЕДА ФОРХЕНД" : "СРЕДА БЕКХЕНД",
        shortLabel: leftHanded ? "СРЕДА Д" : "СРЕДА Л",
        x: 0,
        y: 868,
        w: 305,
        h: 236,
        labelX: 152,
        labelY: 980,
      },
      {
        key: midRightKey,
        label: leftHanded ? "СРЕДА БЕКХЕНД" : "СРЕДА ФОРХЕНД",
        shortLabel: leftHanded ? "СРЕДА Л" : "СРЕДА Д",
        x: 305,
        y: 868,
        w: 305,
        h: 236,
        labelX: 457,
        labelY: 980,
      },
      {
        key: backLeftKey,
        label: leftHanded ? "ЗАДНА ФОРХЕНД" : "ЗАДНА БЕКХЕНД",
        shortLabel: leftHanded ? "ЗАДНА Д" : "ЗАДНА Л",
        x: 0,
        y: 1104,
        w: 305,
        h: 236,
        labelX: 152,
        labelY: 1220,
      },
      {
        key: backRightKey,
        label: leftHanded ? "ЗАДНА БЕКХЕНД" : "ЗАДНА ФОРХЕНД",
        shortLabel: leftHanded ? "ЗАДНА Л" : "ЗАДНА Д",
        x: 305,
        y: 1104,
        w: 305,
        h: 236,
        labelX: 457,
        labelY: 1220,
      },
    ];
  }, [leftHanded]);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Flame className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
              Топлинна карта на ударите (Heatmap)
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {totalHits > 0
                ? `${totalHits} удара разпределени по зони • Кликнете ъгъл за детайли`
                : "Няма отчетени удари за тази сесия"}
            </p>
          </div>
        </div>

        {dominantZone && (
          <Badge
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-[11px] font-bold text-red-700 dark:text-red-300"
          >
            🔥 Най-натоварена:{" "}
            {HEATMAP_ZONE_LABELS[dominantZone.zone] || dominantZone.zone} (
            {dominantZone.count})
          </Badge>
        )}
      </div>

      {/* SVG Interactive Court */}
      <div className="relative mx-auto flex max-w-sm justify-center rounded-2xl border border-zinc-200/90 bg-zinc-950 p-3 shadow-inner sm:p-4 dark:border-zinc-800">
        <svg
          viewBox="0 670 610 670"
          className="h-auto w-full max-w-85 overflow-visible select-none"
        >
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Court Floor */}
          <rect x="0" y="670" width="610" height="670" fill="#09090b" rx="12" />

          {/* Badminton Court Boundary Lines */}
          {/* Outer Boundary */}
          <rect
            x="4"
            y="670"
            width="602"
            height="666"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="3"
            rx="6"
          />
          {/* Singles Sidelines */}
          <line
            x1="46"
            y1="670"
            x2="46"
            y2="1336"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2"
          />
          <line
            x1="564"
            y1="670"
            x2="564"
            y2="1336"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2"
          />
          {/* Net Line (top) */}
          <line
            x1="0"
            y1="672"
            x2="610"
            y2="672"
            stroke="#ef4444"
            strokeWidth="4"
            strokeDasharray="6 4"
          />
          {/* Short Service Line */}
          <line
            x1="4"
            y1="868"
            x2="606"
            y2="868"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2"
          />
          {/* Center Dividing Line */}
          <line
            x1="305"
            y1="868"
            x2="305"
            y2="1336"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
          />
          {/* Doubles Long Service Line */}
          <line
            x1="4"
            y1="1266"
            x2="606"
            y2="1266"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2"
          />

          {/* Interactive Heatmap Zones */}
          {zonesConfig.map((z) => {
            const count = normalizedData[z.key] || 0;
            const pct =
              totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
            const isSelected = selectedZone === z.key;
            const style = getHeatStyling(count, isSelected);

            return (
              <g
                key={z.key}
                onClick={() => handleZoneSelect(z.key)}
                className={cn(
                  "transition-all duration-200",
                  interactive && "cursor-pointer hover:opacity-90"
                )}
                role="button"
                tabIndex={interactive ? 0 : -1}
                aria-label={`${z.label}: ${count} удара (${pct}%)`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleZoneSelect(z.key);
                  }
                }}
              >
                {/* Zone Area */}
                <rect
                  x={z.x + 4}
                  y={z.y + 4}
                  width={z.w - 8}
                  height={z.h - 8}
                  rx="10"
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                  filter={style.filter}
                />

                {/* Zone Labels & Numbers */}
                <text
                  x={z.labelX}
                  y={z.labelY - 26}
                  textAnchor="middle"
                  fill={isSelected ? "#60a5fa" : "rgba(255, 255, 255, 0.75)"}
                  fontSize="17"
                  fontWeight="bold"
                  letterSpacing="1"
                >
                  {z.shortLabel}
                </text>

                <text
                  x={z.labelX}
                  y={z.labelY + 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="34"
                  fontWeight="900"
                  className="font-mono tracking-tight"
                >
                  {count}
                </text>

                <text
                  x={z.labelX}
                  y={z.labelY + 34}
                  textAnchor="middle"
                  fill={
                    count > 0
                      ? "rgba(255, 255, 255, 0.85)"
                      : "rgba(255, 255, 255, 0.4)"
                  }
                  fontSize="16"
                  fontWeight="600"
                >
                  {pct}% от сесията
                </text>
              </g>
            );
          })}

          {/* Player Base Center Marker */}
          <circle
            cx="305"
            cy="1000"
            r="16"
            fill="#3b82f6"
            fillOpacity="0.3"
            stroke="#60a5fa"
            strokeWidth="2"
          />
          <circle cx="305" cy="1000" r="5" fill="#ffffff" />
          <text
            x="305"
            y="1035"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.6)"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="1.5"
          >
            ЦЕНТЪР / БАЗА
          </text>
        </svg>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-emerald-500 bg-emerald-500/40" />
          <span>Ниска (1–29%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-amber-500 bg-amber-500/50" />
          <span>Умерена (30–64%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-red-500 bg-red-500/60" />
          <span>Висока (65%+)</span>
        </div>
      </div>

      {/* Detailed Analysis Card for Selected Zone */}
      {showDetailsCard && selectedZone && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-50/70 p-4 duration-200 animate-in fade-in-50 dark:border-blue-500/30 dark:bg-blue-950/30">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-blue-500" />
                <h5 className="text-xs font-bold text-blue-900 uppercase dark:text-blue-200">
                  {HEATMAP_ZONE_LABELS[selectedZone] || selectedZone}
                </h5>
                <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                  {normalizedData[selectedZone] || 0} удара (
                  {totalHits > 0
                    ? Math.round(
                        ((normalizedData[selectedZone] || 0) / totalHits) * 100
                      )
                    : 0}
                  %)
                </Badge>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                {ZONE_DESCRIPTIONS[selectedZone] ||
                  "Специфично придвижване на корта."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedZone(null)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-blue-100 hover:text-zinc-700 dark:hover:bg-blue-900 dark:hover:text-zinc-200"
              title="Затвори детайлите"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Quick Select Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {zonesConfig.map((z) => {
          const count = normalizedData[z.key] || 0;
          const pct = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
          const isSelected = selectedZone === z.key;

          return (
            <button
              key={`pill-${z.key}`}
              type="button"
              onClick={() => handleZoneSelect(z.key)}
              className={cn(
                "flex items-center justify-between rounded-xl border p-2 text-left text-xs transition-all",
                isSelected
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 font-bold dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              <span className="truncate pr-1">{z.label}</span>
              <span className="shrink-0 font-mono font-black text-zinc-900 dark:text-white">
                {count}{" "}
                <span className="text-[10px] text-zinc-500">({pct}%)</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
