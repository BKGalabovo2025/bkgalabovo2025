"use client";

import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";
import { VisualPhase } from "@/hooks/useShadowTrainer";

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
  // A generic badminton court SVG layout.
  // We divide it into 6 logical zones for highlighting.

  const isFrontLeft = activeZone === "frontBackhand";
  const isFrontRight = activeZone === "frontForehand";
  const isMidLeft = activeZone === "midBackhand";
  const isMidRight = activeZone === "midForehand";
  const isBackLeft = activeZone === "backBackhand" || activeZone === "overhead";
  const isBackRight = activeZone === "backForehand";

  // Zone colors: default is transparent. Active is red during shot phase.
  const zoneClass = "transition-all duration-200 border border-white/20";
  const activeClass =
    visualPhase === "shot"
      ? "bg-red-500/80 shadow-[0_0_25px] shadow-red-500/60 scale-[1.02] z-10 border-red-400"
      : "bg-zinc-800/50";
  const inactiveClass = "bg-zinc-800/30";

  let centerDotColor = "bg-emerald-400/30 scale-100 border-zinc-900"; // idle
  if (visualPhase === "split_step") {
    centerDotColor =
      "bg-yellow-400 border-yellow-200 shadow-[0_0_40px_rgba(250,204,21,1)] scale-[1.7] animate-pulse";
  } else if (visualPhase === "center") {
    centerDotColor =
      "bg-green-500 border-green-300 shadow-[0_0_30px_rgba(34,197,94,1)] scale-150";
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-[320px] aspect-[1/1.6] mx-auto bg-zinc-950 rounded-xl p-3 border-4 border-zinc-800 shadow-2xl flex flex-col justify-between select-none overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-3 overflow-hidden rounded-xl">
        {/* Net line (Top edge) */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-zinc-200 shadow-[0_4px_12px_rgba(255,255,255,0.5)] z-20" />
        {/* Net grid pattern (subtle) */}
        <div className="absolute top-2 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cGF0aCBkPSJNMCAwTDEwIDEwTTAgMTBMMTAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMC41Ii8+Cjwvc3ZnPg==')] z-20 opacity-50" />
      </div>

      <div className="w-full h-full relative grid grid-cols-2 grid-rows-3 gap-1 z-0 mt-4">
        {/* Front zones (near net) */}
        <div
          className={cn(
            zoneClass,
            isFrontLeft ? activeClass : inactiveClass,
            "rounded-tl-lg relative flex items-start justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider mt-2">
            Бекхенд Мрежа
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isFrontRight ? activeClass : inactiveClass,
            "rounded-tr-lg relative flex items-start justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider mt-2">
            Форхенд Мрежа
          </span>
        </div>

        {/* Mid zones */}
        <div
          className={cn(
            zoneClass,
            isMidLeft ? activeClass : inactiveClass,
            "relative flex items-center justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider">
            Бекхенд Среда
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isMidRight ? activeClass : inactiveClass,
            "relative flex items-center justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider">
            Форхенд Среда
          </span>
        </div>

        {/* Back zones */}
        <div
          className={cn(
            zoneClass,
            isBackLeft ? activeClass : inactiveClass,
            "rounded-bl-lg relative flex items-end justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider mb-2">
            Оувърхед / Бекхенд
          </span>
        </div>
        <div
          className={cn(
            zoneClass,
            isBackRight ? activeClass : inactiveClass,
            "rounded-br-lg relative flex items-end justify-center p-3"
          )}
        >
          <span className="text-white/50 font-bold text-xs uppercase tracking-wider mb-2">
            Форхенд Задна
          </span>
        </div>
      </div>

      {/* Center position dot (Base position) */}
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30 pointer-events-none">
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all duration-300",
            centerDotColor
          )}
        />
      </div>
    </div>
  );
}
