"use client";

import { useProductSaleWizard } from "./ProductSaleWizardContext";
import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";

export const ProductSaleStep5 = () => {
  const {
    product,
    selectedMember,
    completedSaleId,
    paymentMethod,
    isPaid,
    note,
    quantity,
    totalAmount,
  } = useProductSaleWizard();

  if (!selectedMember) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <Receipt className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Касова бележка за продажба
        </h3>
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-col rounded-2xl border border-zinc-300 bg-white p-6 font-sans tracking-wide text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-start justify-between border-b border-zinc-200 pb-3 text-[10px] dark:border-zinc-800">
            <div className="space-y-1">
              <h4 className="text-xs font-bold tracking-tight text-zinc-900 uppercase dark:text-white">
                РАЗПИСКА ЗА ПЛАЩАНЕ
              </h4>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">
                №{" "}
                {completedSaleId
                  ? completedSaleId.substring(0, 8).toUpperCase()
                  : "N/A"}{" "}
                / {new Date().toLocaleDateString("bg-BG")} г.
              </p>
              <p className="text-[8px] font-bold text-zinc-400 uppercase">
                Преглед на екземпляр
              </p>
            </div>
            <div className="space-y-0.5 text-right text-[9px] text-zinc-500">
              <p className="font-bold text-zinc-700 uppercase dark:text-zinc-300">
                {clubInfo.name}
              </p>
              <p className="uppercase">{clubInfo.address}</p>
              <p className="uppercase">{clubInfo.contact}</p>
            </div>
          </div>

          <div className="mb-3 flex items-start justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 text-[9px] dark:border-zinc-800 dark:bg-zinc-900/50">
            <div>
              <p className="mb-0.5 text-[8px] font-bold tracking-widest text-zinc-400 uppercase">
                Получател
              </p>
              <p className="text-zinc-850 dark:text-zinc-150 font-bold uppercase">
                {selectedMember.firstName} {selectedMember.lastName}
              </p>
              <p className="mt-0.5 text-[8px] text-zinc-500">
                {selectedMember.id === "GUEST_EXTERNAL"
                  ? "Няма имейл (Външен клиент)"
                  : selectedMember.email || "Няма имейл"}
              </p>
            </div>

            <div className="text-zinc-650 dark:text-zinc-350 text-right">
              <p className="mb-0.5 text-[8px] font-bold tracking-widest text-zinc-400 uppercase">
                Детайли за плащане
              </p>
              <p className="font-bold">
                Дата на плащане: {new Date().toLocaleDateString("bg-BG")} г.
              </p>
              <p className="mt-0.5">Начин: {paymentMethod}</p>
              <p className="mt-0.5 font-bold">
                Статус:{" "}
                <span
                  className={
                    isPaid
                      ? "font-bold text-emerald-600 dark:text-emerald-400"
                      : "font-bold text-rose-600 dark:text-rose-400"
                  }
                >
                  {isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                </span>
              </p>
              {note && (
                <p className="mt-0.5 text-[8px] text-zinc-500 italic">
                  Бележка: {note}
                </p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <table className="w-full border-collapse border border-zinc-200 text-[9px] dark:border-zinc-800">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[8px] font-bold text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="border-r border-zinc-200 p-1.5 text-left dark:border-zinc-800">
                    Описание на услугата / продукта
                  </th>
                  <th className="border-r border-zinc-200 p-1.5 text-center dark:border-zinc-800">
                    К-во
                  </th>
                  <th className="border-r border-zinc-200 p-1.5 text-right dark:border-zinc-800">
                    Ед. цена
                  </th>
                  <th className="p-1.5 text-right">Общо</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-200 font-medium dark:border-zinc-800">
                  <td className="border-r border-zinc-200 p-1.5 text-left font-bold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                    {product.name}
                  </td>
                  <td className="border-r border-zinc-200 p-1.5 text-center text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {quantity}
                  </td>
                  <td className="border-r border-zinc-200 p-1.5 text-right text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {formatPrice(product.price)}
                  </td>
                  <td className="text-zinc-850 dark:text-zinc-150 p-1.5 text-right font-bold">
                    {formatPrice(totalAmount)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={3}
                    className="border-r border-zinc-200 p-1.5 text-right text-[8px] font-bold text-zinc-400 uppercase dark:border-zinc-800"
                  >
                    Обща стойност:
                  </td>
                  <td className="p-1.5 text-right text-[10px] font-bold text-zinc-900 dark:text-white">
                    {formatPrice(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-2 text-center">
            <p className="text-[7px] text-zinc-400 italic">
              Документът е издаден от автоматизираната административна система
              на Бадминтон клуб Гълъбово
            </p>
          </div>

          <div className="mt-2 flex justify-between gap-12 text-zinc-500">
            <div className="flex-1">
              <div className="h-px w-full bg-zinc-300 dark:bg-zinc-800" />
              <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
                Доставчик: {clubInfo.name}
              </p>
            </div>
            <div className="flex-1">
              <div className="h-px w-full bg-zinc-300 dark:bg-zinc-800" />
              <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
                Получател: {selectedMember.firstName} {selectedMember.lastName}
              </p>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-zinc-450 text-[6px] font-bold tracking-widest uppercase">
              ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button
          onClick={() =>
            completedSaleId &&
            window.open(`/sales/${completedSaleId}/receipt`, "_blank")
          }
          className="flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <Printer className="size-4" /> Отвори за печат (PDF)
        </Button>
      </div>
    </div>
  );
};
