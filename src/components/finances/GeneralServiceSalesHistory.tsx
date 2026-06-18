/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { useRouter } from "next/navigation";
import { ShoppingBag, MoreVertical, Edit2, Trash2, Loader2, Receipt, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteGeneralServiceSaleAction } from "@/lib/actions/general-services-server";
import { Sale } from "@/types";
import { EditSaleDialog } from "./EditSaleDialog";

export function GeneralServiceSalesHistory() {
  const { sales, isLoading, refetch } = useGeneralServices();
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [membersLoading, setMembersLoading] = useState(true);

  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

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

  const getClientName = (memberId: string) => {
    if (memberId === "GUEST_EXTERNAL") {
      return "Външен клиент";
    }
    return membersMap[memberId] || "Неизвестен клиент";
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?")) return;
    
    setIsDeleting(saleId);
    try {
      const res = await deleteGeneralServiceSaleAction(saleId);
      if (!res.success) throw new Error(res.error);
      
      toast.success("Успех", { description: "Продажбата беше изтрита успешно." });
      if (refetch) refetch();
    } catch (error: any) {
      toast.error("Грешка", { description: error.message || "Грешка при изтриване." });
    } finally {
      setIsDeleting(null);
    }
  };

  const loading = isLoading || membersLoading;

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900">
        <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-emerald-500" />
          История на продажбите
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-light">
          Списък с всички продадени клубни услуги и техния статус на плащане.
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
                  Плащане
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Статус
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5 text-right">
                  Сума
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
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
                    </span>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {new Date(sale.saleDate).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {getClientName(sale.memberId)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.map((item, idx) => (
                          <span key={idx} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {item.name}{" "}
                            <span className="text-xs text-zinc-400 font-normal">
                              x{item.quantity}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">
                      {sale.paymentMethod === "Cash" ? "В брой" : (sale.paymentMethod || "В брой")}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border shadow-none ${
                        sale.isPaid
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                          : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                      }`}
                    >
                      {sale.isPaid ? "Платено" : "Неплатено"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {formatPrice(sale.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
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
                          onClick={() => router.push(`/finances/general-services/sales/${sale.id}/receipt`)}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                          Касова бележка
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/finances/general-services/sales/${sale.id}`)}
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
            <ShoppingBag className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mb-4" strokeWidth={1} />
            <p className="text-zinc-500 text-sm font-light">Няма регистрирани продажби на услуги.</p>
          </div>
        )}
      </div>

      {saleToEdit && (
        <EditSaleDialog
          sale={saleToEdit}
          isOpen={!!saleToEdit}
          onClose={() => setSaleToEdit(null)}
          onSuccess={() => {
            if (refetch) refetch();
            setSaleToEdit(null);
          }}
        />
      )}
    </div>
  );
}
