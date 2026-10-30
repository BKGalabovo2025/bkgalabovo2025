"use client";

import { Printer, Receipt } from "lucide-react";
import React, { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";
import { ParentFinancialTransactionItem } from "@/types/parent-portal.types";

interface ParentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ParentFinancialTransactionItem | null;
  childName: string;
}

export function ParentReceiptDialog({
  isOpen,
  onClose,
  transaction,
  childName,
}: ParentReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedPaymentDate = transaction.date
    ? new Date(transaction.date).toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : transaction.issueDate || "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {/* Print Stylesheet injection */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            .parent-printable-receipt,
            .parent-printable-receipt * {
              visibility: visible !important;
            }
            .parent-printable-receipt {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Dialog Action Header */}
        <div className="no-print flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Receipt size={18} />
            </div>
            <div>
              <DialogTitle className="text-sm font-black uppercase text-zinc-900 dark:text-white">
                Електронна бележка / Разписка
              </DialogTitle>
              <p className="text-[11px] text-zinc-500">
                Официален клубен документ за плащане • №{" "}
                {transaction.receiptNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs"
            >
              <Printer size={13} className="mr-1.5" />
              <span>Принтирай / PDF</span>
            </Button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div className="p-6">
          <div
            ref={receiptRef}
            className="parent-printable-receipt rounded-2xl border border-zinc-200 bg-white p-6 font-sans text-zinc-950 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {/* Header: Document Title & Club Info */}
            <div className="mb-4 flex items-start justify-between border-b border-zinc-200 pb-4 text-[10px] dark:border-zinc-800">
              <div className="space-y-1">
                <h2 className="text-sm font-black tracking-tight text-zinc-900 uppercase dark:text-white">
                  РАЗПИСКА ЗА ПЛАЩАНЕ
                </h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">
                  № {transaction.receiptNumber} / {transaction.issueDate}
                </p>
                <div className="pt-0.5">
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-[9px] font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                  >
                    {transaction.typeLabel}
                  </Badge>
                </div>
              </div>

              <div className="space-y-0.5 text-right text-[10px] text-zinc-500 dark:text-zinc-400">
                <p className="font-black text-zinc-800 uppercase dark:text-zinc-200">
                  {clubInfo.name}
                </p>
                <p className="uppercase">{clubInfo.address}</p>
                <p className="uppercase">{clubInfo.contact}</p>
                <p className="uppercase">{clubInfo.email}</p>
              </div>
            </div>

            {/* Meta Info Block */}
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-[10px] dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <div>
                <span className="block font-bold tracking-wider text-zinc-400 uppercase text-[9px]">
                  Получател на услугата / стоката
                </span>
                <span className="mt-0.5 block text-xs font-bold text-zinc-900 uppercase dark:text-white">
                  {childName}
                </span>
              </div>

              <div className="text-center">
                <span className="block font-bold tracking-wider text-zinc-400 uppercase text-[9px]">
                  Статус на плащане
                </span>
                <span
                  className={`mt-0.5 block text-xs font-black uppercase ${
                    transaction.isPaid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {transaction.isPaid ? "✓ Платено" : "⏳ Очаква плащане"}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {formattedPaymentDate}
                </span>
              </div>

              <div className="text-right">
                <span className="block font-bold tracking-wider text-zinc-400 uppercase text-[9px]">
                  Начин на плащане
                </span>
                <span className="mt-0.5 block text-xs font-bold text-zinc-800 uppercase dark:text-zinc-200">
                  {transaction.paymentMethod || "В брой"}
                </span>
              </div>
            </div>

            {/* Note / Target months if available */}
            {transaction.note && (
              <div className="mb-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-2.5 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                <span className="font-bold text-zinc-500 uppercase mr-1 text-[9px]">
                  Бележка:
                </span>
                <span>{transaction.note}</span>
              </div>
            )}

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-zinc-200 text-xs dark:border-zinc-800">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="border-r border-zinc-200 p-2 text-left dark:border-zinc-800">
                      Описание на артикула / таксата
                    </th>
                    <th className="border-r border-zinc-200 p-2 text-center w-16 dark:border-zinc-800">
                      К-во
                    </th>
                    <th className="border-r border-zinc-200 p-2 text-right w-24 dark:border-zinc-800">
                      Ед. цена
                    </th>
                    <th className="p-2 text-right w-28">Общо</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-zinc-200 font-medium dark:border-zinc-800"
                      >
                        <td className="border-r border-zinc-200 p-2 text-left font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                          {item.name}
                        </td>
                        <td className="border-r border-zinc-200 p-2 text-center text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                          {item.quantity}
                        </td>
                        <td className="border-r border-zinc-200 p-2 text-right text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                          {formatPrice(item.price)}
                        </td>
                        <td className="p-2 text-right font-bold text-zinc-900 dark:text-white">
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-zinc-200 font-medium dark:border-zinc-800">
                      <td className="border-r border-zinc-200 p-2 text-left font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                        {transaction.description}
                      </td>
                      <td className="border-r border-zinc-200 p-2 text-center text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                        1
                      </td>
                      <td className="border-r border-zinc-200 p-2 text-right text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                        {formatPrice(transaction.amount)}
                      </td>
                      <td className="p-2 text-right font-bold text-zinc-900 dark:text-white">
                        {formatPrice(transaction.amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-zinc-50/70 font-bold dark:bg-zinc-950/40">
                    <td
                      colSpan={3}
                      className="border-r border-zinc-200 p-2.5 text-right text-[10px] font-bold text-zinc-500 uppercase dark:border-zinc-800"
                    >
                      Обща сума:
                    </td>
                    <td className="p-2.5 text-right text-sm font-black text-zinc-900 dark:text-white">
                      {formatPrice(transaction.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="mt-8 flex justify-between gap-8 text-zinc-500 text-[10px]">
              <div className="flex-1">
                <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
                <p className="mt-1 text-center font-bold uppercase">
                  Доставчик: {clubInfo.name}
                </p>
              </div>
              <div className="flex-1">
                <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
                <p className="mt-1 text-center font-bold uppercase">
                  Получател: {childName}
                </p>
              </div>
            </div>

            {/* Legal Footnote */}
            <div className="mt-6 text-center">
              <p className="text-[8px] font-bold tracking-widest text-zinc-400 uppercase">
                ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
              </p>
            </div>
          </div>
        </div>

        {/* Footer in screen dialog */}
        <DialogFooter className="no-print border-t border-zinc-100 bg-zinc-50/80 px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 flex items-center justify-between sm:justify-between">
          <p className="text-[11px] text-zinc-400">
            Бележката е достъпна в родителския Ви профил по всяко време.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl"
          >
            Затвори
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
