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
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
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
    if (!confirm("Сигурни ли сте, че искате да изтриете този пакет?")) return;

    setIsProcessing(id);
    try {
      const res = await deleteRecoveryPackageAction(idToken, id);
      if (!res.success) throw new Error(res.error);
      toast.success("Изтрит", { description: "Пакетът беше изтрит успешно." });
      if (refetch) refetch();
    } catch (error: any) {
      toast.error("Грешка", { description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-indigo-500" />
            Закупени Пакети
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-light">
            Проследяване на пакетите и оставащите сесии на клиентите.
          </p>
        </div>
        <Button
          onClick={() =>
            toast.info("Предстои добавяне", {
              description: "Функцията за ръчно добавяне се разработва.",
            })
          }
          className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full h-10 px-4 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добави Пакет
        </Button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {clientPackages.length > 0 ? (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Клиент
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Пакет
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5 text-center">
                  Оставащи
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5 text-right">
                  Статус
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientPackages.map((pkg) => (
                <TableRow
                  key={pkg.id}
                  className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
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
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        {pkg.packageName || "Пакет"}
                      </span>
                      {pkg.purchaseDate && (
                        <span className="text-xs text-zinc-400 mt-1">
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
                      <span className="text-xs text-zinc-400 font-light mt-1">
                        / {pkg.sessionsTotal}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {pkg.status === "active" && pkg.sessionsRemaining > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Активен
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Изчерпан
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
                          disabled={isProcessing === pkg.id}
                        >
                          {isProcessing === pkg.id ? (
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
                          onClick={() => handleDelete(pkg.id)}
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
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <PackageSearch
              className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mb-4"
              strokeWidth={1}
            />
            <p className="text-zinc-500 text-sm font-light">
              Няма намерени пакети.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
