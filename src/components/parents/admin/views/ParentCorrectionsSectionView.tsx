"use client";

import { ArrowRight, Check, Pencil, X } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useParentAdminContext } from "../ParentAdminContext";

export function ParentCorrectionsSectionView() {
  const { corrections, handleApproveCorrection, handleRejectCorrection } =
    useParentAdminContext();

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

  return (
    <div className="space-y-3">
      {corrections.map((corr) => {
        return (
          <div
            key={corr.id}
            className="flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div>
              <div className="flex items-center gap-2">
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

            {corr.status === "pending" ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : (
              <Badge
                variant={corr.status === "approved" ? "default" : "secondary"}
                className="text-xs"
              >
                {corr.status === "approved" ? "✓ Приета" : "✕ Отказана"}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
