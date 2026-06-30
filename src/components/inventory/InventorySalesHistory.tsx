"use client";

import { useEffect, useState } from "react";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { Sale, Member } from "@/types";
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
import {
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Receipt,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteSaleAction } from "@/lib/actions/sales";
import { EditSaleDialog } from "@/components/finances/EditSaleDialog";
import { getAuth } from "firebase/auth";

const InventorySalesHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load sales and members concurrently
        const [fetchedSales, fetchedMembers] = await Promise.all([
          getSales(),
          getAllMembers(),
        ]);

        // Build member ID to name dictionary
        const dict: Record<string, string> = {};
        fetchedMembers.forEach((m: Member) => {
          dict[m.id] = `${m.firstName} ${m.lastName}`;
        });
        setMembersMap(dict);

        const inventorySales = fetchedSales.filter(
          (s) => !s.type || s.type === "inventory"
        );
        setSales(inventorySales);
      } catch (err) {
        setError("Грешка при зареждане на историята на продажбите.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getClientName = (memberId: string) => {
    if (memberId === "GUEST_EXTERNAL") {
      return "Външен клиент";
    }
    return membersMap[memberId] || "Неизвестен член";
  };

  const refetch = async () => {
    try {
      setLoading(true);
      const fetchedSales = await getSales();
      const inventorySales = fetchedSales.filter(
        (s) => !s.type || s.type === "inventory"
      );
      setSales(inventorySales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази продажба?"))
      return;

    setIsDeleting(saleId);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Моля влезте в профила си");
      const idToken = await currentUser.getIdToken();

      const res = await deleteSaleAction(saleId, idToken);
      if (!res.success) throw new Error(res.message || "Грешка при изтриване");

      toast.success("Успех", {
        description: "Продажбата беше изтрита успешно.",
      });
      refetch();
    } catch (error: unknown) {
      toast.error("Грешка", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-none overflow-hidden">
      {saleToEdit && (
        <EditSaleDialog
          sale={saleToEdit}
          isOpen={!!saleToEdit}
          onClose={() => setSaleToEdit(null)}
          onSuccess={() => {
            setSaleToEdit(null);
            refetch();
          }}
        />
      )}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
          История на продажбите
        </h3>
      </div>
      <div className="p-0">
        {loading && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium animate-pulse">
            Зареждане на продажбите...
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-rose-400 font-medium">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                      Дата
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                      Купувач / Клиент
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                      Продадени Артикули
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                      Начин на плащане
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                      Статус
                    </TableHead>
                    <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6 text-right">
                      Сума
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <TableCell className="px-6 py-4 text-[11px] font-medium text-zinc-400">
                        {new Date(sale.saleDate).toLocaleString("bg-BG")}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {getClientName(sale.memberId)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-light text-zinc-650 dark:text-zinc-350">
                        <div className="flex flex-col gap-1">
                          {sale.items && sale.items.length > 0 ? (
                            sale.items.map((item, idx) => (
                              <span key={idx}>
                                {item.name}{" "}
                                <strong className="font-semibold text-zinc-900 dark:text-white">
                                  x{item.quantity}
                                </strong>
                              </span>
                            ))
                          ) : (
                            <span>--</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 font-light">
                        {sale.paymentMethod === "Cash"
                          ? "В брой"
                          : sale.paymentMethod || "В брой"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
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
                      <TableCell className="px-6 py-4 text-right font-semibold text-sm text-zinc-900 dark:text-white">
                        {formatPrice(sale.totalAmount)}
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
                                router.push(
                                  `/inventory/sales/${sale.id}/receipt`
                                )
                              }
                              className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                            >
                              <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                              Касова бележка
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/inventory/sales/${sale.id}`)
                              }
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
            </div>
            <div className="md:hidden divide-y divide-zinc-50 dark:divide-zinc-900">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 flex flex-col gap-3 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {getClientName(sale.memberId)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(sale.saleDate).toLocaleString("bg-BG")}
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
                        <DropdownMenuContent
                          align="end"
                          className="w-[160px] rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/inventory/sales/${sale.id}/receipt`)
                            }
                            className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                          >
                            <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                            Касова бележка
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/inventory/sales/${sale.id}`)
                            }
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
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {sale.items && sale.items.length > 0 ? (
                      sale.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          {item.name}{" "}
                          <strong className="font-semibold text-zinc-900 dark:text-white">
                            x{item.quantity}
                          </strong>
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
          </>
        )}
        {!loading && sales.length === 0 && (
          <div className="p-12 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium">
            Няма регистрирани продажби.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySalesHistory;
