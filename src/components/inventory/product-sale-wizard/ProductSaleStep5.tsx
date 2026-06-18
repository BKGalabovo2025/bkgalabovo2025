"use client";

import { useProductSaleWizard } from "./ProductSaleWizardContext";
import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clubInfo } from "@/config/club";
import { formatPrice } from "@/lib/currency";

export const ProductSaleStep5 = () => {
  const { product, selectedMember, completedSaleId, paymentMethod, isPaid, note, quantity, totalAmount } = useProductSaleWizard();

  if (!selectedMember) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <Receipt className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Касова бележка за продажба</h3>
      </div>

      <div
        className="flex flex-col border border-zinc-300 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 rounded-2xl relative text-zinc-950 dark:text-zinc-50 w-full max-w-lg mx-auto shadow-sm"
        style={{ fontFamily: "Arial, Helvetica, sans-serif", wordSpacing: "1px" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 text-[10px]">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-tight text-zinc-900 dark:text-white">РАЗПИСКА ЗА ПЛАЩАНЕ</h4>
              <p className="text-[9px] font-bold uppercase text-zinc-500">
                № {completedSaleId ? completedSaleId.substring(0, 8).toUpperCase() : "N/A"} / {new Date().toLocaleDateString("bg-BG")} г.
              </p>
              <p className="text-[8px] font-bold uppercase text-zinc-400">Преглед на екземпляр</p>
            </div>
            <div className="text-right text-[9px] space-y-0.5 text-zinc-500">
              <p className="font-bold uppercase text-zinc-700 dark:text-zinc-300">{clubInfo.name}</p>
              <p className="uppercase">{clubInfo.address}</p>
              <p className="uppercase">{clubInfo.contact}</p>
            </div>
          </div>

          <div className="mb-3 text-[9px] flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-lg">
            <div>
              <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Получател</p>
              <p className="font-bold uppercase text-zinc-850 dark:text-zinc-150">
                {selectedMember.firstName} {selectedMember.lastName}
              </p>
              <p className="text-zinc-500 text-[8px] mt-0.5">
                {selectedMember.id === "GUEST_EXTERNAL" ? "Няма имейл (Външен клиент)" : selectedMember.email || "Няма имейл"}
              </p>
            </div>

            <div className="text-right text-zinc-650 dark:text-zinc-350">
              <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Детайли за плащане</p>
              <p className="font-bold">Дата на плащане: {new Date().toLocaleDateString("bg-BG")} г.</p>
              <p className="mt-0.5">Начин: {paymentMethod}</p>
              <p className="mt-0.5 font-bold">
                Статус: <span className={isPaid ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold"}>
                  {isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                </span>
              </p>
              {note && <p className="text-[8px] text-zinc-500 italic mt-0.5">Бележка: {note}</p>}
            </div>
          </div>

          <div className="mb-3">
            <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-800 text-[9px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[8px] font-bold uppercase text-zinc-500">
                  <th className="p-1.5 text-left border-r border-zinc-200 dark:border-zinc-800">Описание на услугата / продукта</th>
                  <th className="p-1.5 text-center border-r border-zinc-200 dark:border-zinc-800">К-во</th>
                  <th className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800">Ед. цена</th>
                  <th className="p-1.5 text-right">Общо</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 font-medium">
                  <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800 font-bold text-left text-zinc-800 dark:text-zinc-200">{product.name}</td>
                  <td className="p-1.5 text-center border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{quantity}</td>
                  <td className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{formatPrice(product.price)}</td>
                  <td className="p-1.5 text-right font-bold text-zinc-850 dark:text-zinc-150">{formatPrice(totalAmount)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[8px] text-zinc-400">Обща стойност:</td>
                  <td className="p-1.5 text-right font-bold text-[10px] text-zinc-900 dark:text-white">{formatPrice(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mb-2">
            <p className="text-[7px] text-zinc-400 italic">Документът е издаден от автоматизираната административна система на Бадминтон клуб Гълъбово</p>
          </div>

          <div className="mt-2 flex justify-between gap-12 text-zinc-500">
            <div className="flex-1">
              <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
              <p className="text-[7px] font-bold mt-0.5 uppercase text-center">Доставчик: {clubInfo.name}</p>
            </div>
            <div className="flex-1">
              <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
              <p className="text-[7px] font-bold mt-0.5 uppercase text-center">Получател: {selectedMember.firstName} {selectedMember.lastName}</p>
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-[6px] text-zinc-450 font-bold uppercase tracking-widest">ДИГИТАЛНО ГЕНЕРИРАН ДОКУМЕНТ • ВАЛИДЕН БЕЗ МОКЪР ПОДПИС И ПЕЧАТ</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => completedSaleId && window.open(`/sales/${completedSaleId}/receipt`, "_blank")}
          className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 text-xs font-semibold flex items-center gap-2"
        >
          <Printer className="h-4 w-4" /> Отвори за печат (PDF)
        </Button>
      </div>
    </div>
  );
};
