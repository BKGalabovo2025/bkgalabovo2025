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

interface ParsedSection {
  type: "header_with_items" | "tag" | "text";
  title?: string;
  items?: string[];
  tagLabel?: string;
  tagValue?: string;
  text?: string;
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

const createTagSection = (line: string): ParsedSection => {
  const [label, ...rest] = line.split(":");
  return {
    type: "tag",
    tagLabel: label.trim(),
    tagValue: rest.join(":").trim(),
  };
};

const parseCoachNotes = (notes: string): ParsedSection[] => {
  const lines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let currentGroup: { title: string; items: string[] } | null = null;

  const flushGroup = () => {
    if (currentGroup) {
      sections.push({ type: "header_with_items", ...currentGroup });
      currentGroup = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isTagLabel(line)) {
      flushGroup();
      sections.push(createTagSection(line));
      continue;
    }

    if (isSectionHeader(line)) {
      flushGroup();
      currentGroup = { title: line, items: [] };
      continue;
    }

    if (isBulletLine(line)) {
      const clean = cleanBulletLine(line);
      if (!currentGroup) {
        currentGroup = { title: "", items: [] };
      }
      currentGroup.items.push(clean);
      continue;
    }

    const nextLine = lines[i + 1];
    if (nextLine && isBulletLine(nextLine)) {
      flushGroup();
      currentGroup = { title: line, items: [] };
      continue;
    }

    flushGroup();
    sections.push({ type: "text", text: line });
  }

  flushGroup();
  return sections;
};

export function CoachNotesCard({
  notes,
  className,
  title = "Бележки от треньора:",
  variant = "default",
}: CoachNotesCardProps) {
  if (!notes || !notes.trim()) return null;

  const sections = parseCoachNotes(notes);

  return (
    <div
      className={cn(
        "mt-2.5 flex flex-col gap-2 rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 transition-all",
        variant === "compact" && "p-2 text-[11px]",
        variant === "highlight" &&
          "border-indigo-500/40 bg-zinc-950/90 shadow-indigo-950/20",
        className
      )}
    >
      {/* Header with icon matching Grouping header */}
      <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
        <ClipboardList size={13} className="shrink-0 text-amber-400" />
        <span>{title}</span>
      </span>

      {/* Sections structured like Grouping details */}
      <div className="space-y-2">
        {sections.map((sec, idx) => {
          if (sec.type === "header_with_items") {
            return (
              <div key={idx} className="text-xs text-zinc-300">
                {sec.title && (
                  <span className="font-bold text-white">{sec.title}</span>
                )}
                {sec.items && sec.items.length > 0 && (
                  <ul className="mt-1 space-y-1 border-l-2 border-indigo-500/40 pl-2.5">
                    {sec.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="text-xs font-medium text-zinc-200"
                      >
                        • {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }

          if (sec.type === "tag") {
            return (
              <div key={idx} className="text-xs text-zinc-300">
                <span className="font-bold text-amber-300">
                  {sec.tagLabel}:
                </span>{" "}
                <span className="font-medium text-zinc-200">
                  {sec.tagValue}
                </span>
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-xs font-medium whitespace-pre-wrap text-zinc-200"
            >
              {sec.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
