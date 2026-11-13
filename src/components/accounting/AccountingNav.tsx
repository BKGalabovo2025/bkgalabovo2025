"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

import {
  ACCOUNTING_SECTIONS,
  getAccountingSectionHref,
  getActiveAccountingSectionId,
} from "./accounting-sections";

export function AccountingNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = getActiveAccountingSectionId(pathname) || "all";
  // Запазваме избрания месец, статус и филтър за липси при смяна на секция.
  const keep = new URLSearchParams();
  const month = searchParams.get("month");
  const status = searchParams.get("status");
  const incomplete = searchParams.get("incomplete");
  const view = searchParams.get("view");
  if (month) keep.set("month", month);
  if (status) keep.set("status", status);
  if (incomplete) keep.set("incomplete", incomplete);
  if (view) keep.set("view", view);
  const qs = keep.toString() ? `?${keep.toString()}` : "";

  return (
    <nav
      aria-label="Навигация в счетоводни отчети"
      className={cn(
        "no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60",
        className
      )}
    >
      {ACCOUNTING_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = active === section.id;
        return (
          <Link
            key={section.id}
            href={`${getAccountingSectionHref(section.id)}${qs}`}
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
                  ? "text-emerald-600 dark:text-emerald-400"
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
