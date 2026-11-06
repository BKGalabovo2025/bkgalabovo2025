"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import {
  EXERCISE_SECTIONS,
  getActiveExerciseSectionId,
  getExerciseSectionHref,
} from "./exercise-sections";

export function ExercisesNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const active = getActiveExerciseSectionId(pathname) || "all";

  return (
    <nav
      aria-label="Навигация в базата с упражнения"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {EXERCISE_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = active === section.id;
        return (
          <Link
            key={section.id}
            href={getExerciseSectionHref(section.id)}
            aria-current={isActive ? "page" : undefined}
            title={section.tooltip}
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200",
              isActive
                ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 dark:text-zinc-500"
              )}
            />
            <span>{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
