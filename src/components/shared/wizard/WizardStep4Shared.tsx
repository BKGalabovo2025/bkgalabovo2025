"use client";

/**
 * Shared WizardStep4 (Review and Receipt) component used by both RecoveryWizard and TrainingWizard.
 * They were 96% identical, only differing by terminology ("процедури" vs "тренировки").
 */

import { Sparkles, Loader2, Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { clubInfo } from "@/config/club";
import { Member, ScheduleEvent } from "@/types";
import { Service } from "@/app/(protected)/finances/services/service.types";

interface WizardStep4SharedProps {
  step: number;
  isGuestSale: boolean;
  clientDisplayName: string;
  service: any; // was Service from services, but Context provides ClubService
  paymentMode: "subscription" | "individual";
  selectedMonthKeys: string[];
  selectedMonthLabels: string[];
  selectedEventIds: string[];
  paymentMethod: string;
  isPaid: boolean;
  note: string;
  totalAmount: number;
  completedSaleId: string | null;
  selectedMember: Member | null;
  memberEvents: ScheduleEvent[];
  /** Term used in UI, e.g., "процедури" or "тренировки" */
  itemNamePlural: string;
}

export const WizardStep4Shared = ({
  step,
  isGuestSale,
  clientDisplayName,
  service,
  paymentMode,
  selectedMonthKeys,
  selectedMonthLabels,
  selectedEventIds,
  paymentMethod,
  isPaid,
  note,
  totalAmount,
  completedSaleId,
  selectedMember,
  memberEvents,
  itemNamePlural,
}: WizardStep4SharedProps) => {
  // If in processing step
  if (step === 5) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-6">
        <Loader2
          className="h-12 w-12 animate-spin text-emerald-500"
          strokeWidth={2}
        />
        <div className="text-center space-y-2">
          <p className="font-light text-zinc-900 dark:text-zinc-100 text-lg">
            Регистриране на продажбата...
          </p>
          <p className="text-zinc-500 text-xs font-light">
            Моля, изчакайте, докато транзакцията се записва в базата данни.
          </p>
        </div>
      </div>
    );
  }

  // If in receipt step
  if (step === 6) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <Receipt className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Касова бележка
          </h3>
        </div>

        <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950 rounded-2xl relative text-zinc-950 dark:text-zinc-50 w-full max-w-lg mx-auto shadow-sm font-sans tracking-wide">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3 text-[10px]">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
                  РАЗПИСКА ЗА ПЛАЩАНЕ
                </h4>
                <p className="text-[9px] font-bold uppercase text-zinc-500">
                  №{" "}
                  {completedSaleId
                    ? completedSaleId.substring(0, 8).toUpperCase()
                    : "N/A"}{" "}
                  / {new Date().toLocaleDateString("bg-BG")} г.
                </p>
              </div>
              <div className="text-right text-[9px] space-y-0.5 text-zinc-500">
                <p className="font-bold uppercase text-zinc-700 dark:text-zinc-300">
                  {clubInfo.name}
                </p>
                <p className="uppercase">{clubInfo.address}</p>
                <p className="uppercase">{clubInfo.contact}</p>
              </div>
            </div>

            <div className="mb-3 text-[9px] flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                  Получател
                </p>
                <p className="font-bold uppercase text-zinc-800 dark:text-zinc-200">
                  {clientDisplayName}
                </p>
              </div>
              <div className="text-right text-zinc-600 dark:text-zinc-400">
                <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                  Детайли за плащане
                </p>
                <p className="font-bold">
                  Дата: {new Date().toLocaleDateString("bg-BG")} г.
                </p>
                <p className="mt-0.5">Начин: {paymentMethod}</p>
                <p className="mt-0.5 font-bold">
                  Статус:{" "}
                  <span
                    className={
                      isPaid
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {isPaid ? "ПЛАТЕНО" : "ОЧАКВА ПЛАЩАНЕ"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mb-3">
              <table className="w-full border-collapse border border-zinc-200 dark:border-zinc-800 text-[9px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[8px] font-bold uppercase text-zinc-500">
                    <th className="p-1.5 text-left border-r border-zinc-200 dark:border-zinc-800">
                      Описание
                    </th>
                    <th className="p-1.5 text-right">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 font-medium">
                    <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800 font-bold text-left text-zinc-800 dark:text-zinc-200">
                      {service.name}
                      {!isGuestSale &&
                        paymentMode === "subscription" &&
                        selectedMonthKeys.length > 0 &&
                        !selectedMonthKeys.includes("NO_EVENTS") && (
                          <span className="ml-1 font-normal text-zinc-500">
                            ({selectedMonthLabels.join(", ")})
                          </span>
                        )}
                      {!isGuestSale &&
                        paymentMode === "individual" &&
                        selectedEventIds.length > 0 && (
                          <span className="ml-1 font-normal text-zinc-500">
                            ({selectedEventIds.length} {itemNamePlural}
                            {(() => {
                              const dates = selectedEventIds
                                .map((id) => {
                                  const ev = memberEvents.find(
                                    (e) => e.id === id
                                  );
                                  return ev
                                    ? new Date(ev.startDate).toLocaleDateString(
                                        "bg-BG"
                                      )
                                    : "";
                                })
                                .filter(Boolean);
                              return dates.length > 0
                                ? ` на ${dates.join(", ")}`
                                : "";
                            })()}
                            )
                          </span>
                        )}
                    </td>
                    <td className="p-1.5 text-right font-bold text-zinc-800 dark:text-zinc-200">
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-right border-r border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[8px] text-zinc-400">
                      Обща стойност:
                    </td>
                    <td className="p-1.5 text-right font-bold text-[10px] text-zinc-900 dark:text-white">
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {note && (
              <div className="mb-3 p-2 border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] rounded-lg">
                <span className="font-bold text-zinc-500 uppercase mr-1">
                  Забележка:
                </span>
                <span className="italic text-zinc-800 dark:text-zinc-200">
                  {note}
                </span>
              </div>
            )}

            <div className="mt-4 text-[7px] text-zinc-400 text-center border-t border-zinc-100 dark:border-zinc-800 pt-3">
              Документът е издаден съгласно чл. 7, ал. 1 от Закона за
              счетоводството.
            </div>

            <div className="mt-4 flex justify-between gap-12 text-zinc-500">
              <div className="flex-1">
                <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                  Доставчик: {clubInfo.name}
                </p>
              </div>
              <div className="flex-1">
                <div className="h-px bg-zinc-300 dark:bg-zinc-800 w-full" />
                <p className="text-[7px] font-bold mt-0.5 uppercase text-center">
                  Получател:{" "}
                  {isGuestSale
                    ? "Външен клиент"
                    : `${selectedMember?.firstName} ${selectedMember?.lastName}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              if (completedSaleId) {
                window.open(`/sales/${completedSaleId}/receipt`, "_blank");
              }
            }}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-6 text-xs font-semibold flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Отвори за печат (PDF)
          </Button>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <Sparkles className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Преглед и потвърждение
        </h3>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl space-y-4 border border-zinc-100/50 dark:border-zinc-900">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <span className="text-zinc-500">Клиент</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {clientDisplayName}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <span className="text-zinc-500">Услуга</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {service.name}
          </span>
        </div>
        {!isGuestSale && (
          <>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-zinc-500">Тип плащане</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {paymentMode === "subscription"
                  ? "Месечен абонамент"
                  : `Еднократно (Индивидуални ${itemNamePlural})`}
              </span>
            </div>
            {paymentMode === "subscription" &&
              selectedMonthKeys.length > 0 &&
              !selectedMonthKeys.includes("NO_EVENTS") && (
                <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <span className="text-zinc-500">Период</span>
                  <span className="font-bold text-emerald-600">
                    {selectedMonthLabels.join(", ")}
                  </span>
                </div>
              )}
            {paymentMode === "individual" && selectedEventIds.length > 0 && (
              <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-zinc-500 capitalize">{itemNamePlural}</span>
                <span className="font-bold text-blue-600">
                  {selectedEventIds.length} {itemNamePlural}
                  {(() => {
                    const dates = selectedEventIds
                      .map((id) => {
                        const ev = memberEvents.find((e) => e.id === id);
                        return ev
                          ? new Date(ev.startDate).toLocaleDateString("bg-BG")
                          : "";
                      })
                      .filter(Boolean);
                    return dates.length > 0 ? ` (${dates.join(", ")})` : "";
                  })()}
                </span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <span className="text-zinc-500">Начин на плащане</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {paymentMethod}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <span className="text-zinc-500">Статус</span>
          <span
            className={`font-bold uppercase tracking-wider text-[10px] ${isPaid ? "text-emerald-600" : "text-rose-600"}`}
          >
            {isPaid ? "Платено" : "Неплатено (Дълг)"}
          </span>
        </div>
        {note && (
          <div className="flex flex-col gap-1 text-xs pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <span className="text-zinc-500">Забележка</span>
            <span className="font-medium text-zinc-900 dark:text-white italic">
              {note}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            Обща сума
          </span>
          <span className="text-2xl font-bold text-emerald-500 tracking-tight">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
