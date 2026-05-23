"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, PlusCircle, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

interface MemberSalesHistoryProps {
  memberId: string;
  memberIds?: string[];
  familyMembers?: import("@/types").Member[];
}

// Helper to determine if an item is a true subscription based on its name
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

// Helper to determine badge variant and text based on status and amount
const getStatusDetails = (
  status: "completed" | "pending" | "informational" | string,
  totalAmount: number
) => {
  if (totalAmount === 0 && status === "informational") {
    return { text: "Системна", variant: "outline" as const };
  }

  switch (status) {
    case "completed":
      return { text: "Платено", variant: "default" as const };
    case "pending":
      return { text: "Чакащо", variant: "secondary" as const };
    // Fallback for old data that might have status: 'completed' but amount: 0
    case "completed":
      if (totalAmount === 0)
        return { text: "Нулева", variant: "outline" as const };
      return { text: "Платено", variant: "default" as const };
    default:
      return { text: status, variant: "secondary" as const };
  }
};
export const MemberSalesHistory = ({
  memberId,
  memberIds,
  familyMembers,
}: MemberSalesHistoryProps) => {
  const router = useRouter();
  const { sales, loading, error, markAsPaid, markAsUnpaid } = useSales(
    memberIds || memberId
  );

  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>(
    {}
  );

  // Group sales by year
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

  const handleRowClick = (saleId: string, isPaid: boolean) => {
    if (isPaid) {
      router.push(`/sales/${saleId}/receipt`);
    } else {
      router.push(`/sales/${saleId}`);
    }
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
        <Button
          size="sm"
          onClick={() => router.push(`/sales/new?memberId=${memberId}`)}
          className="w-full sm:w-auto h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest shadow-none"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
          Нова продажба
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin text-zinc-200"
            strokeWidth={1.5}
          />
        </div>
      ) : error ? (
        <div className="p-10 text-center bg-rose-50 rounded-4xl border border-rose-100 text-rose-500 text-sm font-light">
          Грешка: {error}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">
            Няма регистрирани продажби.
          </p>
        </div>
      ) : (
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
                              sale.totalAmount
                            );

                            const itemsList = sale.items
                              .map(
                                (item) =>
                                  `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`
                              )
                              .join(", ");

                            return (
                              <TableRow
                                key={sale.id}
                                onClick={() =>
                                  handleRowClick(sale.id, sale.isPaid)
                                }
                                className="cursor-pointer border-zinc-50 hover:bg-zinc-50/50 transition-all group"
                              >
                                <TableCell className="py-4 font-light text-xs text-zinc-600 pl-5">
                                  {new Date(sale.saleDate).toLocaleDateString(
                                    "bg-BG"
                                  )}
                                </TableCell>
                                <TableCell className="py-4 max-w-[300px]">
                                  <div
                                    className="text-xs font-medium text-zinc-900 truncate"
                                    title={itemsList}
                                  >
                                    {itemsList}
                                  </div>
                                  {sale.subscriptionId && (
                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                                      {isSubscriptionItem(itemsList)
                                        ? "Абонамент"
                                        : "Услуга"}
                                    </div>
                                  )}
                                  {sale.memberId !== memberId &&
                                    familyMembers && (
                                      <div className="text-[9px] text-amber-600 font-medium mt-0.5">
                                        За:{" "}
                                        {familyMembers.find(
                                          (m) => m.id === sale.memberId
                                        )?.firstName || "Семейство"}{" "}
                                        {familyMembers.find(
                                          (m) => m.id === sale.memberId
                                        )?.lastName || ""}
                                      </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={statusDetails.variant}
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[8px] font-medium uppercase tracking-widest border-transparent",
                                      statusDetails.variant === "default"
                                        ? "bg-emerald-500 text-white"
                                        : statusDetails.variant === "secondary"
                                          ? "bg-amber-500 text-white"
                                          : "bg-zinc-100 text-zinc-400 border-zinc-100"
                                    )}
                                  >
                                    {statusDetails.text}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right py-4 font-medium text-xs text-zinc-950">
                                  {formatPrice(sale.totalAmount)}
                                </TableCell>
                                <TableCell
                                  className="text-right pr-5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          aria-haspopup="true"
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 rounded-lg text-zinc-400 hover:text-zinc-950"
                                        >
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                          <span className="sr-only">
                                            Toggle menu
                                          </span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="rounded-xl border-zinc-100 shadow-none"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <DropdownMenuItem
                                          onSelect={() =>
                                            handleRowClick(sale.id, sale.isPaid)
                                          }
                                          className="text-[10px] font-medium uppercase tracking-widest py-1.5"
                                        >
                                          Преглед на квитанция
                                        </DropdownMenuItem>
                                        {sale.isPaid ? (
                                          <DropdownMenuItem
                                            onSelect={() =>
                                              markAsUnpaid(sale.id)
                                            }
                                            className="text-[10px] font-medium uppercase tracking-widest py-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                          >
                                            Отмени плащането
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            onSelect={() => markAsPaid(sale.id)}
                                            className="text-[10px] font-medium uppercase tracking-widest py-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                          >
                                            Маркирай като платено
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
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
                          sale.totalAmount
                        );

                        const itemsList = sale.items
                          .map(
                            (item) =>
                              `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`
                          )
                          .join(", ");

                        return (
                          <div
                            key={sale.id}
                            onClick={() => handleRowClick(sale.id, sale.isPaid)}
                            className="bg-zinc-50/40 border border-zinc-100 rounded-xl p-4 active:scale-[0.98] transition-all"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="space-y-1">
                                <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest">
                                  {new Date(sale.saleDate).toLocaleDateString(
                                    "bg-BG"
                                  )}
                                </p>
                                <h3 className="text-xs font-medium text-zinc-950 line-clamp-2 leading-relaxed">
                                  {itemsList}
                                </h3>
                                {sale.memberId !== memberId &&
                                  familyMembers && (
                                    <div className="text-[9px] text-amber-600 font-medium">
                                      За:{" "}
                                      {familyMembers.find(
                                        (m) => m.id === sale.memberId
                                      )?.firstName || "Семейство"}{" "}
                                      {familyMembers.find(
                                        (m) => m.id === sale.memberId
                                      )?.lastName || ""}
                                    </div>
                                  )}
                              </div>
                              <Badge
                                variant={statusDetails.variant}
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[8px] font-medium uppercase tracking-widest border-transparent shrink-0",
                                  statusDetails.variant === "default"
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                                    : statusDetails.variant === "secondary"
                                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10"
                                      : "bg-zinc-100 text-zinc-400 border-zinc-100"
                                )}
                              >
                                {statusDetails.text}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-zinc-100/50">
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-white border border-zinc-100 flex items-center justify-center">
                                  <Receipt className="h-2.5 w-2.5 text-zinc-400" />
                                </div>
                                <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-medium">
                                  {sale.subscriptionId
                                    ? isSubscriptionItem(itemsList)
                                      ? "Абонамент"
                                      : "Услуга"
                                    : "Продажба"}
                                </span>
                              </div>
                              <span className="text-sm font-medium tracking-tight text-zinc-950">
                                {formatPrice(sale.totalAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
