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

  const getClientName = (sale: Sale) => {
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
      <div className="space-y-4 p-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-none dark:border-zinc-900 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 p-6 md:p-8 dark:border-zinc-900">
        <h2 className="flex items-center gap-2 text-xl font-light text-zinc-900 dark:text-zinc-50">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-xs font-light text-zinc-500">{description}</p>
      </div>

      {/* Desktop View */}
      <div className="custom-scrollbar hidden flex-1 overflow-auto md:block">
        {sales.length > 0 ? (
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-50/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-100 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Дата
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Клиент
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Артикули / Услуги
                </TableHead>
                {showPaymentMethod && (
                  <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Плащане
                  </TableHead>
                )}
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Сума
                </TableHead>
                <TableHead className="py-5 text-right text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Статус
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                              <span className="text-xs font-normal text-zinc-400">
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
                        className="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500"
                      >
                        <CheckCircle2 className="mr-1 size-3" />
                        Платено
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500"
                      >
                        Неплатено
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          disabled={isDeleting === sale.id}
                        >
                          {isDeleting === sale.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <MoreVertical className="size-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 rounded-xl"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`${baseRoute}/${sale.id}/receipt`)
                          }
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                        >
                          <Receipt className="size-3.5 text-zinc-500" />
                          Касова бележка
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`${baseRoute}/${sale.id}`)}
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                        >
                          <Eye className="size-3.5 text-zinc-500" />
                          Детайли
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`${baseRoute}/${sale.id}/edit`)
                          }
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                        >
                          <Edit2 className="size-3.5 text-zinc-500" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(sale.id)}
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30"
                        >
                          <Trash2 className="size-3.5" />
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
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900">
              <Receipt className="size-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Няма намерени продажби
            </h3>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Все още няма регистрирани продажби в тази категория.
            </p>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {getClientName(sale)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
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
                      className="size-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      disabled={isDeleting === sale.id}
                    >
                      {isDeleting === sale.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MoreVertical className="size-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`${baseRoute}/${sale.id}/receipt`)
                      }
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                    >
                      <Receipt className="size-3.5 text-zinc-500" />
                      Касова бележка
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`${baseRoute}/${sale.id}`)}
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                    >
                      <Eye className="size-3.5 text-zinc-500" />
                      Детайли
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`${baseRoute}/${sale.id}/edit`)
                      }
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                    >
                      <Edit2 className="size-3.5 text-zinc-500" />
                      Редактирай
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(sale.id)}
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30"
                    >
                      <Trash2 className="size-3.5" />
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
            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Badge
                className={`rounded border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase shadow-none ${
                  sale.isPaid
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400"
                }`}
              >
                {sale.isPaid ? "Платено" : "Неплатено"}
              </Badge>
              <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30">
                {formatPrice(sale.totalAmount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
