"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { MODULE_HUBS, ModuleHubId } from "@/config/module-hubs";
import { cn } from "@/lib/utils";

interface ModuleHubBarProps {
  hub: ModuleHubId;
  className?: string;
}

export function ModuleHubBar({ hub, className }: ModuleHubBarProps) {
  const pathname = usePathname() || "";

  // Hide hub navigation on distraction-free live active workout view
  if (pathname.endsWith("/active")) {
    return null;
  }

  const config = MODULE_HUBS[hub];

  return (
    <nav
      aria-label={config.ariaLabel}
      className={cn(
        "no-scrollbar flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white/80 p-1 shadow-2xs backdrop-blur-sm sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/70",
        className
      )}
    >
      {config.tabs.map((tab) => {
        const isActive = tab.matchPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        );

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
