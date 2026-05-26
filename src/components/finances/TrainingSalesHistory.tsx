"use client";

import { useState, useEffect } from "react";
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
import { useTrainingServices } from "@/hooks/useTrainingServices";
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Receipt,
  Eye,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllMembers } from "@/services/member-service";
import { Member, Sale } from "@/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteSaleAction } from "@/lib/actions/sales";
import { EditSaleDialog } from "./EditSaleDialog";

export function TrainingSalesHistory() {
  const { sales, isLoading, refetch } = useTrainingServices();
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [membersLoading, setMembersLoading] = useState(true);

  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();
  const { idToken } = useAuth();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const fetchedMembers = await getAllMembers();
        const dict: Record<string, string> = {};
        fetchedMembers.forEach((m: Member) => {
          dict[m.id] = `${m.firstName} ${m.lastName}`;
        });
        setMembersMap(dict);
      } catch (err) {
        console.error("Грешка при зареждане на членове", err);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const getClientName = (sale: any) => {
    if (sale.clientName) return sale.clientName;
    if (sale.memberId === "GUEST_EXTERNAL") return "Гост";
    return membersMap[sale.memberId] || "Гост";
  };
  if (isLoading || membersLoading) {
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

  const handleDeleteSale = async (saleId: string) => {
    if (!idToken) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    setIsDeleting(saleId);
    try {
      const res = await deleteSaleAction(saleId, idToken);
      if (!res.success) throw new Error(res.message || "Грешка при изтриване.");

      toast.success("Успех", {
        description: "Продажбата беше изтрита успешно.",
      });
      if (refetch) refetch();
    } catch (error: any) {
      toast.error("Грешка", {
        description: error.message || "Грешка при изтриване.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900">
        <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-emerald-500" />
          История на продажбите
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-light">
          Проследяване на всички реализирани продажби на тренировки и
          абонаменти.
        </p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
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
                  Услуга
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
                    <div className="flex flex-col">
                      {sale.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          {item.name || "Тренировка"}{" "}
                          {item.quantity > 1 ? `(x${item.quantity})` : ""}
                        </span>
                      ))}
                    </div>
                  </TableCell>
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
                        className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
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
                            router.push(`/sales/${sale.id}/receipt`)
                          }
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                          Касова бележка
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/sales/${sale.id}`)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          Детайли
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSaleToEdit(sale)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                          Редактирай
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSale(sale.id)}
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
            <ShoppingCart
              className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mb-4"
              strokeWidth={1}
            />
            <p className="text-zinc-500 text-sm font-light">
              Няма намерени продажби.
            </p>
          </div>
        )}
      </div>

      <EditSaleDialog
        isOpen={!!saleToEdit}
        onClose={() => setSaleToEdit(null)}
        sale={saleToEdit}
        onSuccess={() => {
          if (refetch) refetch();
          setSaleToEdit(null);
        }}
      />
    </div>
  );
}
