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
import { useRecoveryServices } from "@/hooks/useRecoveryServices";
import {
  PackageSearch,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Loader2,
  Plus,
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
import { deleteRecoveryPackageAction } from "@/lib/actions/recovery-services-server";

export function RecoveryClientPackages() {
  const { clientPackages, isLoading, refetch } = useRecoveryServices();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { idToken } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3].map((i) => (
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
    if (!confirm("Сигурни ли сте, че искате да изтриете този пакет?")) return;

    setIsProcessing(id);
    try {
      const res = await deleteRecoveryPackageAction(idToken, id);
      if (!res.success) throw new Error(res.error);
      toast.success("Изтрит", { description: "Пакетът беше изтрит успешно." });
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
            <PackageSearch className="size-5 text-indigo-500" />
            Закупени Пакети
          </h2>
          <p className="mt-1 text-xs font-light text-zinc-500">
            Проследяване на пакетите и оставащите сесии на клиентите.
          </p>
        </div>
        <Button
          onClick={() =>
            toast.info("Предстои добавяне", {
              description: "Функцията за ръчно добавяне се разработва.",
            })
          }
          className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
        >
          <Plus className="mr-2 size-4" />
          Добави Пакет
        </Button>
      </div>

      <div className="custom-scrollbar hidden flex-1 overflow-auto md:block">
        {clientPackages.length > 0 && (
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-50/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-100 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Клиент
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Пакет
                </TableHead>
                <TableHead className="py-5 text-center text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Оставащи
                </TableHead>
                <TableHead className="py-5 text-right text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Статус
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientPackages.map((pkg) => (
                <TableRow
                  key={pkg.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {pkg.clientName}
                        {pkg.client2Name ? ` & ${pkg.client2Name}` : ""}
                      </span>
                      {pkg.clientPhone && (
                        <span className="text-xs text-zinc-400">
                          {pkg.clientPhone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {pkg.packageName || "Пакет"}
                      </span>
                      {pkg.purchaseDate && (
                        <span className="mt-1 text-xs text-zinc-400">
                          Закупен:{" "}
                          {format(new Date(pkg.purchaseDate), "dd MMM yyyy", {
                            locale: bg,
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {pkg.sessionsRemaining}
                      </span>
                      <span className="mt-1 text-xs font-light text-zinc-400">
                        / {pkg.sessionsTotal}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {pkg.status === "active" && pkg.sessionsRemaining > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500"
                      >
                        <CheckCircle2 className="mr-1 size-3" />
                        Активен
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-500"
                      >
                        <XCircle className="mr-1 size-3" />
                        Изчерпан
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
                          disabled={isProcessing === pkg.id}
                        >
                          {isProcessing === pkg.id ? (
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
                          onClick={() => handleDelete(pkg.id)}
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
        {clientPackages.length > 0 ? (
          clientPackages.map((pkg) => (
            <div key={pkg.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {pkg.clientName}
                    {pkg.client2Name ? ` & ${pkg.client2Name}` : ""}
                  </span>
                  {pkg.clientPhone && (
                    <span className="text-xs text-zinc-400">
                      {pkg.clientPhone}
                    </span>
                  )}
                </div>
                {pkg.status === "active" && pkg.sessionsRemaining > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-500"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    Активен
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-rose-100 bg-rose-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-rose-600 uppercase dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-500"
                  >
                    <XCircle className="mr-1 size-3" />
                    Изчерпан
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {pkg.packageName || "Пакет"}
                  </span>
                  {pkg.purchaseDate && (
                    <span className="mt-1 text-xs text-zinc-400">
                      Закупен:{" "}
                      {format(new Date(pkg.purchaseDate), "dd MMM yyyy", {
                        locale: bg,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                    Оставащи
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {pkg.sessionsRemaining}
                    </span>
                    <span className="text-xs text-zinc-400">
                      / {pkg.sessionsTotal}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      disabled={isProcessing === pkg.id}
                    >
                      {isProcessing === pkg.id ? (
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
                      onClick={() => handleDelete(pkg.id)}
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30"
                    >
                      <Trash2 className="size-3.5" />
                      Изтрий
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PackageSearch
              className="mb-4 size-10 text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />
            <p className="text-sm font-light text-zinc-500">
              Няма намерени пакети.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
