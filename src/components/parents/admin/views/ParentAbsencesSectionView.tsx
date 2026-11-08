"use client";

import { CalendarDays, Check, Link2, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { cn } from "@/lib/utils";

import { useParentAdminContext } from "../ParentAdminContext";

const REASON_LABELS: Record<string, string> = {
  illness: "Болест / Неразположение 🤒",
  school: "Училище / Изпит 📚",
  travel: "Семейно пътуване / Лични 🚗",
  injury: "Контузия / Възстановяване 🩹",
  other: "Друго ✏️",
};

type AbsenceStatusFilter = "all" | "submitted" | "seen" | "cancelled";

export function ParentAbsencesSectionView() {
  const { absences, setAbsenceReplyId, setAbsenceReplyText } =
    useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AbsenceStatusFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAbsences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return absences.filter((abs) => {
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
      if (!q) return true;
      const memberMatch = (abs.memberName || "").toLowerCase().includes(q);
      const parentMatch = (abs.parentName || "").toLowerCase().includes(q);
      const noteMatch = (abs.note || "").toLowerCase().includes(q);
      const reasonMatch = (REASON_LABELS[abs.reason] || abs.reason || "")
        .toLowerCase()
        .includes(q);
      return memberMatch || parentMatch || noteMatch || reasonMatch;
    });
  }, [absences, searchQuery, statusFilter]);

  useDeepLinkHighlight("absence", filteredAbsences.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към отсъствието е копиран!");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  if (absences.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <CalendarDays size={40} className="mx-auto text-zinc-400" />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <Input
            id="parent-absences-search"
            name="parentAbsencesSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търси по състезател, родител или бележка..."
            className="h-9 rounded-xl pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
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

      {filteredAbsences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Няма намерени отсъствия за избрания филтър.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAbsences.map((abs) => {
            const dateDisplay =
              abs.type === "period" && abs.endDate
                ? `от ${abs.startDate} до ${abs.endDate}`
                : `на ${abs.startDate}`;

            return (
              <div
                key={abs.id}
                id={`absence-${abs.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {abs.memberName}
                    </span>
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
                        className="text-emerald-600 border-emerald-500/40 text-[10px]"
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
                    {new Date(abs.createdAt).toLocaleDateString("bg-BG")})
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

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyLink(abs.id)}
                    title="Копирай директен линк към това отсъствие"
                    className="size-8 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {copiedId === abs.id ? (
                      <Check size={14} className="text-emerald-600" />
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
                      <Check size={14} className="mr-1" />
                      <span>Маркирай като видяно</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
