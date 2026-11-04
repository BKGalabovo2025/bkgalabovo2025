"use client";

import {
  CalendarX2,
  CheckCircle2,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useParentPortalContext } from "../ParentPortalContext";

const REASON_LABELS: Record<string, string> = {
  illness: "Здравословни причини (боледуване)",
  injury: "Спортна травма",
  school: "Училищни ангажименти",
  travel: "Семейни причини / Пътуване",
  family_reasons: "Семейни причини / Пътуване",
  school_commitments: "Училищни ангажименти",
  other: "Други причини",
};

export function PortalAbsencesTabView() {
  const { portal, setAbsenceDialogOpen, handleCancelAbsence } =
    useParentPortalContext();

  const { absences, selectedChild } = portal;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
              <CalendarX2 size={16} className="text-amber-600" />
              <span>Подадени уведомления за отсъствие</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Информирайте треньорския щаб предварително при боледуване или
              отсъствие на {selectedChild?.firstName}.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setAbsenceDialogOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Ново уведомление</span>
          </Button>
        </div>

        {absences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
            Няма подадени уведомления за отсъствие на състезателя.
          </div>
        ) : (
          <div className="space-y-3">
            {absences.map((abs) => {
              const reasonText = REASON_LABELS[abs.reason] || abs.reason;
              const dateRange =
                abs.type === "period" && abs.endDate
                  ? `от ${abs.startDate} до ${abs.endDate}`
                  : `на ${abs.startDate}`;

              return (
                <div
                  key={abs.id}
                  className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        🗓️ Отсъствие {dateRange}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold"
                      >
                        {reasonText}
                      </Badge>
                      {abs.status === "seen" && (
                        <Badge className="bg-emerald-600 text-white text-[9px] font-bold gap-1">
                          <CheckCircle2 size={10} />
                          Прегледано от треньор
                        </Badge>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelAbsence(abs.id)}
                      className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30 self-end sm:self-auto"
                      title="Отмени това уведомление"
                    >
                      <Trash2 size={11} className="mr-1" />
                      <span>Отмени</span>
                    </Button>
                  </div>

                  {abs.note && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                      &quot;{abs.note}&quot;
                    </p>
                  )}

                  {/* Coach reply if present */}
                  {abs.coachReply && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200 flex items-start gap-2">
                      <MessageSquare
                        size={13}
                        className="text-blue-600 shrink-0 mt-0.5"
                      />
                      <div>
                        <span className="font-bold">Отговор от треньора:</span>{" "}
                        <span>{abs.coachReply}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    Подадено на:{" "}
                    {new Date(abs.createdAt).toLocaleString("bg-BG")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
