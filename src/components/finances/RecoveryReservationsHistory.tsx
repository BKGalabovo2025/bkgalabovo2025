"use client";

import { useState } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/currency";
import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Loader2,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteReservationAction,
  markReservationAsPaidAction,
} from "@/lib/actions/reservations";

export function RecoveryReservationsHistory() {
  const { reservations, isLoading, refetch } = useRecoveryServices();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { idToken } = useAuth();

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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            История на резервациите
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-light">
            Проследяване на запазените часове от клиенти.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar hidden md:block">
        {reservations.length > 0 && (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Дата и Час
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Клиент
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Процедура
                </TableHead>
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
              {reservations.map((res) => (
                <TableRow
                  key={res.id}
                  className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
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
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
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
                        className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Платена
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Неплатена
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
                          disabled={isProcessing === res.id}
                        >
                          {isProcessing === res.id ? (
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
                        {res.status !== "paid" && (
                          <DropdownMenuItem
                            onClick={() => handleMarkAsPaid(res.id)}
                            className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                            Маркирай платена
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(res.id)}
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
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar md:hidden divide-y divide-zinc-50 dark:divide-zinc-900">
        {reservations.length > 0 ? (
          reservations.map((res) => (
            <div
              key={res.id}
              className="p-4 flex flex-col gap-3 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
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
                    className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Платена
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Неплатена
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {res.clientName}
                  {res.client2Name ? ` & ${res.client2Name}` : ""}
                </span>
                <span className="text-xs text-zinc-500">
                  {res.clientPhone || "Няма телефон"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">Процедура</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {res.sessionName || "Процедура"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                    {formatPrice(res.totalPrice ?? res.price ?? 0)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        disabled={isProcessing === res.id}
                      >
                        {isProcessing === res.id ? (
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
                      {res.status !== "paid" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsPaid(res.id)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                          Маркирай платена
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(res.id)}
                        className="flex items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 focus:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Изтрий
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <CalendarDays
              className="h-10 w-10 text-zinc-200 dark:text-zinc-800 mb-4"
              strokeWidth={1}
            />
            <p className="text-zinc-500 text-sm font-light">
              Няма намерени резервации.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
