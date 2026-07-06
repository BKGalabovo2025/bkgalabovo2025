"use client";

import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";
import { VisualPhase } from "@/hooks/shadow-trainer/types";

interface CourtVisualizerProps {
  activeZone?: ZoneId | null;
  visualPhase?: VisualPhase;
  className?: string;
}

export function CourtVisualizer({
  activeZone,
  visualPhase = "idle",
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

  let playerColor = "fill-zinc-500/30";
  if (isSplitStep) {
    playerColor =
      "fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,1)] animate-pulse";
  } else if (isCenter) {
    playerColor = "fill-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]";
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-[320px] mx-auto aspect-[610/1340] bg-[#1a1c23] rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl",
        className
      )}
    >
      <svg
        viewBox="0 0 610 1340"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ФОН / НАСТИЛКА НА КОРТА */}
        <rect width="610" height="1340" fill="#18181b" />

        {/* ---------------- ЗОНИ (Долна Половина - Нашата) ---------------- */}
        <Zone
          x={0}
          y={670}
          w={305}
          h={198}
          active={isFrontLeft && visualPhase === "shot"}
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
          active={isFrontRight && visualPhase === "shot"}
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
          active={isMidLeft && visualPhase === "shot"}
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
          active={isMidRight && visualPhase === "shot"}
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
          active={isBackLeft && visualPhase === "shot"}
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
          active={isBackRight && visualPhase === "shot"}
          label="ЗАДНА Д"
          labelX={586}
          labelY={1310}
          labelAlign="end"
        />

        {/* ---------------- ЛИНИИ НА КОРТА ---------------- */}
        <g stroke="rgba(255,255,255,0.6)" strokeWidth="4" fill="none">
          {/* Външни граници (Boundary) */}
          <rect x="2" y="2" width="606" height="1336" />

          {/* Коридори (Singles side lines) - 0.46м навътре */}
          <line x1="46" y1="0" x2="46" y2="1340" />
          <line x1="564" y1="0" x2="564" y2="1340" />

          {/* Задна сервис линия за двойки - 0.76м навътре */}
          <line x1="2" y1="76" x2="608" y2="76" />
          <line x1="2" y1="1264" x2="608" y2="1264" />

          {/* Предна сервис линия - 1.98м от мрежата */}
          <line x1="2" y1="472" x2="608" y2="472" />
          <line x1="2" y1="868" x2="608" y2="868" />

          {/* Централна линия */}
          <line x1="305" y1="2" x2="305" y2="472" />
          <line x1="305" y1="868" x2="305" y2="1338" />
        </g>

        {/* ---------------- МРЕЖА ---------------- */}
        {/* Затъмнен фон зад мрежата */}
        <rect x="0" y="660" width="610" height="20" fill="rgba(0,0,0,0.3)" />
        <line
          x1="0"
          y1="670"
          x2="610"
          y2="670"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="6"
          strokeDasharray="8 8"
        />

        {/* ---------------- ЦЕНТЪР НА ИГРАЧА ---------------- */}
        {/* Позиция малко зад Т-то (y=868). Базовата позиция е около y=960 */}
        <circle
          cx="305"
          cy="960"
          r="24"
          className={cn("transition-all duration-300", playerColor)}
        />
        {/* Бяла точка в центъра */}
        <circle cx="305" cy="960" r="8" fill="rgba(255,255,255,0.8)" />
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
  label,
  labelX,
  labelY,
  labelAlign,
}: ZoneProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        className={cn(
          "transition-all duration-300",
          active
            ? "fill-red-500/30 stroke-red-500 stroke-[3px]"
            : "fill-transparent"
        )}
      />
      <text
        x={labelX}
        y={labelY}
        fill={active ? "rgba(239,68,68,0.9)" : "rgba(255,255,255,0.25)"}
        fontSize="24"
        fontWeight="600"
        textAnchor={labelAlign}
        className="uppercase tracking-widest select-none pointer-events-none transition-colors duration-300"
      >
        {label}
      </text>
    </g>
  );
}
