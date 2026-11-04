"use client";

import { CalendarDays, Check } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useParentAdminContext } from "../ParentAdminContext";

const REASON_LABELS: Record<string, string> = {
  illness: "Болест / Неразположение 🤒",
  school: "Училище / Изпит 📚",
  travel: "Семейно пътуване / Лични 🚗",
  injury: "Контузия / Възстановяване 🩹",
  other: "Друго ✏️",
};

export function ParentAbsencesSectionView() {
  const { absences, setAbsenceReplyId, setAbsenceReplyText } =
    useParentAdminContext();

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

  return (
    <div className="space-y-3">
      {absences.map((abs) => {
        const dateDisplay =
          abs.type === "period" && abs.endDate
            ? `от ${abs.startDate} до ${abs.endDate}`
            : `на ${abs.startDate}`;

        return (
          <div
            key={abs.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div>
              <div className="flex items-center gap-2">
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

            {abs.status === "submitted" && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
