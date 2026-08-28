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
    /^\d+\./.test(line)
  );
};

const cleanBulletLine = (line: string): string => {
  if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
    return line.slice(1).trim();
  }
  return line.replace(/^\d+\.\s*/, "").trim();
};

const renderNoteLine = (line: string, idx: number) => {
  if (isTagLabel(line)) {
    const [label, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    return (
      <div
        key={idx}
        className="flex flex-col gap-0.5 rounded-lg border border-amber-300/60 bg-amber-100/50 p-2 sm:flex-row sm:items-baseline sm:gap-2 dark:border-amber-800/60 dark:bg-zinc-900/90"
      >
        <span className="shrink-0 font-bold text-amber-950 dark:text-amber-300">
          {label}:
        </span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {value}
        </span>
      </div>
    );
  }

  if (isBulletLine(line)) {
    const cleanContent = cleanBulletLine(line);
    return (
      <div key={idx} className="flex items-start gap-2 pl-1">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
        <span className="flex-1 font-semibold text-zinc-900 dark:text-zinc-100">
          {cleanContent}
        </span>
      </div>
    );
  }

  return (
    <p
      key={idx}
      className="font-semibold whitespace-pre-wrap text-zinc-900 dark:text-zinc-100"
    >
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
        "relative overflow-hidden rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 shadow-sm transition-all dark:border-amber-700/60 dark:bg-amber-950/50",
        variant === "compact" && "p-2.5 text-xs",
        variant === "highlight" &&
          "border-indigo-300/80 bg-indigo-50/90 dark:border-indigo-700/60 dark:bg-indigo-950/50",
        className
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-300",
            variant === "highlight" &&
              "bg-indigo-200 text-indigo-900 dark:bg-indigo-900/80 dark:text-indigo-300"
          )}
        >
          <ClipboardList className="size-3.5" />
        </div>
        <span
          className={cn(
            "text-xs font-bold tracking-wider text-amber-950 uppercase dark:text-amber-200",
            variant === "highlight" && "text-indigo-950 dark:text-indigo-200"
          )}
        >
          {title}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-1.5 text-xs leading-relaxed text-zinc-900 sm:text-sm dark:text-zinc-100">
        {rawLines.map((line, idx) => renderNoteLine(line, idx))}
      </div>
    </div>
  );
}
