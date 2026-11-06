"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  FEEDBACK_SECTIONS,
  getActiveFeedbackSectionId,
} from "./feedback-sections";

interface FeedbackNavProps {
  className?: string;
  pendingCount?: number;
  campaignsCount?: number;
  templatesCount?: number;
}

export function FeedbackNav({
  className,
  pendingCount = 0,
  campaignsCount = 0,
  templatesCount = 0,
}: FeedbackNavProps) {
  const pathname = usePathname();
  const activeSection = getActiveFeedbackSectionId(pathname) || "submissions";

  return (
    <nav
      aria-label="Навигация в отзиви и анкети"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 backdrop-blur-xs sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {FEEDBACK_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const href = `/feedback/${section.pathSuffix}`;

        let badgeCount: number | null = null;
        let isDestructive = false;

        if (section.id === "submissions" && pendingCount > 0) {
          badgeCount = pendingCount;
          isDestructive = true;
        } else if (section.id === "campaigns" && campaignsCount > 0) {
          badgeCount = campaignsCount;
        } else if (section.id === "templates" && templatesCount > 0) {
          badgeCount = templatesCount;
        }

        return (
          <Link
            key={section.id}
            href={href}
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
                "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
            />
            <span>{section.label}</span>

            {badgeCount !== null && (
              <Badge
                variant={isDestructive ? "destructive" : "secondary"}
                className={cn(
                  "ml-0.5 px-1.5 py-0 text-[10px] font-black leading-none",
                  !isDestructive &&
                    "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                )}
              >
                {badgeCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
