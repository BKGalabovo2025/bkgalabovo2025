"use client";

import { Check, Clock, Eye, Link2, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";

import { useParentAdminContext } from "../ParentAdminContext";

export function ParentActivitySectionView() {
  const {
    onlineParentsCount,
    onlineParents,
    parents,
    isParentOnline,
    members,
  } = useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredParents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(q);
      const phoneMatch = (p.phone || "").toLowerCase().includes(q);
      const emailMatch = (p.email || "").toLowerCase().includes(q);
      const actionMatch = (p.lastAction || "").toLowerCase().includes(q);
      const matchedMembers = members.filter((m) =>
        p.linkedMemberIds?.includes(m.id)
      );
      const childMatch = matchedMembers.some((m) =>
        (m.fullName || "").toLowerCase().includes(q)
      );
      return nameMatch || phoneMatch || emailMatch || actionMatch || childMatch;
    });
  }, [parents, members, searchQuery]);

  useDeepLinkHighlight("activity", filteredParents.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към записа е копиран!");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  return (
    <div className="space-y-6">
      {/* Top Live Banner */}
      <div className="rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 p-5 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <Eye size={22} className="relative z-10" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-zinc-900 dark:text-white">
                Родители на живо &amp; История на прегледите
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Виждате в реално време кои родители са в портала и какви данни
                от досието на детето си са преглеждали.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white font-extrabold px-3 py-1 text-xs shadow-xs">
              🟢 {onlineParentsCount} на линия в момента
            </Badge>
          </div>
        </div>
      </div>

      {/* Online Parents Cards */}
      {onlineParents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            Родители в портала точно сега ({onlineParents.length})
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onlineParents.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-emerald-300/80 bg-white p-4 shadow-sm dark:border-emerald-800/80 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                        {p.name}
                      </h5>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {p.phone} • {p.email}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    На линия
                  </Badge>
                </div>

                <div className="mt-3 rounded-xl bg-emerald-50/70 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                  <span className="font-semibold">Последно действие:</span>{" "}
                  <span>{p.lastAction || "Преглежда родителското табло"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parents Presence & Last Login Overview */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Статус на профилите &amp; Последен вход</span>
              <Badge variant="outline" className="text-xs">
                {filteredParents.length} / {parents.length} родители
              </Badge>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Следене на живо кой родител е на линия в момента и кога е бил
              последният му успешен вход в системата.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <Input
              id="parent-activity-search"
              name="parentActivitySearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търси по родител, дете или телефон..."
              className="h-8 rounded-xl pl-8 text-xs"
            />
          </div>
        </div>

        {filteredParents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
            <Clock size={36} className="mx-auto text-zinc-400 opacity-60" />
            <h5 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
              Няма намерени родители
            </h5>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              След одобряване на родителски заявки или ръчно добавяне, тук ще
              виждате техния онлайн статус и последно влизане.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredParents
              .slice()
              .sort((a, b) => {
                const aOnline = isParentOnline(a) ? 1 : 0;
                const bOnline = isParentOnline(b) ? 1 : 0;
                if (aOnline !== bOnline) return bOnline - aOnline;
                return (b.lastLoginAt || "").localeCompare(a.lastLoginAt || "");
              })
              .map((p) => {
                const online = isParentOnline(p);
                const roleLabel =
                  p.parentRole === "mother"
                    ? "Майка"
                    : p.parentRole === "father"
                      ? "Баща"
                      : "Настойник";

                const matchedMembers = members.filter((m) =>
                  p.linkedMemberIds?.includes(m.id)
                );

                return (
                  <div
                    key={p.id}
                    id={`activity-${p.id}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 text-xs transition-all ${
                      online
                        ? "border-emerald-300 bg-emerald-50/40 shadow-xs dark:border-emerald-800/80 dark:bg-emerald-950/20"
                        : "border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl font-black text-sm shadow-xs ${
                          online
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-zinc-900 dark:text-white text-sm">
                            {p.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                          >
                            {roleLabel}
                          </Badge>
                          {online ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                              🟢 На линия
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Офлайн
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          <span>{p.phone}</span>
                          <span>•</span>
                          <span>{p.email}</span>
                          {matchedMembers.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                Дете:{" "}
                                {matchedMembers
                                  .map((m) => m.fullName)
                                  .join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col sm:items-end gap-1 text-[11px]">
                        {online ? (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>
                              Последно: {p.lastAction || "Активен в портала"}
                            </span>
                          </div>
                        ) : p.lastLoginAt ? (
                          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                            <Clock size={13} className="text-zinc-400" />
                            <span>
                              Последен вход:{" "}
                              <strong>
                                {new Date(p.lastLoginAt).toLocaleDateString(
                                  "bg-BG",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}{" "}
                                ч.
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">
                            Все още не е влизал
                          </span>
                        )}

                        {p.lastAction && !online && (
                          <span className="text-[10px] text-zinc-400">
                            Действие: {p.lastAction}
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(p.id)}
                        title="Копирай директен линк към активността на родителя"
                        className="size-8 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        {copiedId === p.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Link2 size={14} />
                        )}
                      </Button>
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
