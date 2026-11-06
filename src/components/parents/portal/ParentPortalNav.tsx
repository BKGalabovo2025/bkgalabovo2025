"use client";

import {
  CalendarDays,
  CalendarX2,
  CreditCard,
  FileText,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import { cn } from "@/lib/utils";

import {
  getActiveParentPortalSectionId,
  getParentPortalSectionHref,
  ParentPortalSectionId,
} from "./parent-portal-sections";
import { useParentPortalContext } from "./ParentPortalContext";

export function ParentPortalNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { portal } = useParentPortalContext();
  const activeSection: ParentPortalSectionId =
    getActiveParentPortalSectionId(pathname) || "attendance";
  const childParam = searchParams.get("child");
  const qs = childParam ? `?child=${childParam}` : "";
  const { documentsData, absences, feeStatus, permissions } = portal;

  const pendingDocsCount = (documentsData?.sentDocuments || []).filter(
    (d) => d.status === "pending"
  ).length;

  const unpaidCount = feeStatus?.unpaidSalesCount || 0;

  const TABS: Array<{
    id: ParentPortalSectionId;
    label: string;
    icon: React.ElementType;
    badge?: number | string | null;
    badgeVariant?: "danger" | "warning" | "info";
    visible?: boolean;
  }> = [
    {
      id: "attendance",
      label: "Присъствия & График",
      icon: CalendarDays,
    },
    {
      id: "documents",
      label: "Документи & Картотека",
      icon: FileText,
      badge: pendingDocsCount > 0 ? pendingDocsCount : null,
      badgeVariant: "danger",
      visible: permissions?.showDocumentsStatus !== false || !!documentsData,
    },
    {
      id: "finances",
      label: "Такси & Бележки",
      icon: CreditCard,
      badge: unpaidCount > 0 ? `${unpaidCount}` : null,
      badgeVariant: "warning",
      visible: permissions?.showFeeStatus !== false,
    },
    {
      id: "profile",
      label: "Данни за детето",
      icon: User,
    },
    {
      id: "development",
      label: "Спортно развитие",
      icon: Trophy,
      visible: !!(
        permissions?.showRanking || permissions?.showShadowAndQuizzes
      ),
    },
    {
      id: "absences",
      label: "Заявени отсъствия",
      icon: CalendarX2,
      badge: absences.length > 0 ? absences.length : null,
      badgeVariant: "info",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {TABS.filter((t) => t.visible !== false).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <Link
              key={tab.id}
              href={`${getParentPortalSectionHref(tab.id as ParentPortalSectionId)}${qs}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer select-none",
                isActive
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/40"
              )}
            >
              <Icon
                size={14}
                className={cn(
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              />
              <span>{tab.label}</span>

              {tab.badge !== null && tab.badge !== undefined && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-black",
                    tab.badgeVariant === "danger"
                      ? "bg-indigo-600 text-white"
                      : tab.badgeVariant === "warning"
                        ? "bg-amber-500 text-white"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
