"use client";

import React from "react";

import { cn } from "@/lib/utils";
import type { DrillCourtDiagramData } from "@/types/planner.types";

interface DrillCourtDiagramProps {
  data: DrillCourtDiagramData;
  className?: string;
  compact?: boolean;
}

/**
 * Изчистена SVG схема на бадминтон корт:
 * - Координатна система 0..100 по X и Y (мрежата е на Y=50)
 * - Показва играчи (синьо), треньор/подаващ (кехлибарено), конуси (оранжево),
 *   целеви зони (зелено) и стрелки за придвижване (пунктир) / траектория на перото (плътна).
 */
export function DrillCourtDiagram({
  data,
  className,
  compact = false,
}: DrillCourtDiagramProps) {
  const markerId = React.useId().replace(/:/g, "");

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      <svg
        viewBox="0 0 100 106"
        role="img"
        aria-label={data.caption}
        className={cn(
          "mx-auto w-full select-none",
          compact ? "max-w-45" : "max-w-65"
        )}
      >
        <defs>
          <marker
            id={`shuttle-${markerId}`}
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#10b981" />
          </marker>
          <marker
            id={`move-${markerId}`}
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Повърхност на корта */}
        <rect
          x="6"
          y="4"
          width="88"
          height="96"
          rx="3"
          className="fill-emerald-700/90 dark:fill-emerald-950/90"
        />

        {/* Външни линии (двойки) */}
        <rect
          x="10"
          y="8"
          width="80"
          height="88"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="0.9"
        />
        {/* Вътрешни странични линии (сингъл) */}
        <line
          x1="16"
          y1="8"
          x2="16"
          y2="96"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.6"
        />
        <line
          x1="84"
          y1="8"
          x2="84"
          y2="96"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.6"
        />
        {/* Линии за къс сервис */}
        <line
          x1="10"
          y1="38"
          x2="90"
          y2="38"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.7"
        />
        <line
          x1="10"
          y1="62"
          x2="90"
          y2="62"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="0.7"
        />
        {/* Централни линии за сервис */}
        <line
          x1="50"
          y1="8"
          x2="50"
          y2="38"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.6"
        />
        <line
          x1="50"
          y1="62"
          x2="50"
          y2="96"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.6"
        />
        {/* Мрежа */}
        <line
          x1="6"
          y1="50"
          x2="94"
          y2="50"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeDasharray="2.5 1.5"
        />

        {/* Целеви зони */}
        {(data.targetZones || []).map((z, idx) => (
          <g key={`zone-${idx}`}>
            <circle
              cx={z.x}
              cy={z.y}
              r={z.r ?? 6}
              fill="rgba(16, 185, 129, 0.35)"
              stroke="#34d399"
              strokeWidth="0.9"
              strokeDasharray="2 1"
            />
            {z.label && !compact && (
              <text
                x={z.x}
                y={z.y + 1.2}
                textAnchor="middle"
                fill="#ecfdf5"
                fontSize="3.4"
                fontWeight="700"
              >
                {z.label}
              </text>
            )}
          </g>
        ))}

        {/* Стрелки (придвижване и траектория на перото) */}
        {data.arrows.map((a, idx) => {
          const isShuttle = a.type === "shuttle";
          const midX = (a.from.x + a.to.x) / 2;
          const midY = (a.from.y + a.to.y) / 2;
          return (
            <g key={`arrow-${idx}`}>
              <line
                x1={a.from.x}
                y1={a.from.y}
                x2={a.to.x}
                y2={a.to.y}
                stroke={isShuttle ? "#34d399" : "#60a5fa"}
                strokeWidth="1.3"
                strokeDasharray={isShuttle ? undefined : "2.2 1.5"}
                markerEnd={`url(#${isShuttle ? "shuttle" : "move"}-${markerId})`}
              />
              {a.label && !compact && (
                <text
                  x={midX}
                  y={midY - 1.8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="3.2"
                  fontWeight="700"
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.65)"
                  strokeWidth="0.9"
                >
                  {a.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Конуси */}
        {(data.cones || []).map((c, idx) => (
          <g key={`cone-${idx}`}>
            <polygon
              points={`${c.x},${c.y - 3} ${c.x - 2.6},${c.y + 2.2} ${c.x + 2.6},${c.y + 2.2}`}
              fill="#f97316"
              stroke="#fff7ed"
              strokeWidth="0.5"
            />
            {c.label && !compact && (
              <text
                x={c.x}
                y={c.y + 5.8}
                textAnchor="middle"
                fill="#fed7aa"
                fontSize="3"
                fontWeight="700"
              >
                {c.label}
              </text>
            )}
          </g>
        ))}

        {/* Треньор / Подаващ */}
        {data.coach && (
          <g>
            <circle
              cx={data.coach.x}
              cy={data.coach.y}
              r="3.8"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="0.9"
            />
            <text
              x={data.coach.x}
              y={data.coach.y + 1.2}
              textAnchor="middle"
              fill="#18181b"
              fontSize="3.6"
              fontWeight="800"
            >
              Т
            </text>
            {data.coach.label && !compact && (
              <text
                x={data.coach.x}
                y={data.coach.y - 5.2}
                textAnchor="middle"
                fill="#fef3c7"
                fontSize="3.2"
                fontWeight="700"
              >
                {data.coach.label}
              </text>
            )}
          </g>
        )}

        {/* Играчи */}
        {data.players.map((p, idx) => (
          <g key={`player-${idx}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3.8"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="0.9"
            />
            <text
              x={p.x}
              y={p.y + 1.2}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="3.5"
              fontWeight="800"
            >
              {idx + 1}
            </text>
            {p.label && !compact && (
              <text
                x={p.x}
                y={p.y + 7.2}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="3.2"
                fontWeight="700"
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="0.8"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-600" /> Играч
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> Треньор
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-emerald-500" /> Перо
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-blue-500" />{" "}
            Движение
          </span>
        </div>
      )}
      <p className="mt-1.5 text-center text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
        {data.caption}
      </p>
    </div>
  );
}
