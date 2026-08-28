"use client";

import { ClipboardList } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

interface CoachNotesCardProps {
  notes?: string | null;
  className?: string;
  title?: string;
  variant?: "default" | "compact" | "highlight";
}

const isTagLabel = (line: string): boolean => {
  if (!line.includes(":")) return false;
  const lower = line.toLowerCase();
  return (
    line.startsWith("🎯") ||
    line.startsWith("⚡") ||
    line.startsWith("💧") ||
    line.startsWith("👥") ||
    line.startsWith("🏸") ||
    line.startsWith("🔥") ||
    line.startsWith("🧘") ||
    line.startsWith("⚠️") ||
    line.startsWith("💡") ||
    lower.startsWith("фокус:") ||
    lower.startsWith("задачи:") ||
    lower.startsWith("групи:") ||
    lower.startsWith("важно:") ||
    lower.startsWith("почивки:")
  );
};

const isBulletLine = (line: string): boolean => {
  return (
    line.startsWith("-") ||
    line.startsWith("•") ||
    line.startsWith("*") ||
    (line.length > 2 &&
      line[0] >= "0" &&
      line[0] <= "9" &&
      (line[1] === "." || line[2] === "."))
  );
};

const cleanBulletLine = (line: string): string => {
  if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
    return line.slice(1).trim();
  }
  const dotIdx = line.indexOf(".");
  if (dotIdx > 0 && dotIdx <= 2) {
    return line.slice(dotIdx + 1).trim();
  }
  return line.trim();
};

const isSectionHeader = (line: string): boolean => {
  const lower = line.toLowerCase();
  if (lower.includes("минути") || lower.includes("мин.")) return true;
  if (
    lower.startsWith("част") ||
    lower.startsWith("рунд") ||
    lower.startsWith("серия") ||
    lower.startsWith("етап") ||
    lower.startsWith("група")
  ) {
    return true;
  }
  return line.endsWith(":") && !line.includes(" ");
};

const renderNoteLine = (line: string, idx: number) => {
  if (isTagLabel(line)) {
    const [label, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    return (
      <div
        key={idx}
        className="flex flex-col gap-0.5 rounded-lg border border-amber-500/40 bg-zinc-950/80 p-2 sm:flex-row sm:items-baseline sm:gap-2"
      >
        <span className="shrink-0 font-bold text-amber-300">{label}:</span>
        <span className="font-semibold text-zinc-100">{value}</span>
      </div>
    );
  }

  if (isBulletLine(line)) {
    const cleanContent = cleanBulletLine(line);
    return (
      <div key={idx} className="flex items-start gap-2 pl-2">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
        <span className="flex-1 font-medium text-zinc-100">{cleanContent}</span>
      </div>
    );
  }

  if (isSectionHeader(line)) {
    return (
      <div
        key={idx}
        className="pt-2 text-xs font-bold tracking-tight text-amber-300 sm:text-sm"
      >
        {line}
      </div>
    );
  }

  return (
    <p key={idx} className="font-medium whitespace-pre-wrap text-zinc-200">
      {line}
    </p>
  );
};

export function CoachNotesCard({
  notes,
  className,
  title = "Бележки от треньора",
  variant = "default",
}: CoachNotesCardProps) {
  if (!notes || !notes.trim()) return null;

  const rawLines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-amber-500/40 bg-zinc-900/95 p-3.5 shadow-lg shadow-black/30 transition-all",
        variant === "compact" && "p-2.5 text-xs",
        variant === "highlight" &&
          "border-indigo-500/40 bg-zinc-900/95 shadow-indigo-950/20",
        className
      )}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-400/20 text-amber-300",
            variant === "highlight" && "bg-indigo-400/20 text-indigo-300"
          )}
        >
          <ClipboardList className="size-3.5" />
        </div>
        <span
          className={cn(
            "text-xs font-black tracking-wider text-amber-300 uppercase",
            variant === "highlight" && "text-indigo-300"
          )}
        >
          {title}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-1.5 text-xs leading-relaxed text-zinc-100 sm:text-sm">
        {rawLines.map((line, idx) => renderNoteLine(line, idx))}
      </div>
    </div>
  );
}
