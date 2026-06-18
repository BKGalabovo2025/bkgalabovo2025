/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";

interface CourtVisualizerProps {
  activeZone?: ZoneId | null;
  className?: string;
}

export function CourtVisualizer({
  activeZone,
  className,
}: CourtVisualizerProps) {
  // A generic badminton court SVG layout.
  // We divide it into 6 logical zones for highlighting.

  const isFrontLeft = activeZone === "frontBackhand";
  const isFrontRight = activeZone === "frontForehand";
  const isMidLeft = activeZone === "midBackhand";
  const isMidRight = activeZone === "midForehand";
  const isBackLeft = activeZone === "backBackhand" || activeZone === "overhead";
  const isBackRight = activeZone === "backForehand";

  // Zone colors: default is transparent. Active is a bright primary color (e.g. red or green depending on theme, but we use Tailwind bg-primary)
  const zoneClass = "transition-colors duration-200 border border-white/20";
  const activeClass = "bg-primary/80 shadow-[0_0_20px] shadow-primary/50";
  const inactiveClass = "bg-zinc-800/30";

  return (
    <div
      className={cn(
        "relative w-full max-w-[280px] aspect-3/4 mx-auto bg-zinc-900 rounded-lg p-2 border-2 border-zinc-700 shadow-xl flex flex-col justify-between select-none",
        className
      )}
    >
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-2 overflow-hidden rounded-lg">
        {/* Net line (Top edge) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-300 shadow-[0_2px_8px_rgba(255,255,255,0.4)] z-10" />
        {/* Net grid pattern (subtle) */}
        <div className="absolute top-1.5 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cGF0aCBkPSJNMCAwTDEwIDEwTTAgMTBMMTAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMC41Ii8+Cjwvc3ZnPg==')] z-10 opacity-50" />
      </div>

      <div className="w-full h-full relative grid grid-cols-2 grid-rows-3 gap-1 z-0 mt-3">
        {/* Front zones (near net) */}
        <div
          className={cn(
            zoneClass,
            isFrontLeft ? activeClass : inactiveClass,
            "rounded-tl-md relative flex items-end justify-start p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 left-2 pointer-events-none uppercase tracking-wider">
            Бекхенд Мрежа
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isFrontRight ? activeClass : inactiveClass,
            "rounded-tr-md relative flex items-end justify-end p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 right-2 pointer-events-none uppercase tracking-wider">
            Форхенд Мрежа
          </span>
        </div>

        {/* Mid zones */}
        <div
          className={cn(
            zoneClass,
            isMidLeft ? activeClass : inactiveClass,
            "relative flex items-end justify-start p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 left-2 pointer-events-none uppercase tracking-wider">
            Бекхенд Среда
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isMidRight ? activeClass : inactiveClass,
            "relative flex items-end justify-end p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 right-2 pointer-events-none uppercase tracking-wider">
            Форхенд Среда
          </span>
        </div>

        {/* Back zones */}
        <div
          className={cn(
            zoneClass,
            isBackLeft ? activeClass : inactiveClass,
            "rounded-bl-md relative flex items-end justify-start p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 left-2 pointer-events-none uppercase tracking-wider">
            Оувърхед / Бекхенд
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isBackRight ? activeClass : inactiveClass,
            "rounded-br-md relative flex items-end justify-end p-2"
          )}
        >
          <span className="text-white/40 font-medium text-[10px] absolute bottom-1 right-2 pointer-events-none uppercase tracking-wider">
            Форхенд Задна
          </span>
        </div>
      </div>

      {/* Center position dot (Base position) */}
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-400 rounded-full z-20 shadow-[0_0_10px_rgba(52,211,153,0.8)] border-2 border-zinc-900" />
    </div>
  );
}
