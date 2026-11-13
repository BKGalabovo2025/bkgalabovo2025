"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Search,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { markAbsenceSeenByAdminAction } from "@/lib/actions/parent-portal";
import { cn } from "@/lib/utils";

import { useParentAdminContext } from "../ParentAdminContext";

const REASON_LABELS: Record<string, string> = {
  illness: "Болест / Неразположение 🤒",
  school: "Училище / Изпит 📚",
  travel: "Семейно пътуване / Лични 🚗",
  injury: "Контузия / Възстановване 🩹",
  other: "Друго ✏️",
};

type AbsenceStatusFilter = "all" | "submitted" | "seen" | "cancelled";
type AbsencePeriodFilter = "all" | "today" | "upcoming" | "past";
type AbsenceSortOption = "newest" | "startDate";

const ITEMS_PER_PAGE = 10;

function formatDateSafe(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bg-BG");
}

export function ParentAbsencesSectionView() {
  const { absences, setAbsenceReplyId, setAbsenceReplyText, refetch } =
    useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AbsenceStatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<AbsencePeriodFilter>("all");
  const [sortBy, setSortBy] = useState<AbsenceSortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const todayStr = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Sofia",
      }).format(new Date()),
    []
  );

  const filteredAbsences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = absences.filter((abs) => {
      if (statusFilter === "submitted" && abs.status !== "submitted")
        return false;
      if (statusFilter === "seen" && abs.status !== "seen") return false;
      if (
        statusFilter === "cancelled" &&
        abs.status !== "cancelled_by_parent" &&
        (abs.status as string) !== "cancelled"
      ) {
        return false;
      }

      const effectiveEnd = abs.endDate || abs.startDate;
      if (periodFilter === "today") {
        if (!(abs.startDate <= todayStr && effectiveEnd >= todayStr)) {
          return false;
        }
      } else if (periodFilter === "upcoming") {
        if (abs.startDate <= todayStr) {
          return false;
        }
      } else if (periodFilter === "past") {
        if (effectiveEnd >= todayStr) {
          return false;
        }
      }

      if (!q) return true;
      const memberMatch = (abs.memberName || "").toLowerCase().includes(q);
      const parentMatch = (abs.parentName || "").toLowerCase().includes(q);
      const noteMatch = (abs.note || "").toLowerCase().includes(q);
      const reasonMatch = (REASON_LABELS[abs.reason] || abs.reason || "")
        .toLowerCase()
        .includes(q);
      return memberMatch || parentMatch || noteMatch || reasonMatch;
    });

    return filtered.slice().sort((a, b) => {
      if (sortBy === "startDate") {
        return (a.startDate || "").localeCompare(b.startDate || "");
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [absences, searchQuery, statusFilter, periodFilter, sortBy, todayStr]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAbsences.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedAbsences = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredAbsences.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAbsences, safePage]);

  useDeepLinkHighlight("absence", filteredAbsences.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към отсъствието е копиран!");
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  const toggleSelectAbsence = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkSeen = async () => {
    if (selectedIds.length === 0 || isBulkMarking) return;
    setIsBulkMarking(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => markAbsenceSeenByAdminAction(id))
      );
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = selectedIds.length - succeeded;

      if (succeeded > 0) {
        toast.success(
          `Маркирани като видяни: ${succeeded} отсъстви${succeeded === 1 ? "е" : "я"}.`
        );
      }
      if (failed > 0) {
        toast.error(`Грешка при ${failed} от избраните отсъствия.`);
      }
      setSelectedIds([]);
      await refetch();
    } catch {
      toast.error("Системна грешка при груповото маркиране.");
    } finally {
      setIsBulkMarking(false);
    }
  };

  if (absences.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <CalendarDays
          size={40}
          className="mx-auto text-zinc-400 dark:text-zinc-500"
        />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
          Няма подадени уведомления за отсъствие
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Когато родител заяви предстоящо отсъствие през своя портал, то ще се
          появи тук.
        </p>
      </div>
    );
  }

  const filterPills: { id: AbsenceStatusFilter; label: string }[] = [
    { id: "all", label: `Всички (${absences.length})` },
    {
      id: "submitted",
      label: `Нови (${absences.filter((a) => a.status === "submitted").length})`,
    },
    {
      id: "seen",
      label: `Видени (${absences.filter((a) => a.status === "seen").length})`,
    },
    {
      id: "cancelled",
      label: `Отменени (${
        absences.filter(
          (a) =>
            a.status === "cancelled_by_parent" ||
            (a.status as string) === "cancelled"
        ).length
      })`,
    },
  ];

  const unseenOnPage = paginatedAbsences.filter(
    (a) => a.status === "submitted"
  );
  const allUnseenOnPageSelected =
    unseenOnPage.length > 0 &&
    unseenOnPage.every((a) => selectedIds.includes(a.id));

  const toggleSelectAllOnPage = () => {
    const pageIds = unseenOnPage.map((a) => a.id);
    if (allUnseenOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 dark:text-zinc-500" />
            <Input
              id="parent-absences-search"
              name="parentAbsencesSearch"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Търси по състезател, родител или бележка..."
              className="h-9 rounded-xl pl-8 text-xs"
            />
          </div>

          <select
            id="parent-absences-period"
            name="parentAbsencesPeriod"
            aria-label="Филтър по период"
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value as AbsencePeriodFilter);
              setCurrentPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            <option value="all" className="dark:bg-zinc-900 dark:text-zinc-100">
              Всички периоди
            </option>
            <option
              value="today"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Днешни
            </option>
            <option
              value="upcoming"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Предстоящи
            </option>
            <option
              value="past"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Минали
            </option>
          </select>

          <select
            id="parent-absences-sort"
            name="parentAbsencesSort"
            aria-label="Сортиране на отсъствия"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as AbsenceSortOption);
              setCurrentPage(1);
            }}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            <option
              value="newest"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Най-нови
            </option>
            <option
              value="startDate"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              По начална дата
            </option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setStatusFilter(pill.id);
                setCurrentPage(1);
              }}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                statusFilter === pill.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {(unseenOnPage.length > 0 || selectedIds.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allUnseenOnPageSelected}
              onChange={toggleSelectAllOnPage}
              className="size-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span>
              Избери всички невидяни на страницата ({unseenOnPage.length})
            </span>
          </label>

          {selectedIds.length > 0 && (
            <Button
              type="button"
              size="sm"
              disabled={isBulkMarking}
              onClick={handleBulkMarkSeen}
              className="rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <Check size={14} className="mr-1 dark:text-emerald-400" />
              <span>
                {isBulkMarking
                  ? "Маркиране..."
                  : `Маркирай избраните като видяни (${selectedIds.length})`}
              </span>
            </Button>
          )}
        </div>
      )}

      {filteredAbsences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Няма намерени отсъствия за избрания филтър.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedAbsences.map((abs) => {
            const dateDisplay =
              abs.type === "period" && abs.endDate
                ? `от ${abs.startDate} до ${abs.endDate}`
                : `на ${abs.startDate}`;
            const isSelected = selectedIds.includes(abs.id);

            return (
              <div
                key={abs.id}
                id={`absence-${abs.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div className="flex items-start gap-3">
                  {abs.status === "submitted" && (
                    <input
                      type="checkbox"
                      aria-label={`Избери отсъствие на ${abs.memberName}`}
                      checked={isSelected}
                      onChange={() => toggleSelectAbsence(abs.id)}
                      className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
                    />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {abs.memberId ? (
                        <Link
                          href={`/members/${abs.memberId}`}
                          className="text-sm font-bold text-zinc-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                        >
                          {abs.memberName}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {abs.memberName}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[11px]"
                      >
                        {REASON_LABELS[abs.reason] || abs.reason}
                      </Badge>
                      {abs.status === "submitted" ? (
                        <Badge className="bg-orange-500 text-white text-[10px]">
                          Ново
                        </Badge>
                      ) : abs.status === "seen" ? (
                        <Badge
                          variant="outline"
                          className="text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-[10px]"
                        >
                          ✓ Видяно от треньор
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Отменено от родител
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Период:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-200">
                        {dateDisplay}
                      </strong>{" "}
                      • Подадено от: {abs.parentName} (
                      {formatDateSafe(abs.createdAt)})
                    </div>

                    {abs.note && (
                      <p className="mt-1.5 text-xs text-zinc-600 italic dark:text-zinc-300">
                        Бележка: &quot;{abs.note}&quot;
                      </p>
                    )}

                    {abs.coachReply && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Ваш отговор към родителя: &quot;{abs.coachReply}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyLink(abs.id)}
                    title="Копирай директен линк към това отсъствие"
                    className="size-8 rounded-xl text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    {copiedId === abs.id ? (
                      <Check
                        size={14}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <Link2 size={14} />
                    )}
                  </Button>

                  {abs.status === "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setAbsenceReplyId(abs.id);
                        setAbsenceReplyText("Бързо оздравяване!");
                      }}
                      className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
                    >
                      <Check size={14} className="mr-1 dark:text-emerald-400" />
                      <span>Маркирай като видяно</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span>
            Страница {safePage} от {totalPages} (общо {filteredAbsences.length})
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Предишна страница"
              className="h-8 rounded-xl px-2.5 text-xs"
            >
              <ChevronLeft size={14} className="mr-1" />
              Предишна
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Следваща страница"
              className="h-8 rounded-xl px-2.5 text-xs"
            >
              Следваща
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
