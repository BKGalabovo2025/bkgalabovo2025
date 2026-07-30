"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Loader2,
  MoreVertical,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import {
  deleteReservationAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";
import { formatPrice } from "@/lib/currency";

export function RecoveryReservationsHistory() {
  const { reservations, isLoading, refetch } = useRecoveryServices();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { idToken } = useAuth();

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

  const handleDelete = async (id: string) => {
    if (!idToken) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете тази резервация?"))
      return;

    setIsProcessing(id);
    try {
      const res = await deleteReservationAction(idToken, id);
      if (!res.success) throw new Error(res.message);
      toast.success("Изтрита", {
        description: "Резервацията беше изтрита успешно.",
      });
      if (refetch) refetch();
    } catch (error: unknown) {
      toast.error("Грешка", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!idToken) return;
    if (!confirm("Маркиране на тази резервация като платена?")) return;

    setIsProcessing(id);
    try {
      const res = await markReservationAsPaidAction(idToken, id);
      if (!res.success) throw new Error(res.message);
      toast.success("Платена", {
        description: "Резервацията е маркирана като платена.",
      });
      if (refetch) refetch();
    } catch (error: unknown) {
      toast.error("Грешка", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 p-6 md:p-8 dark:border-zinc-900">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-light text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="size-5 text-indigo-500" />
            История на резервациите
          </h2>
          <p className="mt-1 text-xs font-light text-zinc-500">
            Проследяване на запазените часове от клиенти.
          </p>
        </div>
      </div>

      <div className="custom-scrollbar hidden flex-1 overflow-auto md:block">
        {reservations.length > 0 && (
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-50/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-100 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Дата и Час
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Клиент
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Процедура
                </TableHead>
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
              {reservations.map((res) => (
                <TableRow
                  key={res.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {format(new Date(res.startTime), "dd MMM yyyy", {
                          locale: bg,
                        })}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(res.startTime), "HH:mm")} -{" "}
                        {format(new Date(res.endTime), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {res.clientName}
                        {res.client2Name ? ` & ${res.client2Name}` : ""}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {res.clientPhone || "Няма телефон"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {res.sessionName || "Процедура"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPrice(res.totalPrice ?? res.price ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {res.status === "paid" ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500"
                      >
                        <CheckCircle2 className="mr-1 size-3" />
                        Платена
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-500"
                      >
                        <XCircle className="mr-1 size-3" />
                        Неплатена
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
                          disabled={isProcessing === res.id}
                        >
                          {isProcessing === res.id ? (
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
                        {res.status !== "paid" && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAsPaid(res.id)}
                            className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                          >
                            <DollarSign className="size-3.5 text-emerald-500" />
                            Маркирай платена
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(res.id)}
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
        )}
      </div>

      <div className="custom-scrollbar flex-1 divide-y divide-zinc-50 overflow-auto md:hidden dark:divide-zinc-900">
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div
              key={res.id}
              className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {format(new Date(res.startTime), "dd MMM yyyy", {
                      locale: bg,
                    })}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {format(new Date(res.startTime), "HH:mm")} -{" "}
                    {format(new Date(res.endTime), "HH:mm")}
                  </span>
                </div>
                {res.status === "paid" ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    Платена
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-rose-600 uppercase dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-500"
                  >
                    <XCircle className="mr-1 size-3" />
                    Неплатена
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {res.clientName}
                  {res.client2Name ? ` & ${res.client2Name}` : ""}
                </span>
                <span className="text-xs text-zinc-500">
                  {res.clientPhone || "Няма телефон"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Процедура</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {res.sessionName || "Процедура"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500">
                    {formatPrice(res.totalPrice ?? res.price ?? 0)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        disabled={isProcessing === res.id}
                      >
                        {isProcessing === res.id ? (
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
                      {res.status !== "paid" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsPaid(res.id)}
                          className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                        >
                          <DollarSign className="size-3.5 text-emerald-500" />
                          Маркирай платена
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(res.id)}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30"
                      >
                        <Trash2 className="size-3.5" />
                        Изтрий
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CalendarDays
              className="mb-4 size-10 text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />
            <p className="text-sm font-light text-zinc-500">
              Няма намерени резервации.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
