"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Link2,
  Mail,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

import { useParentAdminContext } from "../ParentAdminContext";

const ITEMS_PER_PAGE = 12;

type RequestFilter = "all" | "unmatched" | "second_parent";
type RequestSort = "newest" | "oldest" | "name_asc";

export function ParentRequestsSectionView() {
  const {
    pendingRequests,
    members,
    handleOpenApproveDialog,
    setRejectDialogReq,
    setRejectReason,
  } = useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<RequestFilter>("all");
  const [sortBy, setSortBy] = useState<RequestSort>("newest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = pendingRequests.filter((req) => {
      if (filterBy === "unmatched" && req.matchedMemberId) return false;
      if (filterBy === "second_parent" && !req.isSecondParent) return false;
      if (!q) return true;
      const parentMatch = (req.parentName || "").toLowerCase().includes(q);
      const childMatch = (req.childFullName || "").toLowerCase().includes(q);
      const phoneMatch = (req.parentPhone || "").toLowerCase().includes(q);
      const emailMatch = (req.parentEmail || "").toLowerCase().includes(q);
      return parentMatch || childMatch || phoneMatch || emailMatch;
    });

    list.sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.parentName || "").localeCompare(b.parentName || "", "bg");
      }
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [pendingRequests, searchQuery, filterBy, sortBy]);

  const visibleRequests = useMemo(
    () => filteredRequests.slice(0, visibleCount),
    [filteredRequests, visibleCount]
  );

  useDeepLinkHighlight("request", visibleRequests.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към заявката е копиран!");
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  if (pendingRequests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <CheckCircle2
          size={40}
          className="mx-auto text-emerald-500 opacity-60"
        />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
          Няма чакащи заявки
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Всички подадени заявки от родители са прегледани и обработени.
        </p>
      </div>
    );
  }

  const filterPills: { id: RequestFilter; label: string }[] = [
    { id: "all", label: "Всички" },
    { id: "unmatched", label: "Без автоматично съвпадение" },
    { id: "second_parent", label: "Втори родител" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 dark:text-zinc-400" />
          <Input
            id="parent-requests-search"
            name="parentRequestsSearch"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            placeholder="Търси по родител, състезател, телефон или имейл..."
            className="h-9 rounded-xl pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterPills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setFilterBy(pill.id);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  filterBy === pill.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Сортиране на заявки"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as RequestSort);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            className="h-8 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option
              value="newest"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Най-нови
            </option>
            <option
              value="oldest"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Най-стари
            </option>
            <option
              value="name_asc"
              className="dark:bg-zinc-900 dark:text-zinc-100"
            >
              Име А–Я
            </option>
          </select>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Показани: <strong>{filteredRequests.length}</strong> от{" "}
            {pendingRequests.length} заявки
          </span>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Няма открити заявки за избраните критерии.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visibleRequests.map((req) => {
              const matchedMember = members.find(
                (m) => m.id === req.matchedMemberId
              );

              const roleLabel =
                req.parentRole === "mother"
                  ? "Майка"
                  : req.parentRole === "father"
                    ? "Баща"
                    : "Настойник";

              return (
                <div
                  key={req.id}
                  id={`request-${req.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
                >
                  <div>
                    {/* Top badges */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                      >
                        Чака одобрение
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString(
                                "bg-BG",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(req.id)}
                          title="Копирай директен линк към тази заявка"
                          className="size-7 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {copiedId === req.id ? (
                            <Check
                              size={13}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                          ) : (
                            <Link2 size={13} />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Parent details */}
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <h4 className="text-base font-black text-zinc-900 dark:text-white">
                          {req.parentName}
                        </h4>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          ({roleLabel})
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <Phone
                            size={13}
                            className="text-zinc-500 dark:text-zinc-400"
                          />
                          <a
                            href={`tel:${req.parentPhone}`}
                            className="font-medium hover:underline"
                          >
                            {formatPhoneDisplay(req.parentPhone)}
                          </a>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail
                            size={13}
                            className="text-zinc-500 dark:text-zinc-400"
                          />
                          <a
                            href={`mailto:${req.parentEmail}`}
                            className="font-medium hover:underline"
                          >
                            {req.parentEmail}
                          </a>
                        </span>
                      </div>
                    </div>

                    {/* Child info requested */}
                    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Заявено дете:
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {req.childFullName}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Роден(а): {req.childBirthDate}
                        </span>
                      </div>

                      {/* Match Status */}
                      {matchedMember ? (
                        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50/80 px-2.5 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                            <span>
                              Открито съвпадение в картотеката:{" "}
                              {matchedMember.fullName}
                            </span>
                          </span>
                          <Link
                            href={`/members/${matchedMember.id}`}
                            className="text-[11px] font-bold underline hover:opacity-80"
                            target="_blank"
                          >
                            Картон ↗
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-50/80 px-2.5 py-1.5 text-xs text-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
                          <AlertTriangle
                            size={14}
                            className="text-orange-500 shrink-0"
                          />
                          <span>
                            Няма автоматично съвпадение. Моля, изберете член
                            ръчно преди одобрение.
                          </span>
                        </div>
                      )}

                      {req.isSecondParent && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          <Users size={12} />
                          <span>ℹ️ Втори родител за това дете</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                    <Button
                      size="sm"
                      onClick={() => handleOpenApproveDialog(req)}
                      className="flex-1 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
                    >
                      <Check size={15} className="mr-1.5" />
                      <span>Одобри достъп</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectDialogReq(req);
                        setRejectReason(
                          "Няма открито дете с посочените данни."
                        );
                      }}
                      className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <X size={15} className="mr-1.5" />
                      <span>Откажи</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filteredRequests.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                className="rounded-xl text-xs font-semibold"
              >
                Покажи още ({filteredRequests.length - visibleCount} остават)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
