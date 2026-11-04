"use client";

import {
  History,
  Mail,
  MessageSquareText,
  Phone,
  PhoneCall,
  Search,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhoneDisplay } from "@/lib/phone-utils";

import { useParentAdminContext } from "../ParentAdminContext";

export function ParentMessagesSectionView() {
  const {
    parents,
    communications,
    selectedCommParentId,
    setSelectedCommParentId,
    commChannelFilter,
    setCommChannelFilter,
    commSearchQuery,
    setCommSearchQuery,
    setCallingParent,
    setEmailingParent,
  } = useParentAdminContext();

  const filteredComms = communications.filter((comm) => {
    if (
      selectedCommParentId !== "all" &&
      comm.parentId !== selectedCommParentId
    ) {
      return false;
    }
    if (commChannelFilter !== "all" && comm.channel !== commChannelFilter) {
      return false;
    }
    if (commSearchQuery.trim()) {
      const q = commSearchQuery.toLowerCase();
      const matchParent = (comm.parentName || "").toLowerCase().includes(q);
      const matchMember = (comm.memberName || "").toLowerCase().includes(q);
      const matchPhone = (comm.parentPhone || "").includes(q);
      const matchEmail = (comm.parentEmail || "").toLowerCase().includes(q);
      const matchText = (comm.messageText || "").toLowerCase().includes(q);
      const matchSubject = (comm.subject || "").toLowerCase().includes(q);
      const matchOutcome = (comm.outcome || "").toLowerCase().includes(q);
      return (
        matchParent ||
        matchMember ||
        matchPhone ||
        matchEmail ||
        matchText ||
        matchSubject ||
        matchOutcome
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner explaining individual targeted approach */}
      <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-white p-5 dark:border-blue-900/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <MessageSquareText size={15} />
              </span>
              <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Индивидуална комуникация с родители
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-[10px] font-bold">
                🛡️ Без масов спам
              </Badge>
            </div>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Тук изпращате персонални съобщения по имейл и записвате проведени
              телефонни разговори индивидуално за конкретен родител и дете.
              Съобщенията за такси, графици, лагери и документи достигат само до
              тези, за които се отнасят.
            </p>
          </div>

          {/* Quick Select Parent to start communication */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              aria-label="Изберете родител за контакт"
              value={selectedCommParentId}
              onChange={(e) => setSelectedCommParentId(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 min-w-50"
            >
              <option value="all">-- Всички регистрирани родители --</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  👤 {p.name} ({p.phone})
                </option>
              ))}
            </select>

            {selectedCommParentId !== "all" &&
              (() => {
                const selParent = parents.find(
                  (p) => p.id === selectedCommParentId
                );
                if (!selParent) return null;
                return (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setCallingParent(selParent)}
                      className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold cursor-pointer"
                    >
                      <PhoneCall size={13} className="mr-1" />
                      Обаждане
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEmailingParent(selParent)}
                      className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold cursor-pointer"
                    >
                      <Mail size={13} className="mr-1" />
                      Имейл
                    </Button>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Communication History Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <History size={15} className="text-zinc-500" />
            <span>Дневник на проведени разговори и изпратени съобщения</span>
          </h4>
          <Badge variant="outline" className="text-[11px] font-bold">
            {communications.length} записа
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-50">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <Input
              placeholder="Търси по име на родител, дете или бележка..."
              value={commSearchQuery}
              onChange={(e) => setCommSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-xl"
            />
          </div>

          <select
            aria-label="Филтър по канал"
            value={commChannelFilter}
            onChange={(e) =>
              setCommChannelFilter(e.target.value as "all" | "phone" | "email")
            }
            className="h-8 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          >
            <option value="all">Всички канали</option>
            <option value="phone">📞 Само телефонни разговори</option>
            <option value="email">✉️ Само изпратени имейли</option>
          </select>
        </div>
      </div>

      {/* Communications Log List */}
      {filteredComms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <MessageSquareText
            size={36}
            className="mx-auto text-zinc-300 dark:text-zinc-600"
          />
          <h4 className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Няма намерени записи в комуникационния дневник
          </h4>
          <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
            Когато запишете проведен разговор или изпратите лично съобщение до
            родител от бутоните по-горе или от списък „Родители“, записът ще се
            визуализира тук с точна дата и час.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComms.map((comm) => {
            const isPhone = comm.channel === "phone";
            return (
              <div
                key={comm.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isPhone ? (
                      <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Phone size={13} />
                      </span>
                    ) : (
                      <span className="flex size-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <Mail size={13} />
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                          {comm.parentName}
                        </h5>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            isPhone
                              ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                              : "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {isPhone
                            ? "📞 Телефонен разговор"
                            : "✉️ Изпратен имейл"}
                        </Badge>
                      </div>

                      <p className="text-xs text-zinc-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                        {comm.parentPhone && (
                          <span>{formatPhoneDisplay(comm.parentPhone)}</span>
                        )}
                        {comm.parentEmail && <span>• {comm.parentEmail}</span>}
                        {comm.memberName && (
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            • Състезател: {comm.memberName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-zinc-400">
                    <div>
                      {comm.createdAt
                        ? new Date(comm.createdAt).toLocaleDateString("bg-BG", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) + " ч."
                        : "—"}
                    </div>
                    {comm.createdBy && (
                      <div className="text-[10px] text-zinc-400 font-medium">
                        от: {comm.createdBy}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content / outcome */}
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-xs text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-300">
                  {comm.subject && (
                    <div className="font-bold text-zinc-900 dark:text-white mb-1">
                      Тема: {comm.subject}
                    </div>
                  )}
                  {comm.outcome && (
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Резултат: {comm.outcome}
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {comm.messageText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
