"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getActiveShadowSection, SHADOW_SECTIONS } from "./shadow-sections";

interface ShadowNavProps {
  className?: string;
}

export function ShadowNav({ className }: ShadowNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = getActiveShadowSection(pathname);

  const queryString = searchParams?.toString();
  const preservedQuery = queryString ? `?${queryString}` : "";

  return (
    <nav
      aria-label="Секции на Shadow Training"
      className={cn(
        "flex w-full items-center gap-1.5 overflow-x-auto border-b border-zinc-200/80 bg-zinc-50/50 p-1.5 pb-2 scrollbar-none dark:border-zinc-800/80 dark:bg-zinc-900/40",
        className
      )}
    >
      {SHADOW_SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        const targetHref = `${section.href}${preservedQuery}`;

        return (
          <Link
            key={section.id}
            href={targetHref}
            prefetch
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
            )}
          >
            <span>{section.label}</span>
            {section.badge ? (
              <Badge
                variant="secondary"
                className={cn(
                  "px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider",
                  isActive
                    ? "bg-white/20 text-white dark:bg-zinc-900/30 dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                {section.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
