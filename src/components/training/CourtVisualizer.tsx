"use client";


import { ZoneId } from "@/lib/shadow-training/audio-map";
import { cn } from "@/lib/utils";

interface CourtVisualizerProps {
  activeZone?: ZoneId | null;
  className?: string;
}

export function CourtVisualizer({ activeZone, className }: CourtVisualizerProps) {
  // A generic badminton court SVG layout.
  // We divide it into 6 logical zones for highlighting.

  const isFrontLeft = activeZone === "frontLeft";
  const isFrontRight = activeZone === "frontRight";
  const isMidLeft = activeZone === "midLeft";
  const isMidRight = activeZone === "midRight";
  const isBackLeft = activeZone === "backLeft" || activeZone === "overhead";
  const isBackRight = activeZone === "backRight";

  // Zone colors: default is transparent. Active is a bright primary color (e.g. red or green depending on theme, but we use Tailwind bg-primary)
  const zoneClass = "transition-colors duration-200 border border-white/20";
  const activeClass = "bg-primary/80 shadow-[0_0_20px_rgba(var(--primary),0.5)]";
  const inactiveClass = "bg-zinc-800/30";

  return (
    <div className={cn("relative w-full max-w-sm aspect-1/2 mx-auto bg-zinc-900 rounded-lg p-2 border-2 border-zinc-700 shadow-xl", className)}>
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-2">
        {/* Net line */}
        <div className="absolute top-1/2 left-2 right-2 h-1 bg-white/50 -translate-y-1/2 shadow-sm z-10" />
      </div>

      <div className="w-full h-full relative grid grid-cols-2 grid-rows-3 gap-1 z-0">
        {/* Front zones (near net) */}
        <div className={cn(zoneClass, isFrontLeft ? activeClass : inactiveClass, "rounded-tl-md")} />
        <div className={cn(zoneClass, isFrontRight ? activeClass : inactiveClass, "rounded-tr-md")} />

        {/* Mid zones */}
        <div className={cn(zoneClass, isMidLeft ? activeClass : inactiveClass)} />
        <div className={cn(zoneClass, isMidRight ? activeClass : inactiveClass)} />

        {/* Back zones */}
        <div className={cn(zoneClass, isBackLeft ? activeClass : inactiveClass, "rounded-bl-md")} />
        <div className={cn(zoneClass, isBackRight ? activeClass : inactiveClass, "rounded-br-md")} />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-400 rounded-full z-20 border-2 border-zinc-900" />
    </div>
  );
}
