"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import {
  getActiveTripSectionId,
  getTripSectionHref,
  TRIP_DETAIL_SECTIONS,
  type TripDetailSectionId,
} from "./trip-details-sections";
import { useTripDetails } from "./TripDetailsContext";

interface TripDetailsNavProps {
  tripId: string;
  className?: string;
}

export function TripDetailsNav({ tripId, className }: TripDetailsNavProps) {
  const pathname = usePathname();
  const activeSection = getActiveTripSectionId(pathname, tripId) || "overview";
  const { trip, expenses, membersDict } = useTripDetails();

  const getSectionReadiness = (
    sectionId: TripDetailSectionId
  ): "ready" | "missing" | null => {
    if (sectionId === "expenses") {
      return expenses.length > 0 || trip.transportType === "free"
        ? "ready"
        : "missing";
    }
    if (sectionId === "order") {
      return trip.orderNumber ? "ready" : "missing";
    }
    if (sectionId === "protocol") {
      return trip.usDecision || trip.usProtocolNumber ? "ready" : "missing";
    }
    if (sectionId === "athletes") {
      const athletes = (trip.participantsIds || []).filter(
        (id) => !membersDict[id]?.isCoach
      );
      const allAthletesSigned =
        athletes.length === 0 ||
        athletes.every((id) => Boolean(trip.signatures?.athletes?.[id]));
      const ready =
        Boolean(trip.signatures?.coach) &&
        Boolean(trip.signatures?.chairman) &&
        allAthletesSigned;
      return ready ? "ready" : "missing";
    }
    if (sectionId === "report") {
      return trip.reportText && trip.reportText.trim().length > 0
        ? "ready"
        : "missing";
    }
    return null;
  };

  return (
    <nav
      aria-label="Навигация в командировка"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 backdrop-blur-xs sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {TRIP_DETAIL_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const href = getTripSectionHref(tripId, section.id);
        const readiness = getSectionReadiness(section.id);

        return (
          <Link
            key={section.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={
              readiness === "ready"
                ? `${section.tooltip} (Попълнено)`
                : readiness === "missing"
                  ? `${section.tooltip} (Изисква внимание / липсват данни)`
                  : section.tooltip
            }
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
            />
            <span>{section.label}</span>
            {readiness && (
              <span
                aria-label={readiness === "ready" ? "Готово" : "Липсват данни"}
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  readiness === "ready"
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-amber-500 dark:bg-amber-400"
                )}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
