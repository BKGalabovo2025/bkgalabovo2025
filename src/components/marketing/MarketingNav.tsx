"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  getActiveMarketingSectionId,
  MARKETING_SECTIONS,
} from "./marketing-sections";

interface MarketingNavProps {
  className?: string;
  templatesCount?: number;
}

export function MarketingNav({
  className,
  templatesCount = 0,
}: MarketingNavProps) {
  const pathname = usePathname();
  const activeSection = getActiveMarketingSectionId(pathname) || "contacts";

  return (
    <nav
      aria-label="Навигация в маркетинг и CRM"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 backdrop-blur-xs sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {MARKETING_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const href = `/marketing/${section.pathSuffix}`;

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
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
            />
            <span>{section.label}</span>

            {section.id === "templates" && templatesCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 px-1.5 py-0 text-[10px] font-black leading-none bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              >
                {templatesCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
