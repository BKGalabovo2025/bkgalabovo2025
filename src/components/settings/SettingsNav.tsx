"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import {
  getActiveSettingsSectionId,
  SETTINGS_SECTIONS,
} from "./settings-sections";

interface SettingsNavProps {
  className?: string;
}

export function SettingsNav({ className }: SettingsNavProps) {
  const pathname = usePathname();
  const activeSection = getActiveSettingsSectionId(pathname) || "general";

  return (
    <nav
      aria-label="Навигация в настройки"
      className={cn(
        "no-scrollbar flex h-auto w-full flex-nowrap justify-start gap-1.5 overflow-x-auto bg-transparent p-1 lg:flex-col lg:overflow-visible lg:p-0",
        className
      )}
    >
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const href = `/settings/${section.pathSuffix}`;

        return (
          <Link
            key={section.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={section.tooltip}
            className={cn(
              "group inline-flex shrink-0 items-center justify-start rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide whitespace-nowrap uppercase transition-all sm:px-4 sm:py-2.5 lg:w-full",
              isActive
                ? section.id === "recovery"
                  ? "bg-[#00f2fe]/10 text-[#00f2fe]"
                  : section.id === "audit"
                    ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                    : section.id === "backup"
                      ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                      : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                : "text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            )}
          >
            <Icon
              className={cn(
                "mr-2.5 size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? section.id === "recovery"
                    ? "text-[#00f2fe]"
                    : section.id === "audit"
                      ? "text-indigo-500 dark:text-indigo-400"
                      : section.id === "backup"
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-primary dark:text-primary-foreground"
                  : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
              )}
              strokeWidth={1.5}
            />
            <span>{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
