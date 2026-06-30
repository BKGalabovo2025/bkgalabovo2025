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
  const isCourtRental =
    sale.items?.[0]?.productId?.startsWith("court_rental") ||
    sale.items?.[0]?.name?.toLowerCase()?.includes("наем на корт");

  const formattedDate = start.toLocaleDateString("bg-BG") + " г.";

  if (isCourtRental) {
    const hours = sale.items?.[0]?.quantity || 1;
    const end = new Date(start.getTime() + hours * 3600000);
    const timeRange =
      start.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }) +
      " - " +
      end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
    return (
      <>
        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {formattedDate}
        </span>
        <div className="text-[10px] text-zinc-500 font-semibold mt-0.5 whitespace-nowrap">
          {timeRange} ({hours} ч.)
        </div>
      </>
    );
  }

  return (
    <>
      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
        {formattedDate}
      </span>
      <div className="text-[10px] text-zinc-400 mt-0.5">
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
  const isCourtRental =
    sale.items?.[0]?.productId?.startsWith("court_rental") ||
    sale.items?.[0]?.name?.toLowerCase()?.includes("наем на корт");

  const formattedDate = start.toLocaleDateString("bg-BG") + " г.";

  if (isCourtRental) {
    const hours = sale.items?.[0]?.quantity || 1;
    const end = new Date(start.getTime() + hours * 3600000);
    const timeRange =
      start.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }) +
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
            className="h-8 w-8 animate-spin text-zinc-200"
            strokeWidth={1.5}
          />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-10 text-center bg-rose-50 rounded-4xl border border-rose-100 text-rose-500 text-sm font-light">
          Грешка: {error}
        </div>
      );
    }

    if (sales.length === 0) {
      return (
        <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">
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
                className="border border-zinc-100 rounded-3xl overflow-hidden bg-zinc-50/20 transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 bg-zinc-50/50 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-100"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-lg sm:text-xl font-light text-zinc-950 tracking-tight">
                      {year} г.
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5 text-[8px] sm:text-[9px] font-medium text-zinc-400 border-zinc-200 uppercase tracking-widest"
                    >
                      {yearSales.length}{" "}
                      {yearSales.length === 1 ? "запис" : "записа"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-xs sm:text-sm font-medium text-zinc-950">
                      Общо: {formatPrice(yearTotal)}
                    </span>
                    <MoreHorizontal
                      className={cn(
                        "h-4 w-4 text-zinc-400 transition-transform duration-300",
                        isExpanded && "rotate-90 text-zinc-950"
                      )}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 sm:p-6 bg-white animate-in slide-in-from-top-1 duration-200 space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-100">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-zinc-50/50 border-zinc-100 hover:bg-zinc-50/50">
                            <TableHead className="h-10 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400 pl-5">
                              Дата
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                              Услуга / Продукт
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                              Плащане
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                              Статус
                            </TableHead>
                            <TableHead className="h-10 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400 text-right">
                              Обща сума
                            </TableHead>
                            <TableHead className="h-10 w-[60px]">
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
                    <div className="md:hidden space-y-3">
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
      <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tighter text-zinc-950 mb-2">
              История на продажбите
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
              Списък с всички регистрирани плащания и услуги.
            </p>
          </div>
        </div>

        {renderContent()}
      </div>
    );
};
