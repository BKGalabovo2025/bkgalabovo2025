"use client";

/**
 * Shared WizardStep4 (Review and Receipt) component used by both RecoveryWizard and TrainingWizard.
 * They were 96% identical, only differing by terminology ("процедури" vs "тренировки").
 */

import { Sparkles, Loader2, Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { clubInfo } from "@/config/club";
import { useUnifiedSaleWizard } from "./UnifiedSaleWizardContext";

export const UnifiedWizardStep4 = () => {
  const {
    item,
    mode,
    step,
    isGuestSale,
    clientDisplayName,
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
  } = useUnifiedSaleWizard();

  let itemNamePlural = "услуги/тренировки";
  if (mode === "recovery") {
    itemNamePlural = "процедури";
  } else if (mode === "product") {
    itemNamePlural = "продукти";
  }
  // If in processing step
  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-20">
        <Loader2
          className="size-12 animate-spin text-emerald-500"
          strokeWidth={2}
        />
        <div className="space-y-2 text-center">
          <p className="text-lg font-light text-zinc-900 dark:text-zinc-100">
            Регистриране на продажбата...
          </p>
          <p className="text-xs font-light text-zinc-500">
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
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
          <Receipt className="size-4 text-emerald-500" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Касова бележка
          </h3>
        </div>

        <div className="relative mx-auto flex w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white p-6 font-sans tracking-wide text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
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
              </div>
              <div className="space-y-0.5 text-right text-[9px] text-zinc-500">
                <p className="font-bold text-zinc-700 uppercase dark:text-zinc-300">
                  {clubInfo.name}
                </p>
                <p className="uppercase">{clubInfo.address}</p>
                <p className="uppercase">{clubInfo.contact}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">
                  КЛИЕНТ
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {clientDisplayName}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">
                  УСЛУГА
                </p>
                <p className="mt-1 text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {item?.name}
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
              <table className="w-full border-collapse border border-zinc-200 text-[9px] dark:border-zinc-800">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-[8px] font-bold text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900">
                    <th className="border-r border-zinc-200 p-1.5 text-left dark:border-zinc-800">
                      Описание
                    </th>
                    <th className="p-1.5 text-right">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 font-medium dark:border-zinc-800">
                    <td className="border-r border-zinc-200 p-1.5 text-left font-bold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                      {item?.name}
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
                    <td className="border-r border-zinc-200 p-1.5 text-right text-[8px] font-bold text-zinc-400 uppercase dark:border-zinc-800">
                      Обща стойност:
                    </td>
                    <td className="p-1.5 text-right text-[10px] font-bold text-zinc-900 dark:text-white">
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {note && (
              <div className="mb-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-2 text-[9px] dark:border-zinc-700 dark:bg-zinc-900/30">
                <span className="mr-1 font-bold text-zinc-500 uppercase">
                  Забележка:
                </span>
                <span className="text-zinc-800 italic dark:text-zinc-200">
                  {note}
                </span>
              </div>
            )}

            <div className="mt-4 border-t border-zinc-100 pt-3 text-center text-[7px] text-zinc-400 dark:border-zinc-800">
              Документът е издаден съгласно чл. 7, ал. 1 от Закона за
              счетоводството.
            </div>

            <div className="mt-4 flex justify-between gap-12 text-zinc-500">
              <div className="flex-1">
                <div className="h-px w-full bg-zinc-300 dark:bg-zinc-800" />
                <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
                  Доставчик: {clubInfo.name}
                </p>
              </div>
              <div className="flex-1">
                <div className="h-px w-full bg-zinc-300 dark:bg-zinc-800" />
                <p className="mt-0.5 text-center text-[7px] font-bold uppercase">
                  Получател:{" "}
                  {isGuestSale
                    ? "Външен клиент"
                    : `${selectedMember?.firstName} ${selectedMember?.lastName}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={() => {
              if (completedSaleId) {
                window.open(`/sales/${completedSaleId}/receipt`, "_blank");
              }
            }}
            className="flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <Printer className="size-4" /> Отвори за печат (PDF)
          </Button>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
        <Sparkles className="size-4 text-emerald-500" strokeWidth={1.5} />
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Преглед и потвърждение
        </h3>
      </div>

      <div className="space-y-4 rounded-3xl border border-zinc-100/50 bg-zinc-50 p-6 dark:border-zinc-900 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-500">Клиент</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {clientDisplayName}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-500">Услуга</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {item?.name}
          </span>
        </div>
        {!isGuestSale && (
          <>
            <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
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
                <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
                  <span className="text-zinc-500">Период</span>
                  <span className="font-bold text-emerald-600">
                    {selectedMonthLabels.join(", ")}
                  </span>
                </div>
              )}
            {paymentMode === "individual" && selectedEventIds.length > 0 && (
              <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
                <span className="text-zinc-500 capitalize">
                  {itemNamePlural}
                </span>
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
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-500">Начин на плащане</span>
          <span className="font-bold text-zinc-900 dark:text-white">
            {paymentMethod}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
          <span className="text-zinc-500">Статус</span>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${isPaid ? "text-emerald-600" : "text-rose-600"}`}
          >
            {isPaid ? "Платено" : "Неплатено (Дълг)"}
          </span>
        </div>
        {note && (
          <div className="flex flex-col gap-1 border-b border-zinc-200/50 pb-3 text-xs dark:border-zinc-800/50">
            <span className="text-zinc-500">Забележка</span>
            <span className="font-medium text-zinc-900 italic dark:text-white">
              {note}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            Обща сума
          </span>
          <span className="text-2xl font-bold tracking-tight text-emerald-500">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
