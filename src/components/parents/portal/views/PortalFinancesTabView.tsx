"use client";

import { CreditCard, Receipt, ShoppingBag } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "../ParentPortalContext";

export function PortalFinancesTabView() {
  const {
    portal,
    financeFilter,
    setFinanceFilter,
    transactionsList,
    filteredTransactions,
    inventoryTransactionsCount,
    subscriptionTransactionsCount,
    serviceTransactionsCount,
    setActiveReceiptTx,
    logSessionAction,
  } = useParentPortalContext();

  const { feeStatus, selectedChild } = portal;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Section 1: Monthly Status & 6-month Breakdown ─────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-2xs",
                feeStatus?.currentMonthStatus === "paid"
                  ? "bg-emerald-600"
                  : feeStatus?.currentMonthStatus === "unpaid"
                    ? "bg-amber-500"
                    : "bg-blue-600"
              )}
            >
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white truncate">
                  Членски внос и такси за {selectedChild?.firstName}
                </h3>
                {feeStatus?.currentMonthStatus === "paid" ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    ✓ Редовен за {feeStatus.currentMonthLabel}
                  </Badge>
                ) : feeStatus?.currentMonthStatus === "unpaid" ? (
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                    ⏳ Очаква плащане за {feeStatus?.currentMonthLabel}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {feeStatus?.currentMonthLabel || "Текущ период"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Последно отчетено плащане:{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {feeStatus?.lastPaymentDate
                    ? new Date(feeStatus.lastPaymentDate).toLocaleDateString(
                        "bg-BG"
                      )
                    : "Няма въведена дата"}
                </strong>
                {feeStatus?.unpaidSalesCount &&
                feeStatus.unpaidSalesCount > 0 ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400 ml-2">
                    • Текущо дължимо: {formatPrice(feeStatus.unpaidSalesAmount)}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 ml-2">
                    • Всички задължения са покрити
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 6-month historical monthly cards */}
        {feeStatus?.monthlyBreakdown &&
          feeStatus.monthlyBreakdown.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Помесечен статус на тренировъчната дейност (последни 6 месеца):
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
                {feeStatus.monthlyBreakdown.map((m) => (
                  <div
                    key={m.monthKey}
                    className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center dark:border-zinc-800 dark:bg-zinc-950/50 shadow-2xs"
                  >
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {m.monthLabel}
                    </p>
                    <div className="mt-1 flex justify-center">
                      {m.status === "paid" ? (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Платен
                        </span>
                      ) : m.status === "unpaid" ? (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Дължим
                        </span>
                      ) : m.status === "partial" ? (
                        <span className="rounded-md bg-sky-100 px-1.5 py-0.2 text-[9px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                          Частично
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          Без тренировки
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {m.totalTrainings} тренировки
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* ── Section 2: Complete Financial Dossier & Receipts ──────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" />
              <span>
                Дневник на покупките, абонаментите и електронни бележки
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Всички платени такси, абонаменти и закупени спортни артикули от
              клубния магазин.
            </p>
          </div>

          <Badge
            variant="outline"
            className="text-xs font-bold self-start sm:self-auto"
          >
            {transactionsList.length} финансови записа
          </Badge>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={financeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFinanceFilter("all")}
            className="h-8 rounded-xl text-xs font-bold"
          >
            Всички ({transactionsList.length})
          </Button>
          <Button
            type="button"
            variant={financeFilter === "inventory" ? "default" : "outline"}
            size="sm"
            onClick={() => setFinanceFilter("inventory")}
            className="h-8 rounded-xl text-xs font-bold"
          >
            🛍️ Магазин / Екипировка ({inventoryTransactionsCount})
          </Button>
          <Button
            type="button"
            variant={financeFilter === "subscription" ? "default" : "outline"}
            size="sm"
            onClick={() => setFinanceFilter("subscription")}
            className="h-8 rounded-xl text-xs font-bold"
          >
            💳 Членски внос ({subscriptionTransactionsCount})
          </Button>
          <Button
            type="button"
            variant={financeFilter === "service" ? "default" : "outline"}
            size="sm"
            onClick={() => setFinanceFilter("service")}
            className="h-8 rounded-xl text-xs font-bold"
          >
            🏸 Тренировки и услуги ({serviceTransactionsCount})
          </Button>
        </div>

        {/* Transaction cards */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
            Няма регистрирани финансови операции в избраната категория.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 shadow-2xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold",
                        tx.type === "inventory"
                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : tx.type === "subscription"
                            ? "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      )}
                    >
                      {tx.typeLabel}
                    </Badge>
                    <span className="font-mono text-[10px] text-zinc-400">
                      № {tx.receiptNumber}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold",
                        tx.isPaid
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      )}
                    >
                      {tx.isPaid ? "✓ Платено" : "⏳ Очаква плащане"}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {tx.description}
                  </h4>

                  {tx.items && tx.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {tx.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                        >
                          {it.name}
                          {it.quantity > 1 ? ` (x${it.quantity})` : ""} •{" "}
                          {formatPrice(it.total)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span>
                      Дата:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {tx.issueDate ||
                          (tx.date
                            ? new Date(tx.date).toLocaleDateString("bg-BG")
                            : "")}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Метод:{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {tx.paymentMethod}
                      </strong>
                    </span>
                    {tx.note && (
                      <>
                        <span>•</span>
                        <span className="italic text-zinc-400">
                          &quot;{tx.note}&quot;
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-base font-black text-zinc-900 dark:text-white">
                    {formatPrice(tx.amount)}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logSessionAction(
                        `Преглед на бележка № ${tx.receiptNumber}`
                      );
                      setActiveReceiptTx(tx);
                    }}
                    className="h-8 gap-1.5 rounded-xl border-blue-200 bg-blue-50/70 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs cursor-pointer"
                  >
                    <Receipt size={13} className="text-blue-600" />
                    <span>Електронна бележка</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
