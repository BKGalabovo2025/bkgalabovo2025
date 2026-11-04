"use client";

import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { DocumentAttachmentType } from "@/components/schedule/DocumentViewerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "../ParentPortalContext";

const MONTH_NAMES = [
  "Януари",
  "Февруари",
  "Март",
  "Април",
  "Май",
  "Юни",
  "Юли",
  "Август",
  "Септември",
  "Октомври",
  "Ноември",
  "Декември",
];

export function PortalAttendanceTabView() {
  const {
    portal,
    selectedMonth,
    selectedYear,
    handlePrevMonth,
    handleNextMonth,
    monthlyAttendances,
    attendanceStats,
    setAbsenceDialogOpen,
    setActiveDocViewer,
    setActiveInquiryEvent,
    submittedInquiries,
    expandedEvents,
    toggleEventExpanded,
    logSessionAction,
  } = useParentPortalContext();

  const { announcements } = portal;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ── Month & Year Picker Bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="size-9 rounded-xl border-zinc-200 dark:border-zinc-800"
            aria-label="Предишен месец"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="min-w-36 text-center">
            <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="size-9 rounded-xl border-zinc-200 dark:border-zinc-800"
            aria-label="Следващ месец"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setAbsenceDialogOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-2xs cursor-pointer"
          >
            <CalendarX2 size={13} />
            <span>Уведоми за отсъствие</span>
          </Button>

          <Link href="/club/schedule">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            >
              <CalendarDays size={13} />
              <span>Клубен график</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Monthly Summary Stats Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 text-center">
          <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Общо за месеца
          </p>
          <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">
            {attendanceStats.total}
          </p>
          <span className="text-[10px] text-zinc-500 font-medium">
            тренировки
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20 text-center">
          <p className="text-[10px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
            Посетени
          </p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {attendanceStats.attended}
          </p>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-medium">
            отчетени присъствия
          </span>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3.5 shadow-2xs dark:border-rose-900/40 dark:bg-rose-950/20 text-center">
          <p className="text-[10px] font-bold tracking-wider text-rose-800 dark:text-rose-300 uppercase">
            Пропуснати
          </p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {attendanceStats.missed}
          </p>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-400 font-medium">
            отминали отсъствия
          </span>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-3.5 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20 text-center">
          <p className="text-[10px] font-bold tracking-wider text-blue-800 dark:text-blue-300 uppercase">
            Посещаемост
          </p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {attendanceStats.rate}%
          </p>
          <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-medium">
            активност за периода
          </span>
        </div>
      </div>

      {/* ── Attendance List for Selected Month ───────────────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xs font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-1.5">
            <CalendarDays size={14} className="text-blue-600" />
            <span>Дневник на тренировките за {MONTH_NAMES[selectedMonth]}</span>
          </h3>
          <span className="text-[11px] text-zinc-400 font-medium">
            {monthlyAttendances.length} събития
          </span>
        </div>

        {monthlyAttendances.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
            Няма намерени тренировъчни събития за избрания месец.
          </div>
        ) : (
          <div className="space-y-2">
            {monthlyAttendances.map((record) => {
              const d = new Date(record.startDate);
              const dateStr = d.toLocaleDateString("bg-BG", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = `${d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 transition-colors hover:bg-white hover:border-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 font-mono text-xs font-bold shadow-2xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300">
                      {d.getDate()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        {record.title || "Клубна тренировка"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {dateStr}, {timeStr}
                        </span>
                        {record.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-48">
                              {record.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {record.isUpcoming ? (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300"
                      >
                        ⏳ Предстояща
                      </Badge>
                    ) : record.attended ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                        <CheckCircle2 size={11} />
                        Присъствал
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-300 bg-rose-50 text-rose-700 text-[10px] font-bold gap-1 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <XCircle size={11} />
                        Отсъствал
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upcoming Competitions, Camps & Events ───────────────────── */}
      {announcements.length > 0 && (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" />
              <span>Предстоящи състезания, лагери и клубни събития</span>
            </h3>
            <Link
              href="/club/schedule"
              className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Пълен график →
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => {
              const isExpanded = !!expandedEvents[a.id];
              const eventType =
                a.type || (a.isTournament ? "competition" : "event");
              const isCompetition =
                eventType === "competition" || a.isTournament;
              const isCamp = eventType === "camp";

              return (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-2xl border p-4 transition-all shadow-2xs bg-white dark:bg-zinc-900",
                    isCompetition
                      ? "border-amber-200/90 hover:border-amber-400/80 dark:border-amber-900/40"
                      : isCamp
                        ? "border-emerald-200/90 hover:border-emerald-400/80 dark:border-emerald-900/40"
                        : "border-blue-200/90 hover:border-blue-400/80 dark:border-blue-900/40"
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            isCompetition
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                              : isCamp
                                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                          )}
                        >
                          {isCamp
                            ? "⛺ Спортен лагер"
                            : isCompetition
                              ? "🏆 Турнир / ДП"
                              : "🏸 Събитие"}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                          {a.title.replace(/^[^\w\sа-яА-ЯёЁ]+/, "").trim()}
                        </h4>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {submittedInquiries.has(a.id) ? (
                          <Badge className="bg-emerald-600 text-white px-3 py-1 text-xs font-bold rounded-xl">
                            ✓ Заявката е подадена
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              logSessionAction(`Записване за: „${a.title}“`);
                              setActiveInquiryEvent({
                                id: a.id,
                                title: a.title,
                                startTime: a.startDate || a.date,
                                endTime: a.endDate || a.startDate || a.date,
                                location: a.location,
                                type: a.type,
                              });
                            }}
                            className="h-8 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 cursor-pointer"
                          >
                            Запиши се
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                        <Clock size={12} className="text-blue-600" />
                        {a.periodText || a.content}
                      </span>
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-rose-500" />
                          {a.location}
                        </span>
                      )}
                    </div>

                    {/* Actions: Tournament Link, Attached Regulation */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      {a.tournamentUrl && (
                        <a
                          href={a.tournamentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/70 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <Trophy size={11} className="text-amber-600" />
                          <span>Схема / Страница</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </a>
                      )}

                      {a.attachmentUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const docName = a.attachmentName || "Наредба";
                            logSessionAction(
                              `Преглед на наредба: „${docName}“`
                            );
                            setActiveDocViewer({
                              url: a.attachmentUrl!,
                              name: docName,
                              type:
                                (a.attachmentType as DocumentAttachmentType) ||
                                "pdf",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-1 text-[11px] font-bold text-blue-900 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
                        >
                          <Eye size={11} />
                          <span>Наредба за състезанието</span>
                        </button>
                      )}

                      {a.description && (
                        <button
                          type="button"
                          onClick={() => toggleEventExpanded(a.id, a.title)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer ml-auto"
                        >
                          <span>{isExpanded ? "Свий" : "Подробности"}</span>
                          {isExpanded ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                      )}
                    </div>

                    {isExpanded && a.description && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-zinc-300">
                        {a.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
