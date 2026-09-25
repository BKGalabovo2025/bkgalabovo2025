/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/use-type-alias */
"use client";

import { Maximize2, Minimize2, User } from "lucide-react";
import React from "react";

import { VisualPhase } from "@/hooks/shadow-trainer/types";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";

export interface CourtPlayerInfo {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface CourtVisualizerProps {
  activeZone?: ZoneId | null;
  visualPhase?: VisualPhase;
  previewZones?: ZoneId[];
  className?: string;
  viewMode?: "half" | "full";
  allowToggleView?: boolean;
  courtNumber?: number;
  showCourtNumberBadge?: boolean;
  playerBottom?: CourtPlayerInfo | string | null;
  playerTop?: CourtPlayerInfo | string | null;
  dualActive?: boolean;
}

const ZONE_COORDINATES: Record<
  string,
  { x: number; y: number; label: string }
> = {
  frontBackhand: { x: 152, y: 769, label: "МРЕЖА Л" },
  frontForehand: { x: 457, y: 769, label: "МРЕЖА Д" },
  midBackhand: { x: 152, y: 986, label: "СРЕДА Л" },
  midForehand: { x: 457, y: 986, label: "СРЕДА Д" },
  backBackhand: { x: 152, y: 1222, label: "ЗАДНА Л" },
  overhead: { x: 152, y: 1222, label: "ЗАДНА Л (Овърхед)" },
  backForehand: { x: 457, y: 1222, label: "ЗАДНА Д" },
};

// Symmetrical coordinates for Player B in top half (facing net downwards)
const TOP_ZONE_COORDINATES: Record<
  string,
  { x: number; y: number; label: string }
> = {
  frontForehand: { x: 152, y: 571, label: "МРЕЖА Д" },
  frontBackhand: { x: 457, y: 571, label: "МРЕЖА Л" },
  midForehand: { x: 152, y: 354, label: "СРЕДА Д" },
  midBackhand: { x: 457, y: 354, label: "СРЕДА Л" },
  backForehand: { x: 152, y: 118, label: "ЗАДНА Д" },
  backBackhand: { x: 457, y: 118, label: "ЗАДНА Л" },
  overhead: { x: 457, y: 118, label: "ЗАДНА Л" },
};

function formatPlayerLabel(p?: CourtPlayerInfo | string | null): string | null {
  if (!p) return null;
  if (typeof p === "string") return p;
  return p.displayName || p.firstName || "Състезател";
}

export function CourtVisualizer({
  activeZone,
  visualPhase = "idle",
  previewZones,
  className,
  viewMode = "half",
  allowToggleView = false,
  courtNumber,
  showCourtNumberBadge = true,
  playerBottom,
  playerTop,
  dualActive = false,
}: CourtVisualizerProps) {
  const [internalViewMode, setInternalViewMode] = React.useState<
    "half" | "full"
  >(playerTop ? "full" : viewMode);

  React.useEffect(() => {
    if (playerTop) {
      setInternalViewMode("full");
    } else if (viewMode) {
      setInternalViewMode(viewMode);
    }
  }, [playerTop, viewMode]);

  const activeViewMode = allowToggleView
    ? internalViewMode
    : playerTop
      ? "full"
      : viewMode;
  const isHalfCourt = activeViewMode === "half";
  const hasTopPlayer = Boolean(playerTop) || dualActive;

  // Логика за активната зона
  const isFrontLeft = activeZone === "frontBackhand";
  const isFrontRight = activeZone === "frontForehand";
  const isMidLeft = activeZone === "midBackhand";
  const isMidRight = activeZone === "midForehand";
  const isBackLeft = activeZone === "backBackhand" || activeZone === "overhead";
  const isBackRight = activeZone === "backForehand";

  // Логика за играча (централната точка)
  const isSplitStep = visualPhase === "split_step";
  const isCenter = visualPhase === "center";
  const isShot = visualPhase === "shot";

  let playerColor = "fill-zinc-500/40";
  if (isSplitStep) {
    playerColor =
      "fill-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,1)] animate-pulse";
  } else if (isCenter) {
    playerColor =
      "fill-emerald-500 drop-shadow-[0_0_14px_rgba(16,185,129,0.9)]";
  } else if (isShot) {
    playerColor = "fill-blue-500/70";
  }

  const targetCoords = activeZone ? ZONE_COORDINATES[activeZone] : null;
  const topTargetCoords = activeZone ? TOP_ZONE_COORDINATES[activeZone] : null;

  const bottomName = formatPlayerLabel(playerBottom);
  const topName = formatPlayerLabel(playerTop);

  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-2xl border-2 border-zinc-800 bg-[#0b0e14] shadow-2xl transition-all duration-300",
        isHalfCourt ? "aspect-710/770 max-w-96" : "aspect-710/1440 max-w-80",
        className
      )}
    >
      {/* Court Number Badge */}
      {courtNumber !== undefined && showCourtNumberBadge && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-zinc-900/90 px-2 py-0.5 text-xs font-black text-amber-300 shadow-md backdrop-blur-md">
          <span className="text-amber-400">🏸</span>
          <span>КОРТ {courtNumber}</span>
        </div>
      )}

      {/* Top Player Badge (Поле 2 / Горе) */}
      {!isHalfCourt && topName && (
        <div className="absolute top-9 left-2.5 z-20 flex max-w-[80%] items-center gap-1.5 truncate rounded-lg border border-blue-500/40 bg-zinc-950/85 px-2 py-0.5 text-[11px] font-bold text-blue-300 backdrop-blur-md">
          <User size={12} className="text-blue-400 shrink-0" />
          <span className="text-[10px] text-blue-400 font-extrabold uppercase">
            Поле 2:
          </span>
          <span className="truncate">{topName}</span>
        </div>
      )}

      {/* Bottom Player Badge (Поле 1 / Долу) */}
      {bottomName && (
        <div className="absolute bottom-2.5 left-2.5 z-20 flex max-w-[80%] items-center gap-1.5 truncate rounded-lg border border-emerald-500/40 bg-zinc-950/85 px-2 py-0.5 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
          <User size={12} className="text-emerald-400 shrink-0" />
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase">
            {isHalfCourt ? "Състезател:" : "Поле 1:"}
          </span>
          <span className="truncate">{bottomName}</span>
        </div>
      )}

      {allowToggleView && (
        <button
          type="button"
          onClick={() =>
            setInternalViewMode((prev) => (prev === "half" ? "full" : "half"))
          }
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-2 py-1 text-[11px] font-bold text-zinc-300 backdrop-blur-md transition-colors hover:border-zinc-500 hover:text-white"
          title={
            isHalfCourt
              ? "Превключи на цял корт"
              : "Превключи на активно тренировъчно поле (1/2 корт)"
          }
        >
          {isHalfCourt ? (
            <>
              <Maximize2 size={12} className="text-blue-400" />
              <span>1/2 Корт</span>
            </>
          ) : (
            <>
              <Minimize2 size={12} className="text-yellow-400" />
              <span>Цял Корт</span>
            </>
          )}
        </button>
      )}

      <svg
        viewBox={isHalfCourt ? "-50 620 710 770" : "-50 -50 710 1440"}
        className="size-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow marker for movement vector */}
          <marker
            id="courtArrowHead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
          </marker>
          <linearGradient
            id="courtMovementVector"
            x1="305"
            y1="960"
            x2={targetCoords?.x || 305}
            y2={targetCoords?.y || 960}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="courtMovementVectorTop"
            x1="305"
            y1="380"
            x2={topTargetCoords?.x || 305}
            y2={topTargetCoords?.y || 380}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="pulseShotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ФОН НА ЗАЛАТА (Околно пространство на корта / run-off area) */}
        <rect x="-100" y="-100" width="910" height="1600" fill="#0b0e14" />

        {/* НАСТИЛКА НА КОРТА (Badminton mat) */}
        <rect
          x="0"
          y={isHalfCourt ? 670 : 0}
          width="610"
          height={isHalfCourt ? 670 : 1340}
          fill="#131722"
          rx="4"
        />

        {/* ---------------- ЗОНИ (Долна Половина - Поле 1 / Играч А) ---------------- */}
        <Zone
          x={0}
          y={670}
          w={305}
          h={198}
          active={isFrontLeft && isShot}
          inPreview={previewZones?.includes("frontBackhand")}
          label="МРЕЖА Л"
          labelX={175}
          labelY={769}
          labelAlign="middle"
        />
        <Zone
          x={305}
          y={670}
          w={305}
          h={198}
          active={isFrontRight && isShot}
          inPreview={previewZones?.includes("frontForehand")}
          label="МРЕЖА Д"
          labelX={435}
          labelY={769}
          labelAlign="middle"
        />
        <Zone
          x={0}
          y={868}
          w={305}
          h={236}
          active={isMidLeft && isShot}
          inPreview={previewZones?.includes("midBackhand")}
          label="СРЕДА Л"
          labelX={175}
          labelY={986}
          labelAlign="middle"
        />
        <Zone
          x={305}
          y={868}
          w={305}
          h={236}
          active={isMidRight && isShot}
          inPreview={previewZones?.includes("midForehand")}
          label="СРЕДА Д"
          labelX={435}
          labelY={986}
          labelAlign="middle"
        />
        <Zone
          x={0}
          y={1104}
          w={305}
          h={236}
          active={isBackLeft && isShot}
          inPreview={
            previewZones?.includes("backBackhand") ||
            previewZones?.includes("overhead")
          }
          label="ЗАДНА Л"
          labelX={175}
          labelY={1308}
          labelAlign="middle"
        />
        <Zone
          x={305}
          y={1104}
          w={305}
          h={236}
          active={isBackRight && isShot}
          inPreview={previewZones?.includes("backForehand")}
          label="ЗАДНА Д"
          labelX={435}
          labelY={1308}
          labelAlign="middle"
        />

        {/* ---------------- ЗОНИ (Горна Половина - Поле 2 / Играч Б) ---------------- */}
        {!isHalfCourt && (
          <>
            <Zone
              x={0}
              y={472}
              w={305}
              h={198}
              active={hasTopPlayer && isFrontRight && isShot}
              inPreview={previewZones?.includes("frontForehand")}
              label="МРЕЖА Д"
              labelX={175}
              labelY={571}
              labelAlign="middle"
            />
            <Zone
              x={305}
              y={472}
              w={305}
              h={198}
              active={hasTopPlayer && isFrontLeft && isShot}
              inPreview={previewZones?.includes("frontBackhand")}
              label="МРЕЖА Л"
              labelX={435}
              labelY={571}
              labelAlign="middle"
            />
            <Zone
              x={0}
              y={236}
              w={305}
              h={236}
              active={hasTopPlayer && isMidRight && isShot}
              inPreview={previewZones?.includes("midForehand")}
              label="СРЕДА Д"
              labelX={175}
              labelY={354}
              labelAlign="middle"
            />
            <Zone
              x={305}
              y={236}
              w={305}
              h={236}
              active={hasTopPlayer && isMidLeft && isShot}
              inPreview={previewZones?.includes("midBackhand")}
              label="СРЕДА Л"
              labelX={435}
              labelY={354}
              labelAlign="middle"
            />
            <Zone
              x={0}
              y={0}
              w={305}
              h={236}
              active={hasTopPlayer && isBackRight && isShot}
              inPreview={previewZones?.includes("backForehand")}
              label="ЗАДНА Д"
              labelX={175}
              labelY={38}
              labelAlign="middle"
            />
            <Zone
              x={305}
              y={0}
              w={305}
              h={236}
              active={hasTopPlayer && isBackLeft && isShot}
              inPreview={
                previewZones?.includes("backBackhand") ||
                previewZones?.includes("overhead")
              }
              label="ЗАДНА Л"
              labelX={435}
              labelY={38}
              labelAlign="middle"
            />
          </>
        )}

        {/* ---------------- ЛИНИИ НА КОРТА (BWF официални пропорции) ---------------- */}
        <g stroke="rgba(255,255,255,0.5)" strokeWidth="4" fill="none">
          {/* Външни граници (Boundary) */}
          <rect
            x="2"
            y={isHalfCourt ? 670 : 2}
            width="606"
            height={isHalfCourt ? 668 : 1336}
            stroke="rgba(255,255,255,0.7)"
            rx="2"
          />

          {/* Коридори (Singles side lines) - 0.46м навътре */}
          <line x1="46" y1={isHalfCourt ? 670 : 0} x2="46" y2="1340" />
          <line x1="564" y1={isHalfCourt ? 670 : 0} x2="564" y2="1340" />

          {/* Задна сервис линия за двойки - 0.76м навътре */}
          {!isHalfCourt && <line x1="2" y1="76" x2="608" y2="76" />}
          <line x1="2" y1="1264" x2="608" y2="1264" />

          {/* Предна сервис линия - 1.98м от мрежата */}
          {!isHalfCourt && <line x1="2" y1="472" x2="608" y2="472" />}
          <line
            x1="2"
            y1="868"
            x2="608"
            y2="868"
            stroke="rgba(255,255,255,0.65)"
          />

          {/* Централна линия */}
          {!isHalfCourt && <line x1="305" y1="2" x2="305" y2="472" />}
          <line x1="305" y1="868" x2="305" y2="1338" />
        </g>

        {/* ---------------- МРЕЖА ---------------- */}
        {isHalfCourt ? (
          <g>
            <rect
              x="-20"
              y="654"
              width="650"
              height="16"
              fill="rgba(15,23,42,0.85)"
              rx="3"
            />
            <rect x="-20" y="666" width="650" height="4" fill="#f8fafc" />
            <line
              x1="-20"
              y1="670"
              x2="630"
              y2="670"
              stroke="#ffffff"
              strokeWidth="4"
              strokeDasharray="6 4"
            />
            {/* Net posts */}
            <circle
              cx="-12"
              cy="668"
              r="5"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="2"
            />
            <circle
              cx="622"
              cy="668"
              r="5"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="2"
            />
            <text
              x="305"
              y="663"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
              className="select-none font-sans tracking-widest uppercase opacity-85"
            >
              МРЕЖА
            </text>
          </g>
        ) : (
          <g>
            <rect
              x="-20"
              y="658"
              width="650"
              height="24"
              fill="rgba(15,23,42,0.7)"
              rx="2"
            />
            <line
              x1="-20"
              y1="670"
              x2="630"
              y2="670"
              stroke="#ffffff"
              strokeWidth="6"
              strokeDasharray="6 6"
            />
            <circle
              cx="-12"
              cy="670"
              r="6"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="2"
            />
            <circle
              cx="622"
              cy="670"
              r="6"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="2"
            />
            <text
              x="305"
              y="666"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              className="select-none font-sans tracking-widest uppercase opacity-85"
            >
              МРЕЖА
            </text>
          </g>
        )}

        {/* ---------------- ДИНАМИЧЕН ВЕКТОР НА ДВИЖЕНИЕ (Долно поле) ---------------- */}
        {isShot && targetCoords && (
          <g>
            <line
              x1="305"
              y1="960"
              x2={targetCoords.x}
              y2={targetCoords.y}
              stroke="url(#courtMovementVector)"
              strokeWidth="6"
              strokeDasharray="10 6"
              markerEnd="url(#courtArrowHead)"
              className="animate-pulse"
            />
            <circle
              cx={targetCoords.x}
              cy={targetCoords.y}
              r="34"
              fill="url(#pulseShotGlow)"
            />
            <circle
              cx={targetCoords.x}
              cy={targetCoords.y}
              r="22"
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray="4 4"
              className="animate-spin"
            />
            <g
              transform={`translate(${targetCoords.x - 12}, ${targetCoords.y - 12}) scale(0.8)`}
            >
              <path
                d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16.5L6 20L7.5 13.5L3 9L9 8L12 2Z"
                fill="#FDE047"
                stroke="#B45309"
                strokeWidth="1.5"
              />
            </g>
          </g>
        )}

        {/* ---------------- ДИНАМИЧЕН ВЕКТОР НА ДВИЖЕНИЕ (Горно поле) ---------------- */}
        {!isHalfCourt && hasTopPlayer && isShot && topTargetCoords && (
          <g>
            <line
              x1="305"
              y1="380"
              x2={topTargetCoords.x}
              y2={topTargetCoords.y}
              stroke="url(#courtMovementVectorTop)"
              strokeWidth="6"
              strokeDasharray="10 6"
              markerEnd="url(#courtArrowHead)"
              className="animate-pulse"
            />
            <circle
              cx={topTargetCoords.x}
              cy={topTargetCoords.y}
              r="34"
              fill="url(#pulseShotGlow)"
            />
            <circle
              cx={topTargetCoords.x}
              cy={topTargetCoords.y}
              r="22"
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray="4 4"
              className="animate-spin"
            />
            <g
              transform={`translate(${topTargetCoords.x - 12}, ${topTargetCoords.y - 12}) scale(0.8)`}
            >
              <path
                d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16.5L6 20L7.5 13.5L3 9L9 8L12 2Z"
                fill="#FDE047"
                stroke="#B45309"
                strokeWidth="1.5"
              />
            </g>
          </g>
        )}

        {/* ---------------- ЦЕНТЪР НА ДОЛНИЯ ИГРАЧ (305, 960) ---------------- */}
        {isSplitStep && (
          <circle
            cx="305"
            cy="960"
            r="42"
            fill="none"
            stroke="#FACC15"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-spin"
          />
        )}
        <circle
          cx="305"
          cy="960"
          r="26"
          className={cn("transition-all duration-300", playerColor)}
        />
        <circle cx="305" cy="960" r="9" fill="rgba(255,255,255,0.95)" />

        {isSplitStep && (
          <text
            x="305"
            y="1020"
            textAnchor="middle"
            fill="#FACC15"
            fontSize="18"
            fontWeight="800"
            className="select-none font-sans"
          >
            ⚡ СПЛИТ-СТЕП!
          </text>
        )}
        {isCenter && (
          <text
            x="305"
            y="1020"
            textAnchor="middle"
            fill="#10B981"
            fontSize="18"
            fontWeight="800"
            className="select-none font-sans"
          >
            ✓ В ЦЕНТЪРА
          </text>
        )}

        {/* ---------------- ЦЕНТЪР НА ГОРНИЯ ИГРАЧ (305, 380) ---------------- */}
        {!isHalfCourt && (
          <>
            {isSplitStep && hasTopPlayer && (
              <circle
                cx="305"
                cy="380"
                r="42"
                fill="none"
                stroke="#FACC15"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-spin"
              />
            )}
            <circle
              cx="305"
              cy="380"
              r="26"
              className={cn(
                "transition-all duration-300",
                hasTopPlayer ? playerColor : "fill-zinc-600/30"
              )}
            />
            <circle
              cx="305"
              cy="380"
              r="9"
              fill={
                hasTopPlayer
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.4)"
              }
            />

            {isSplitStep && hasTopPlayer && (
              <text
                x="305"
                y="435"
                textAnchor="middle"
                fill="#FACC15"
                fontSize="18"
                fontWeight="800"
                className="select-none font-sans"
              >
                ⚡ СПЛИТ-СТЕП!
              </text>
            )}
            {isCenter && hasTopPlayer && (
              <text
                x="305"
                y="435"
                textAnchor="middle"
                fill="#10B981"
                fontSize="18"
                fontWeight="800"
                className="select-none font-sans"
              >
                ✓ В ЦЕНТЪРА
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

// ---------------- ПОМОЩЕН КОМПОНЕНТ ЗА ЗОНА ----------------
interface ZoneProps {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  inPreview?: boolean;
  label: string;
  labelX: number;
  labelY: number;
  labelAlign: "start" | "middle" | "end";
}

function Zone({
  x,
  y,
  w,
  h,
  active,
  inPreview,
  label,
  labelX,
  labelY,
  labelAlign,
}: ZoneProps) {
  let rectClasses = "fill-transparent stroke-transparent";
  if (active) {
    rectClasses = "fill-red-500/30 stroke-red-500 stroke-[4px]";
  } else if (inPreview) {
    rectClasses =
      "fill-blue-500/10 stroke-blue-500/40 stroke-[2px] stroke-dashed";
  }

  let textFill = "rgba(255,255,255,0.45)";
  if (active) {
    textFill = "#EF4444";
  } else if (inPreview) {
    textFill = "rgba(147, 197, 253, 0.9)";
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        className={cn("transition-all duration-300", rectClasses)}
      />
      <text
        x={labelX}
        y={labelY}
        fill={textFill}
        fontSize="16"
        fontWeight={active ? "900" : "800"}
        textAnchor={labelAlign}
        className="pointer-events-none tracking-wider uppercase transition-colors duration-300 select-none font-sans"
      >
        {label}
      </text>
    </g>
  );
}
