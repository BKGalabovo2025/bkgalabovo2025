"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/useSales";
import { mutate } from "swr";
import { Loader2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { MemberSalesHistoryTableRow } from "./MemberSalesHistoryTableRow";
import { MemberSalesHistoryMobileCard } from "./MemberSalesHistoryMobileCard";

function getSaleItemsList(sale: import("@/types").Sale) {
  return sale.items
    .map((item) => {
      const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : "";
      return `${item.name}${qtyStr}`;
    })
    .join(", ");
}

interface MemberSalesHistoryProps {
  memberId: string;
  memberIds?: string[];
  familyMembers?: import("@/types").Member[];
  memberName?: string;
}

const isSubscriptionItem = (name: string): boolean => {
  const lower = name.toLowerCase();
  return (
    lower.includes("месечна") ||
    lower.includes("такса") ||
    lower.includes("членски") ||
    lower.includes("абонамент") ||
    lower.includes("годишна")
  );
};

const formatPaymentMethod = (method?: string) => {
  if (!method) return "В брой";
  if (method === "Cash") return "В брой";
  return method;
};

const formatSaleDateCell = (sale: import("@/types").Sale) => {
  const start = new Date(sale.saleDate);
  const isTimeBasedService =
    sale.type === "general_service" ||
    sale.items?.[0]?.productId?.startsWith("court_rental") ||
    sale.items?.[0]?.productId?.startsWith("recovery_session");

  const formattedDate =
    start.toLocaleDateString("bg-BG").replace(" г.", "") + " г.";

  if (isTimeBasedService) {
    const hours = sale.items?.[0]?.quantity || 1;
    const end = new Date(start.getTime() + hours * 3600000);
    const timeRange =
      start.toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      " - " +
      end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });

    return (
      <>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formattedDate}
        </span>
        <div className="mt-0.5 text-[10px] text-zinc-400">
          {timeRange} ({hours} ч.)
        </div>
      </>
    );
  }

  return (
    <>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {formattedDate}
      </span>
      <div className="mt-0.5 text-[10px] text-zinc-400">
        {start.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </>
  );
};

const formatSaleDateMobile = (sale: import("@/types").Sale) => {
  const start = new Date(sale.saleDate);
  const isTimeBasedService =
    sale.type === "general_service" ||
    sale.items?.[0]?.productId?.startsWith("court_rental") ||
    sale.items?.[0]?.productId?.startsWith("recovery_session");

  const formattedDate =
    start.toLocaleDateString("bg-BG").replace(" г.", "") + " г.";

  if (isTimeBasedService) {
    const hours = sale.items?.[0]?.quantity || 1;
    const end = new Date(start.getTime() + hours * 3600000);
    const timeRange =
      start.toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      " - " +
      end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
    return `${formattedDate} ${timeRange} (${hours} ч.)`;
  }

  return `${formattedDate} в ${start.toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const getStatusDetails = (
  status: string,
  isPaid: boolean,
  totalAmount: number
) => {
  if (totalAmount === 0 && status === "informational") {
    return { text: "Системна", variant: "outline" as const };
  }

  if (isPaid === false || status === "pending") {
    return { text: "Неплатено", variant: "secondary" as const };
  }

  if (status === "completed") {
    if (totalAmount === 0) {
      return { text: "Нулева", variant: "outline" as const };
    }
    return { text: "Платено", variant: "default" as const };
  }

  return { text: status, variant: "secondary" as const };
};

export const MemberSalesHistory = ({
  memberId,
  memberIds,
  familyMembers,
  memberName,
}: MemberSalesHistoryProps) => {
  const router = useRouter();
  const { sales, loading, error, markAsPaid, markAsUnpaid, deleteSale } =
    useSales(memberIds || memberId);

  const handleMarkAsPaid = async (saleId: string) => {
    await markAsPaid(saleId);
    mutate(memberId);
  };

  const handleMarkAsUnpaid = async (saleId: string) => {
    await markAsUnpaid(saleId);
    mutate(memberId);
  };

  const handleDeleteSale = async (saleId: string) => {
    await deleteSale(saleId);
    mutate(memberId);
  };

  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>(
    {}
  );

  const salesByYear: Record<number, typeof sales> = {};
  sales.forEach((sale) => {
    const year = new Date(sale.saleDate).getFullYear();
    if (!salesByYear[year]) {
      salesByYear[year] = [];
    }
    salesByYear[year].push(sale);
  });

  const sortedYears = Object.keys(salesByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const toggleYear = (year: number) => {
    setCollapsedYears((prev) => {
      const currentlyCollapsed =
        prev[year] === undefined ? year !== sortedYears[0] : prev[year];
      return {
        ...prev,
        [year]: !currentlyCollapsed,
      };
    });
  };

  const handleRowClick = (saleId: string, isPaid: boolean, type?: string) => {
    if (isPaid) {
      if (type === "general_service") {
        router.push(`/finances/general-services/sales/${saleId}/receipt`);
      } else if (type === "inventory") {
        router.push(`/inventory/sales/${saleId}/receipt`);
      } else {
        router.push(`/sales/${saleId}/receipt`);
      }
    } else {
      router.push(`/sales/${saleId}`);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <Loader2
            className="size-8 animate-spin text-zinc-200"
            strokeWidth={1.5}
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-4xl border border-rose-100 bg-rose-50 p-10 text-center text-sm font-light text-rose-500">
          Грешка: {error}
        </div>
      );
    }

    if (sales.length === 0) {
      return (
        <div className="rounded-4xl border border-dashed border-zinc-100 bg-zinc-50/50 py-20 text-center">
          <p className="text-[11px] font-medium tracking-[0.2em] text-zinc-300 uppercase">
            Няма регистрирани продажби.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sortedYears.map((year) => {
          const yearSales = salesByYear[year];
          const isExpanded =
            collapsedYears[year] === undefined
              ? year === sortedYears[0]
              : !collapsedYears[year];
          const yearTotal = yearSales.reduce(
            (acc, sale) => acc + sale.totalAmount,
            0
          );

          return (
            <div
              key={year}
              className="overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50/20 transition-all"
            >
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="flex w-full items-center justify-between border-b border-zinc-100 bg-zinc-50/50 p-5 text-left transition-colors hover:bg-zinc-50 sm:p-6"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg font-light tracking-tight text-zinc-950 sm:text-xl">
                    {year} г.
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-zinc-200 px-2.5 py-0.5 text-[8px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[9px]"
                  >
                    {yearSales.length}{" "}
                    {yearSales.length === 1 ? "запис" : "записа"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs font-medium text-zinc-950 sm:text-sm">
                    Общо: {formatPrice(yearTotal)}
                  </span>
                  <MoreHorizontal
                    className={cn(
                      "size-4 text-zinc-400 transition-transform duration-300",
                      isExpanded && "rotate-90 text-zinc-950"
                    )}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-4 bg-white p-3 duration-200 animate-in slide-in-from-top-1 sm:p-6">
                  {/* Desktop Table View */}
                  <div className="hidden overflow-hidden rounded-2xl border border-zinc-100 md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50/50">
                          <TableHead className="h-10 pl-5 text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Дата
                          </TableHead>
                          <TableHead className="h-10 text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Услуга / Продукт
                          </TableHead>
                          <TableHead className="h-10 text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Клиент(и)
                          </TableHead>
                          <TableHead className="h-10 text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Плащане
                          </TableHead>
                          <TableHead className="h-10 text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Статус
                          </TableHead>
                          <TableHead className="h-10 text-right text-[9px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                            Обща сума
                          </TableHead>
                          <TableHead className="h-10 w-15">
                            <span className="sr-only">Действия</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearSales.map((sale) => {
                          const statusDetails = getStatusDetails(
                            sale.status,
                            sale.isPaid,
                            sale.totalAmount
                          );

                          const itemsList = getSaleItemsList(sale);

                          const isSubscription = isSubscriptionItem(itemsList);

                          return (
                            <MemberSalesHistoryTableRow
                              key={sale.id}
                              sale={sale}
                              memberId={memberId}
                              memberName={memberName}
                              familyMembers={familyMembers}
                              statusDetails={statusDetails}
                              itemsList={itemsList}
                              isSubscription={isSubscription}
                              formatSaleDateCell={formatSaleDateCell}
                              formatPaymentMethod={formatPaymentMethod}
                              handleRowClick={handleRowClick}
                              handleMarkAsPaid={handleMarkAsPaid}
                              handleMarkAsUnpaid={handleMarkAsUnpaid}
                              handleDeleteSale={handleDeleteSale}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="space-y-3 md:hidden">
                    {yearSales.map((sale) => {
                      const statusDetails = getStatusDetails(
                        sale.status,
                        sale.isPaid,
                        sale.totalAmount
                      );

                      const itemsList = getSaleItemsList(sale);

                      const isSubscription = isSubscriptionItem(itemsList);

                      return (
                        <MemberSalesHistoryMobileCard
                          key={sale.id}
                          sale={sale}
                          memberId={memberId}
                          memberName={memberName}
                          familyMembers={familyMembers}
                          statusDetails={statusDetails}
                          itemsList={itemsList}
                          isSubscription={isSubscription}
                          formatSaleDateMobile={formatSaleDateMobile}
                          formatPaymentMethod={formatPaymentMethod}
                          handleRowClick={handleRowClick}
                          handleMarkAsPaid={handleMarkAsPaid}
                          handleMarkAsUnpaid={handleMarkAsUnpaid}
                          handleDeleteSale={handleDeleteSale}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-4 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:mb-12 md:flex-row md:items-center">
        <div>
          <h2 className="mb-2 text-2xl font-light tracking-tighter text-zinc-950 sm:text-3xl">
            История на продажбите
          </h2>
          <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            Списък с всички регистрирани плащания и услуги.
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};
