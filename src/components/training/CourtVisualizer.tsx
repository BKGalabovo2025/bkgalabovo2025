"use client";

import React from "react";

import { VisualPhase } from "@/hooks/shadow-trainer/types";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";

interface CourtVisualizerProps {
  activeZone?: ZoneId | null;
  visualPhase?: VisualPhase;
  previewZones?: ZoneId[];
  className?: string;
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

export function CourtVisualizer({
  activeZone,
  visualPhase = "idle",
  previewZones,
  className,
}: CourtVisualizerProps) {
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

  return (
    <div
      className={cn(
        "relative mx-auto aspect-610/1340 w-full max-w-80 overflow-hidden rounded-2xl border-2 border-zinc-800 bg-[#0f1117] shadow-2xl",
        className
      )}
    >
      <svg
        viewBox="0 0 610 1340"
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
          <radialGradient id="pulseShotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ФОН НА КОРТА (Професионална тъмна бадминтон настилка) */}
        <rect width="610" height="1340" fill="#11141c" />

        {/* ---------------- ЗОНИ (Долна Половина - Нашата) ---------------- */}
        <Zone
          x={0}
          y={670}
          w={305}
          h={198}
          active={isFrontLeft && isShot}
          inPreview={previewZones?.includes("frontBackhand")}
          label="МРЕЖА Л"
          labelX={24}
          labelY={710}
          labelAlign="start"
        />
        <Zone
          x={305}
          y={670}
          w={305}
          h={198}
          active={isFrontRight && isShot}
          inPreview={previewZones?.includes("frontForehand")}
          label="МРЕЖА Д"
          labelX={586}
          labelY={710}
          labelAlign="end"
        />
        <Zone
          x={0}
          y={868}
          w={305}
          h={236}
          active={isMidLeft && isShot}
          inPreview={previewZones?.includes("midBackhand")}
          label="СРЕДА Л"
          labelX={24}
          labelY={910}
          labelAlign="start"
        />
        <Zone
          x={305}
          y={868}
          w={305}
          h={236}
          active={isMidRight && isShot}
          inPreview={previewZones?.includes("midForehand")}
          label="СРЕДА Д"
          labelX={586}
          labelY={910}
          labelAlign="end"
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
          labelX={24}
          labelY={1310}
          labelAlign="start"
        />
        <Zone
          x={305}
          y={1104}
          w={305}
          h={236}
          active={isBackRight && isShot}
          inPreview={previewZones?.includes("backForehand")}
          label="ЗАДНА Д"
          labelX={586}
          labelY={1310}
          labelAlign="end"
        />

        {/* ---------------- ЛИНИИ НА КОРТА (BWF официални пропорции) ---------------- */}
        <g stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none">
          {/* Външни граници (Boundary) */}
          <rect
            x="2"
            y="2"
            width="606"
            height="1336"
            stroke="rgba(255,255,255,0.55)"
          />

          {/* Коридори (Singles side lines) - 0.46м навътре */}
          <line x1="46" y1="0" x2="46" y2="1340" />
          <line x1="564" y1="0" x2="564" y2="1340" />

          {/* Задна сервис линия за двойки - 0.76м навътре */}
          <line x1="2" y1="76" x2="608" y2="76" />
          <line x1="2" y1="1264" x2="608" y2="1264" />

          {/* Предна сервис линия - 1.98м от мрежата */}
          <line x1="2" y1="472" x2="608" y2="472" />
          <line
            x1="2"
            y1="868"
            x2="608"
            y2="868"
            stroke="rgba(255,255,255,0.6)"
          />

          {/* Централна линия */}
          <line x1="305" y1="2" x2="305" y2="472" />
          <line x1="305" y1="868" x2="305" y2="1338" />
        </g>

        {/* ---------------- МРЕЖА С ПРЕЦИЗНА МРЕЖОВИДНА ТЕКСТУРА ---------------- */}
        <rect x="0" y="658" width="610" height="24" fill="rgba(0,0,0,0.5)" />
        <line
          x1="0"
          y1="670"
          x2="610"
          y2="670"
          stroke="#ffffff"
          strokeWidth="6"
          strokeDasharray="6 6"
        />

        {/* ---------------- ДИНАМИЧЕН ВЕКТОР НА ДВИЖЕНИЕ (Стрелка от центъра към зоната) ---------------- */}
        {isShot && targetCoords && (
          <g>
            {/* Анимирана линия */}
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
            {/* Пулсиращ ринг на приземяване в зоната */}
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
            {/* Икона на совалка в целевата точка */}
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

        {/* ---------------- ЦЕНТЪР НА ИГРАЧА (Базова позиция на корта) ---------------- */}
        {/* Външен ринг за Split Step */}
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
        {/* Базов кръг на играча */}
        <circle
          cx="305"
          cy="960"
          r="26"
          className={cn("transition-all duration-300", playerColor)}
        />
        {/* Вътрешна ядка */}
        <circle cx="305" cy="960" r="9" fill="rgba(255,255,255,0.95)" />

        {/* Етикет за Split-Step / Център при активна фаза */}
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

  let textFill = "rgba(255,255,255,0.2)";
  if (active) {
    textFill = "#EF4444";
  } else if (inPreview) {
    textFill = "rgba(147, 197, 253, 0.75)";
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
        fontSize="22"
        fontWeight={active ? "900" : "700"}
        textAnchor={labelAlign}
        className="pointer-events-none tracking-wider uppercase transition-colors duration-300 select-none font-sans"
      >
        {label}
      </text>
    </g>
  );
}
