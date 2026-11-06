"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useFeedbackContext } from "./FeedbackContext";
import { FeedbackNav } from "./FeedbackNav";

interface FeedbackLayoutClientProps {
  children: React.ReactNode;
}

export function FeedbackLayoutClient({ children }: FeedbackLayoutClientProps) {
  const { siteId, campaigns, templates, stats, isLoading } =
    useFeedbackContext();

  return (
    <div className="space-y-4 pb-12 duration-500 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <PageHeader
          title={
            siteId === "recoveryzone"
              ? "Отзиви & Анкети | Recovery Zone"
              : "Отзиви & Обратна връзка"
          }
          description={
            siteId === "recoveryzone"
              ? "Управление на обратна връзка от клиенти на възстановителния център, линкове за оценка и модерация на публични препоръки."
              : "Управление на клиентска удовлетвореност, анкети за събития, линкове за родители и модерация на публични отзиви."
          }
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Отзиви и Анкети", href: "/feedback" },
          ]}
        />

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-lg border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Sparkles className="mr-1 size-3 text-indigo-500 inline" />
            <span>
              {siteId === "recoveryzone" ? "Recovery Zone" : "БК Гълъбово"}
            </span>
          </Badge>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-200 bg-white text-xs font-semibold text-zinc-700 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:text-indigo-400"
          >
            <Link
              href={siteId === "recoveryzone" ? "/reviews" : "/#reviews"}
              target="_blank"
              className="flex items-center gap-1.5"
            >
              <span>Виж в сайта</span>
              <ExternalLink className="size-3 text-zinc-400" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Pending Submissions */}
        <Card className="border-amber-200/80 bg-linear-to-br from-amber-50/60 to-white shadow-2xs dark:border-amber-900/50 dark:from-amber-950/30 dark:to-zinc-900">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-400">
                Чакащи преглед
              </span>
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100">
              {isLoading ? "—" : stats.pendingSubmissions}
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-300">
              {stats.pendingSubmissions === 1
                ? "1 нов за одобрение"
                : `${stats.pendingSubmissions} за одобрение`}
            </p>
          </CardContent>
        </Card>

        {/* Approved Public Reviews */}
        <Card className="border-emerald-200/80 bg-linear-to-br from-emerald-50/60 to-white shadow-2xs dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-zinc-900">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-emerald-800 uppercase dark:text-emerald-400">
                Одобрени отзиви
              </span>
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
              {isLoading ? "—" : stats.approvedSubmissions}
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300">
              Показват се в сайта
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-indigo-200/80 bg-linear-to-br from-indigo-50/60 to-white shadow-2xs dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-zinc-900">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-indigo-900 uppercase dark:text-indigo-400">
                Средна оценка
              </span>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xl sm:text-2xl font-black text-indigo-950 dark:text-indigo-100">
              <span>{isLoading ? "—" : stats.averageRating}</span>
              <span className="text-xs font-semibold text-zinc-400">/ 5.0</span>
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-indigo-700 dark:text-indigo-300">
              От {stats.totalSubmissions} отзива
            </p>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-400">
                {siteId === "recoveryzone"
                  ? "Анкети & Кампании"
                  : "Анкети за събития"}
              </span>
              <LinkIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {isLoading ? "—" : campaigns.length}
            </div>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
              Генерирани линка
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchical Subpage Nav */}
      <div className="sticky top-16 z-20 -mx-1 flex flex-col gap-2 backdrop-blur-md sm:top-20 sm:flex-row sm:items-center sm:justify-between p-1">
        <FeedbackNav
          pendingCount={stats.pendingSubmissions}
          campaignsCount={campaigns.length}
          templatesCount={templates.length}
        />
      </div>

      {/* Section Content */}
      <div className="duration-300 animate-in fade-in-50">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
