"use client";

import {
  CalendarDays,
  History,
  MessageSquareText,
  Pencil,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  getActiveParentAdminSectionId,
  PARENT_ADMIN_SECTIONS,
  ParentAdminSectionId,
} from "./parent-admin-sections";
import { useParentAdminContext } from "./ParentAdminContext";

const SECTION_ICONS: Record<
  ParentAdminSectionId,
  React.ComponentType<{ className?: string }>
> = {
  requests: UserPlus,
  accounts: Users,
  absences: CalendarDays,
  corrections: Pencil,
  activity: History,
  messages: MessageSquareText,
};

export function ParentsNav() {
  const pathname = usePathname();
  const activeSection = getActiveParentAdminSectionId(pathname) || "requests";

  const {
    stats,
    parents,
    absences,
    corrections,
    onlineParentsCount,
    communications,
  } = useParentAdminContext();

  const pendingRequestsCount = stats.pendingRequestsCount;
  const pendingAbsencesCount = stats.pendingAbsencesCount;
  const pendingCorrectionsCount = stats.pendingCorrectionsCount;

  const getBadgeValue = (id: ParentAdminSectionId) => {
    switch (id) {
      case "requests":
        return pendingRequestsCount > 0 ? pendingRequestsCount : null;
      case "accounts":
        return parents.length;
      case "absences":
        if (pendingAbsencesCount > 0) return `${pendingAbsencesCount} нови`;
        return absences.length > 0 ? absences.length : null;
      case "corrections":
        if (pendingCorrectionsCount > 0)
          return `${pendingCorrectionsCount} нови`;
        return corrections.length > 0 ? corrections.length : null;
      case "activity":
        return onlineParentsCount > 0 ? `${onlineParentsCount} на живо` : null;
      case "messages":
        return communications.length > 0 ? communications.length : null;
      default:
        return null;
    }
  };

  const getBadgeVariant = (id: ParentAdminSectionId, isActive: boolean) => {
    const neutralClasses = isActive
      ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100 font-bold"
      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

    switch (id) {
      case "requests":
        return pendingRequestsCount > 0
          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
          : neutralClasses;
      case "absences":
        return pendingAbsencesCount > 0
          ? "bg-orange-600 text-white animate-pulse motion-reduce:animate-none"
          : neutralClasses;
      case "corrections":
        return pendingCorrectionsCount > 0
          ? "bg-indigo-600 text-white animate-pulse motion-reduce:animate-none"
          : neutralClasses;
      case "activity":
        return onlineParentsCount > 0
          ? "bg-emerald-600 text-white font-bold"
          : neutralClasses;
      default:
        return neutralClasses;
    }
  };

  return (
    <div className="relative w-full">
      <nav
        aria-label="Секции на родителския портал"
        className="no-scrollbar flex w-full items-center gap-1 sm:gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-100 p-1.5 pr-7 sm:pr-1.5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {PARENT_ADMIN_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = activeSection === section.id;
          const targetHref = `/parents${section.pathSuffix}`;
          const badgeValue = getBadgeValue(section.id);
          const badgeClasses = getBadgeVariant(section.id, isActive);

          return (
            <Link
              key={section.id}
              href={targetHref}
              aria-current={isActive ? "page" : undefined}
              title={section.tooltip}
              className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{section.label}</span>
              {badgeValue !== null && (
                <span
                  className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${badgeClasses}`}
                >
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 right-1 w-8 rounded-r-xl bg-linear-to-l from-zinc-100 via-zinc-100/80 to-transparent dark:from-zinc-900 dark:via-zinc-900/80 sm:hidden"
      />
    </div>
  );
}
