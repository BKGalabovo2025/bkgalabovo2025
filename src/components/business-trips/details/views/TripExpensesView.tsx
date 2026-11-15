"use client";

import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { TripExpenseDialog } from "@/components/business-trips/TripExpenseDialog";
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
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import {
  calculateTripExpensesSummary,
  EUR_TO_BGN_RATE,
} from "@/lib/business-trip-calc";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { TripExpense } from "@/types/business-trip.types";

export function TripExpensesView() {
  const {
    trip,
    expenses,
    refreshData,
    activeDialog,
    activeExpenseId,
    openDialog,
    closeDialog,
  } = useTripDetails();
  useDeepLinkHighlight("expense", expenses.length > 0, "expenseId");

  const [pendingDeleteExpense, setPendingDeleteExpense] =
    useState<TripExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const summary = calculateTripExpensesSummary(trip, expenses);
  const hasFuelExpense = summary.hasFuelReceipts;

  const isExpenseDialogOpen =
    activeDialog === "add-expense" || activeDialog === "edit-expense";
  const editingExpense =
    activeDialog === "edit-expense" && activeExpenseId
      ? expenses.find((e) => e.id === activeExpenseId) || null
      : null;

  const handleOpenAdd = () => {
    openDialog("add-expense");
  };

  const handleOpenEdit = (exp: TripExpense) => {
    if (exp.id) {
      openDialog("edit-expense", { expenseId: exp.id });
    } else {
      openDialog("add-expense");
    }
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteExpense?.id;
    if (!id) return;
    setIsDeleting(id);
    try {
      await businessTripService.deleteExpense(id);
      toast.success("Разходът бе изтрит успешно.");
      setPendingDeleteExpense(null);
      await refreshData();
    } catch (e) {
      console.error(e);
      toast.error("Грешка при изтриване на разхода.");
    } finally {
      setIsDeleting(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "fuel":
        return "Гориво";
      case "toll":
        return "Винетка / Тол такса";
      case "accommodation":
        return "Нощувка";
      case "food":
        return "Храна";
      case "per_diem":
        return "Дневни пари";
      case "entry_fee":
        return "Такса участие";
      case "transport":
        return "Транспорт / Билети";
      default:
        return "Други";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Финансови разходи и фактури ({expenses.length})
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Обща сума: €{summary.invoicedPlusFuelEUR.toFixed(2)} (
            {summary.invoicedPlusFuelBGN.toFixed(2)} лв.)
            {hasFuelExpense &&
              ` • Гориво по пътен лист (${summary.calcFuelLiters} л.): €${summary.calcFuelEUR.toFixed(2)}`}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Plus className="mr-1.5 size-3.5" />
          Добави разход / фактура
        </Button>
      </div>

      <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <Table className="min-w-160 text-xs">
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead>Категория</TableHead>
                <TableHead>Описание / Основание</TableHead>
                <TableHead>Документ №</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Сума (EUR)</TableHead>
                <TableHead className="text-right">Сума (BGN)</TableHead>
                <TableHead className="w-28 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    <Receipt className="mx-auto mb-2 size-8 text-zinc-300 dark:text-zinc-700" />
                    Няма въведени финансови разходи за тази командировка.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => (
                  <TableRow
                    key={exp.id}
                    id={`expense-${exp.id}`}
                    className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
                  >
                    <TableCell className="font-semibold text-zinc-900 dark:text-white">
                      <Link
                        href={`/accounting/trips/${trip.id}/expenses?id=${exp.id}`}
                        title="Директен линк към този разход"
                        className="hover:underline"
                      >
                        {getCategoryLabel(exp.expenseType)}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                      {exp.notes || exp.supplierName || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {exp.documentNumber || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {exp.documentDate
                        ? formatDateShort(exp.documentDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-zinc-900 dark:text-white">
                      {exp.expenseType === "fuel"
                        ? `Цена/л: €${(exp.amountEUR || 0).toFixed(2)}`
                        : `€${(exp.amountEUR || 0).toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500 dark:text-zinc-400">
                      {exp.expenseType === "fuel"
                        ? `${((exp.amountEUR || 0) * EUR_TO_BGN_RATE).toFixed(2)} лв./л`
                        : `${((exp.amountEUR || 0) * EUR_TO_BGN_RATE).toFixed(2)} лв.`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          className="min-h-9 sm:min-h-8 text-xs"
                        >
                          Редакция
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Изтрий разход ${getCategoryLabel(exp.expenseType)}`}
                          title="Изтрий разход"
                          disabled={isDeleting === exp.id}
                          onClick={() => setPendingDeleteExpense(exp)}
                          className="min-h-9 min-w-9 sm:size-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        >
                          {isDeleting === exp.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </BentoCard>

      {trip.id && isExpenseDialogOpen && (
        <TripExpenseDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          tripId={trip.id}
          siteId={trip.siteId || "bkgalabovo"}
          trip={trip}
          expenseToEdit={editingExpense}
          onSuccess={() => {
            closeDialog();
            refreshData();
          }}
        />
      )}

      <AlertDialog
        open={Boolean(pendingDeleteExpense)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteExpense(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на разход</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете този разход (
              {pendingDeleteExpense
                ? getCategoryLabel(pendingDeleteExpense.expenseType)
                : ""}
              {pendingDeleteExpense?.documentNumber
                ? ` • Док. № ${pendingDeleteExpense.documentNumber}`
                : ""}
              )? Това действие е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={Boolean(isDeleting)}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
