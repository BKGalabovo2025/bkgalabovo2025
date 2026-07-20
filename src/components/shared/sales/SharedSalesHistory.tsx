"use client";

import { useState } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Sale } from "@/types";
import { formatPrice } from "@/lib/currency";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Receipt,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export interface SharedSalesHistoryProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  sales: Sale[];
  isLoading: boolean;
  membersMap: Record<string, string>;
  baseRoute: string; // e.g. "/inventory/sales"
  onDelete: (saleId: string) => Promise<void>;
  showPaymentMethod?: boolean;
}

export function SharedSalesHistory({
  title,
  description,
  icon,
  sales,
  isLoading,
  membersMap,
  baseRoute,
  onDelete,
  showPaymentMethod = false,
}: SharedSalesHistoryProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const getClientName = (sale: any) => {
    if (sale.clientName) return sale.clientName;
    if (sale.memberId === "GUEST_EXTERNAL") return "Гост";
    return membersMap[sale.memberId] || "Гост";
  };

  const handleDelete = async (saleId: string) => {
    setIsDeleting(saleId);
    try {
      await onDelete(saleId);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-none overflow-hidden">
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900">
        <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-light">{description}</p>
      </div>

      {/* Desktop View */}
      <div className="flex-1 overflow-auto custom-scrollbar hidden md:block">
        {sales.length > 0 ? (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Дата
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Клиент
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Артикули / Услуги
                </TableHead>
                {showPaymentMethod && (
                  <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                    Плащане
                  </TableHead>
                )}
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Сума
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5 text-right">
                  Статус
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {format(new Date(sale.saleDate), "dd MMM yyyy", {
                          locale: bg,
                        })}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(sale.saleDate), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {getClientName(sale)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            {item.name || "Услуга"}{" "}
                            {item.quantity > 1 ? (
                              <span className="text-xs text-zinc-400 font-normal">
                                x{item.quantity}
                              </span>
                            ) : null}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  {showPaymentMethod && (
                    <TableCell className="py-4">
                      <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">
                        {sale.paymentMethod === "Cash"
                          ? "В брой"
                          : sale.paymentMethod || "В брой"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="py-4">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPrice(sale.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {sale.isPaid ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Платено
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20"
                      >
                        Неплатено
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          disabled={isDeleting === sale.id}
                        >
                          {isDeleting === sale.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] rounded-xl"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`${baseRoute}/${sale.id}/receipt`)
                          }
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                          Касова бележка
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`${baseRoute}/${sale.id}`)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          Детайли
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`${baseRoute}/${sale.id}/edit`)
                          }
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(sale.id)}
                          className="flex items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 focus:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Изтрий
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-20 w-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-medium text-lg">
              Няма намерени продажби
            </h3>
            <p className="text-zinc-500 text-sm mt-1 max-w-sm">
              Все още няма регистрирани продажби в тази категория.
            </p>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-zinc-50 dark:divide-zinc-900">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="p-4 flex flex-col gap-3 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {getClientName(sale)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {format(new Date(sale.saleDate), "dd MMM yyyy, HH:mm", {
                    locale: bg,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      disabled={isDeleting === sale.id}
                    >
                      {isDeleting === sale.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`${baseRoute}/${sale.id}/receipt`)
                      }
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                      Касова бележка
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`${baseRoute}/${sale.id}`)}
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      Детайли
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`${baseRoute}/${sale.id}/edit`)
                      }
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                      Редактирай
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(sale.id)}
                      className="flex items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 focus:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Изтрий
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {sale.items && sale.items.length > 0 ? (
                sale.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    {item.name || "Услуга"}{" "}
                    {item.quantity > 1 ? (
                      <strong className="font-semibold text-zinc-900 dark:text-white">
                        x{item.quantity}
                      </strong>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  --
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Badge
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shadow-none ${
                  sale.isPaid
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                }`}
              >
                {sale.isPaid ? "Платено" : "Неплатено"}
              </Badge>
              <div className="text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg text-xs">
                {formatPrice(sale.totalAmount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
