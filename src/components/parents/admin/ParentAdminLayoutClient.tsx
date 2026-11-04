"use client";

import {
  CalendarDays,
  Download,
  Pencil,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getActiveParentAdminSectionId } from "./parent-admin-sections";
import { useParentAdminContext } from "./ParentAdminContext";
import { ParentAdminDialogs } from "./ParentAdminDialogs";
import { ParentsNav } from "./ParentsNav";

interface ParentAdminLayoutClientProps {
  children: React.ReactNode;
}

export function ParentAdminLayoutClient({
  children,
}: ParentAdminLayoutClientProps) {
  const pathname = usePathname();
  const activeSection = getActiveParentAdminSectionId(pathname) || "requests";

  const {
    stats,
    parents,
    onlineParentsCount,
    isLoading,
    refetch,
    handleExportCsv,
    setManualAddOpen,
  } = useParentAdminContext();

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900 sm:text-3xl dark:text-white">
              Родителски достъп
            </h1>
            {stats.totalPending > 0 && (
              <Badge className="bg-red-600 text-white font-bold animate-pulse">
                {stats.totalPending} чакащи
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Управление на родителски профили, заявки за регистрация, уведомления
            за отсъствия и корекции на данни.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <Download size={15} className="mr-1.5" />
            <span>Експорт контакти (CSV)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setManualAddOpen(true)}
            className="rounded-xl bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-500"
          >
            <UserPlus size={15} className="mr-1.5" />
            <span>+ Добави родител</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl"
            title="Презареди данни"
            aria-label="Презареди данни"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin text-blue-500" : ""}
            />
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards as Deep Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-3">
        <Link
          href="/parents/requests"
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeSection === "requests"
              ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Чакащи заявки
            </span>
            <Users size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingRequestsCount}
          </div>
        </Link>

        <Link
          href="/parents/accounts"
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeSection === "accounts"
              ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Активни родители
            </span>
            <UserCheck size={16} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {parents.length}
          </div>
        </Link>

        <Link
          href="/parents/activity"
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeSection === "activity"
              ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              На линия сега
            </span>
            <span className="relative flex size-2.5">
              {onlineParentsCount > 0 && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  onlineParentsCount > 0
                    ? "bg-emerald-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {onlineParentsCount}
          </div>
        </Link>

        <Link
          href="/parents/absences"
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeSection === "absences"
              ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Чакащи отсъствия
            </span>
            <CalendarDays size={16} className="text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingAbsencesCount}
          </div>
        </Link>

        <Link
          href="/parents/corrections"
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeSection === "corrections"
              ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Корекции на данни
            </span>
            <Pencil size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingCorrectionsCount}
          </div>
        </Link>
      </div>

      {/* Main Hierarchical Subpages Navigation */}
      <ParentsNav />

      {/* Active Section Content */}
      <main className="space-y-4">{children}</main>

      {/* Global Parent Admin Dialogs */}
      <ParentAdminDialogs />
    </div>
  );
}
