"use client";

import {
  ArrowRight,
  Check,
  Link2,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { cn } from "@/lib/utils";
import type { DataCorrectionRequest } from "@/types/parent-portal.types";

import { useParentAdminContext } from "../ParentAdminContext";

const ITEMS_PER_PAGE = 12;

type CorrectionStatusFilter = "all" | "pending" | "approved" | "rejected";
type CorrectionSortBy = "newest" | "oldest" | "name_asc";

export function ParentCorrectionsSectionView() {
  const {
    corrections,
    handleApproveCorrection,
    handleRejectCorrection,
    setRejectCorrectionComment,
  } = useParentAdminContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CorrectionStatusFilter>("all");
  const [sortBy, setSortBy] = useState<CorrectionSortBy>("newest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    corr: DataCorrectionRequest;
  } | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const filteredCorrections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = corrections.filter((corr) => {
      if (statusFilter !== "all" && corr.status !== statusFilter) return false;
      if (!q) return true;
      const memberMatch = (corr.memberName || "").toLowerCase().includes(q);
      const parentMatch = (corr.parentName || "").toLowerCase().includes(q);
      const fieldMatch = (corr.fieldLabel || "").toLowerCase().includes(q);
      const valMatch = (corr.proposedValue || "").toLowerCase().includes(q);
      const noteMatch = (corr.note || "").toLowerCase().includes(q);
      return memberMatch || parentMatch || fieldMatch || valMatch || noteMatch;
    });

    list.sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.memberName || "").localeCompare(b.memberName || "", "bg");
      }
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [corrections, searchQuery, statusFilter, sortBy]);

  const visibleCorrections = useMemo(
    () => filteredCorrections.slice(0, visibleCount),
    [filteredCorrections, visibleCount]
  );

  useDeepLinkHighlight("correction", visibleCorrections.length > 0);

  const handleCopyLink = (id: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към корекцията е копиран!");
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || isSubmittingId) return;
    const { type, corr } = confirmAction;
    setIsSubmittingId(corr.id);
    try {
      if (type === "approve") {
        await handleApproveCorrection(corr);
      } else {
        setRejectCorrectionComment?.(rejectComment.trim());
        await handleRejectCorrection(corr);
      }
      setConfirmAction(null);
      setRejectComment("");
    } finally {
      setIsSubmittingId(null);
    }
  };

  if (corrections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <Pencil
          size={40}
          className="mx-auto text-zinc-500 dark:text-zinc-400"
        />
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 dark:text-zinc-400" />
          <Input
            id="parent-corrections-search"
            name="parentCorrectionsSearch"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            placeholder="Търси по състезател, родител или поле..."
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
                  setStatusFilter(pill.id);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
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

          <select
            aria-label="Сортиране на корекции"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as CorrectionSortBy);
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
        </div>
      </div>

      {filteredCorrections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Няма намерени заявки за корекция за избрания филтър.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {visibleCorrections.map((corr) => {
              const isSubmittingThis = isSubmittingId === corr.id;
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
                        за{" "}
                        <Link
                          href={`/members/${corr.memberId}`}
                          className="underline decoration-zinc-300 underline-offset-2 hover:text-indigo-600 dark:decoration-zinc-700 dark:hover:text-indigo-400"
                        >
                          {corr.memberName}
                        </Link>
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        (от {corr.parentName})
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 text-xs">
                      <div className="rounded-lg bg-zinc-100 px-2.5 py-1 text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400">
                        {corr.currentValue || "(празно)"}
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      <div className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        {corr.proposedValue}
                      </div>
                    </div>

                    {corr.note && (
                      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 italic">
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
                      className="size-8 rounded-xl text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      {copiedId === corr.id ? (
                        <Check
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      ) : (
                        <Link2 size={14} />
                      )}
                    </Button>

                    {corr.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={isSubmittingThis}
                          onClick={() =>
                            setConfirmAction({ type: "approve", corr })
                          }
                          className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
                        >
                          {isSubmittingThis ? (
                            <Loader2 size={14} className="mr-1 animate-spin" />
                          ) : (
                            <Check size={14} className="mr-1" />
                          )}
                          <span>Приеми и обнови картона</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSubmittingThis}
                          onClick={() => {
                            setRejectComment("");
                            setConfirmAction({ type: "reject", corr });
                          }}
                          className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-950/20"
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

          {visibleCount < filteredCorrections.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                className="rounded-xl text-xs font-semibold"
              >
                Покажи още ({filteredCorrections.length - visibleCount} остават)
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open && !isSubmittingId) {
            setConfirmAction(null);
            setRejectComment("");
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "approve"
                ? "Потвърждение на корекция"
                : "Отказ на корекция"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "approve"
                ? `Сигурни ли сте, че искате да приемете корекцията за „${confirmAction.corr.fieldLabel}“ на ${confirmAction.corr.memberName} (${confirmAction.corr.proposedValue})?`
                : `Сигурни ли сте, че искате да откажете предложената корекция за „${confirmAction?.corr.fieldLabel}“ на ${confirmAction?.corr.memberName}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction?.type === "reject" && (
            <div className="space-y-1.5 py-1">
              <Label
                htmlFor="correction-reject-comment"
                className="text-xs font-semibold"
              >
                Коментар към родителя (по избор):
              </Label>
              <Input
                id="correction-reject-comment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Причина за отказа..."
                className="rounded-xl text-xs"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={Boolean(isSubmittingId)}
              className="rounded-xl"
            >
              Назад
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(isSubmittingId)}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmAction();
              }}
              className={cn(
                "rounded-xl text-white",
                confirmAction?.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
              )}
            >
              {isSubmittingId ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : null}
              {confirmAction?.type === "approve"
                ? "Потвърди и обнови"
                : "Потвърди отказ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
