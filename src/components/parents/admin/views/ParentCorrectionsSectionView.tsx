"use client";

import { ArrowRight, Check, Link2, Pencil, Search, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { cn } from "@/lib/utils";

import { useParentAdminContext } from "../ParentAdminContext";

type CorrectionStatusFilter = "all" | "pending" | "approved" | "rejected";

export function ParentCorrectionsSectionView() {
  const { corrections, handleApproveCorrection, handleRejectCorrection } =
    useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CorrectionStatusFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCorrections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return corrections.filter((corr) => {
      if (statusFilter !== "all" && corr.status !== statusFilter) return false;
      if (!q) return true;
      const memberMatch = (corr.memberName || "").toLowerCase().includes(q);
      const parentMatch = (corr.parentName || "").toLowerCase().includes(q);
      const fieldMatch = (corr.fieldLabel || "").toLowerCase().includes(q);
      const valMatch = (corr.proposedValue || "").toLowerCase().includes(q);
      const noteMatch = (corr.note || "").toLowerCase().includes(q);
      return memberMatch || parentMatch || fieldMatch || valMatch || noteMatch;
    });
  }, [corrections, searchQuery, statusFilter]);

  useDeepLinkHighlight("correction", filteredCorrections.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към корекцията е копиран!");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  if (corrections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <Pencil size={40} className="mx-auto text-zinc-400" />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
          Няма чакащи корекции на данни
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Когато родител посочи сгрешено поле през моливчето ✏️, заявката ще се
          появи тук за 1-клик одобрение.
        </p>
      </div>
    );
  }

  const filterPills: { id: CorrectionStatusFilter; label: string }[] = [
    { id: "all", label: `Всички (${corrections.length})` },
    {
      id: "pending",
      label: `Чакащи (${corrections.filter((c) => c.status === "pending").length})`,
    },
    {
      id: "approved",
      label: `Одобрени (${corrections.filter((c) => c.status === "approved").length})`,
    },
    {
      id: "rejected",
      label: `Отказани (${corrections.filter((c) => c.status === "rejected").length})`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
          <Input
            id="parent-corrections-search"
            name="parentCorrectionsSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Търси по състезател, родител или поле..."
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
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCorrections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Няма намерени заявки за корекция за избрания филтър.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCorrections.map((corr) => {
            return (
              <div
                key={corr.id}
                id={`correction-${corr.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-600 text-white font-bold text-[11px]">
                      Корекция: {corr.fieldLabel}
                    </Badge>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      за {corr.memberName}
                    </span>
                    <span className="text-xs text-zinc-400">
                      (от {corr.parentName})
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3 text-xs">
                    <div className="rounded-lg bg-zinc-100 px-2.5 py-1 text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400">
                      {corr.currentValue || "(празно)"}
                    </div>
                    <ArrowRight size={14} className="text-zinc-400" />
                    <div className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      {corr.proposedValue}
                    </div>
                  </div>

                  {corr.note && (
                    <p className="mt-1.5 text-xs text-zinc-500 italic">
                      Бележка: &quot;{corr.note}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyLink(corr.id)}
                    title="Копирай директен линк към тази корекция"
                    className="size-8 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {copiedId === corr.id ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Link2 size={14} />
                    )}
                  </Button>

                  {corr.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveCorrection(corr)}
                        className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
                      >
                        <Check size={14} className="mr-1" />
                        <span>Приеми и обнови картона</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectCorrection(corr)}
                        className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/20"
                      >
                        <X size={14} className="mr-1" />
                        <span>Откажи</span>
                      </Button>
                    </>
                  ) : (
                    <Badge
                      variant={
                        corr.status === "approved" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {corr.status === "approved" ? "✓ Приета" : "✕ Отказана"}
                    </Badge>
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
