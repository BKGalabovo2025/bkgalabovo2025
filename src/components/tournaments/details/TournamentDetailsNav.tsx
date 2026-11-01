"use client";

import { Network, Swords, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  getActiveTournamentSectionId,
  TOURNAMENT_DETAILS_SECTIONS,
  type TournamentSectionId,
} from "./tournament-details-sections";
import { useTournamentDetailsContext } from "./TournamentDetailsContext";

const SECTION_ICONS: Record<
  TournamentSectionId,
  React.ComponentType<{ className?: string }>
> = {
  participants: Users,
  bracket: Network,
  matches: Swords,
  results: Trophy,
};

const ACCENT_CLASSES = {
  blue: {
    link: "border-blue-200/80 bg-blue-50/40 text-blue-800 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    link: "border-emerald-200/80 bg-emerald-50/40 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    link: "border-amber-200/80 bg-amber-50/40 text-amber-800 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
} as const;

export function TournamentDetailsNav() {
  const pathname = usePathname();
  const { tournamentId, entries, matches } = useTournamentDetailsContext();

  const basePath = `/tournaments/${tournamentId}`;
  const activeId = getActiveTournamentSectionId(pathname, tournamentId);

  return (
    <TooltipProvider delayDuration={150}>
      <nav
        aria-label="Секции на турнира"
        className="sticky top-14 z-20 -mx-3 border-b border-zinc-200/80 bg-white/95 px-3 py-2.5 backdrop-blur-md sm:top-16 sm:-mx-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
          {TOURNAMENT_DETAILS_SECTIONS.map((section) => {
            const href = `${basePath}${section.pathSuffix}`;
            const isActive = section.id === activeId;
            const Icon = SECTION_ICONS[section.id];
            const accent = section.accent
              ? ACCENT_CLASSES[section.accent]
              : null;

            let countBadge: number | null = null;
            if (section.id === "participants") countBadge = entries.length;
            if (section.id === "matches") countBadge = matches.length;

            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium transition-all select-none",
                      isActive
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                        : "border-zinc-200/80 bg-zinc-50/80 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-850 dark:hover:text-zinc-100",
                      !isActive && accent?.link
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2 truncate">
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive
                            ? "text-white dark:text-zinc-950"
                            : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200",
                          !isActive && accent?.icon
                        )}
                      />
                      <span className="truncate">{section.label}</span>
                    </div>

                    {countBadge !== null && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "ml-auto h-5 px-1.5 text-[10px] font-semibold tracking-tight shadow-none",
                          isActive
                            ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900"
                            : "border-zinc-200/80 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        {countBadge}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{section.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
