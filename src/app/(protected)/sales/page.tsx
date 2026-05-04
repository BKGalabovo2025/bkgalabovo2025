"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInventorySales } from "@/hooks/useInventorySales";
import { useMembers } from "@/hooks/useMembers";
import { deleteSale } from "@/services/sales-service";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PlusCircle,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Pencil,
  Eye,
  ShoppingCart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const SalesListPage = () => {
  const router = useRouter();
  const {
    sales,
    loading: salesLoading,
    error: salesError,
    refetch,
  } = useInventorySales();
  const {
    members,
    loading: membersLoading,
    error: membersError,
  } = useMembers();
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const memberMap = useMemo(() => {
    if (!members) return new Map();
    return new Map(
      members.map((member) => [
        member.id,
        `${member.firstName} ${member.lastName}`,
      ])
    );
  }, [members]);

  const salesWithMemberNames = useMemo(() => {
    return sales.map((sale) => ({
      ...sale,
      memberName: sale.memberId
        ? memberMap.get(sale.memberId) || "Неизвестен член"
        : "Клиент на място",
    }));
  }, [sales, memberMap]);

  const sortedSales = useMemo(() => {
    return [...salesWithMemberNames].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
    });
  }, [salesWithMemberNames]);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSale(saleToDelete);
      toast.success("Продажбата беше изтрита успешно");
      refetch();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Грешка при изтриване");
    } finally {
      setIsDeleting(false);
      setSaleToDelete(null);
    }
  };

  const loading = salesLoading || membersLoading;
  const error = salesError || membersError;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 rounded-2xl">
               <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
             </div>
             <h1 className="text-4xl font-black tracking-tight font-heading text-zinc-900 dark:text-white">
               Продажби
             </h1>
          </div>
          <p className="text-zinc-500 text-lg font-medium">История на транзакциите и продажбите на продукти.</p>
        </div>
        <Button onClick={() => router.push("/sales/new")} className="h-14 px-10 rounded-[1.2rem] bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all font-bold text-lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Нова продажба
        </Button>
      </div>

      <div className="glass rounded-[2.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Зареждане на архива...</p>
            </div>
          ) : error ? (
            <div className="text-center py-32 text-red-500 flex flex-col items-center">
              <AlertTriangle className="h-16 w-16 mb-4 opacity-50 text-red-500" />
              <p className="font-black text-xl font-heading">{error || "Грешка при зареждане"}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-6 rounded-xl">Опитай отново</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="border-zinc-200 dark:border-zinc-800/50 hover:bg-transparent">
                    <TableHead className="font-black text-zinc-500 uppercase text-[10px] tracking-widest pl-10 py-6">Дата и Час</TableHead>
                    <TableHead className="font-black text-zinc-500 uppercase text-[10px] tracking-widest py-6">Клиент</TableHead>
                    <TableHead className="font-black text-zinc-500 uppercase text-[10px] tracking-widest py-6">Статус</TableHead>
                    <TableHead className="text-right font-black text-zinc-500 uppercase text-[10px] tracking-widest py-6">Обща сума</TableHead>
                    <TableHead className="w-[80px] pr-10 py-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSales.length > 0 ? (
                    sortedSales.map((sale) => (
                      <TableRow
                        key={sale.id}
                        onClick={() => handleRowClick(sale.id)}
                        className="cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-500/5 border-zinc-100 dark:border-zinc-800/50 transition-colors group"
                      >
                        <TableCell className="pl-10 py-6 font-bold text-zinc-500 text-sm">
                          {new Date(sale.saleDate).toLocaleString("bg-BG", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell className="font-black text-zinc-900 dark:text-zinc-100 text-lg font-heading">
                          {sale.memberName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none ${
                              sale.isPaid 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            }`}
                          >
                            {sale.isPaid ? "ПЛАТЕНО" : "ВИСЯЩО"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-6 font-black text-2xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {formatPrice(sale.totalAmount)}
                        </TableCell>
                        <TableCell
                          className="text-right pr-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                                <MoreVertical className="h-6 w-6 text-zinc-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-zinc-200 dark:border-zinc-800 shadow-2xl min-w-[200px]">
                              <DropdownMenuItem
                                className="focus:bg-blue-50 dark:focus:bg-blue-500/10 cursor-pointer font-black rounded-xl p-3 mb-1"
                                onSelect={() => handleRowClick(sale.id)}
                              >
                                <Eye className="mr-3 h-5 w-5 text-blue-500" />
                                <span>Детайли</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="focus:bg-zinc-50 dark:focus:bg-zinc-800/50 cursor-pointer font-black rounded-xl p-3 mb-1"
                                onSelect={() => router.push(`/sales/${sale.id}/receipt`)}
                              >
                                <Eye className="mr-3 h-5 w-5 text-emerald-500" />
                                <span>Разписка</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="focus:bg-zinc-50 dark:focus:bg-zinc-800/50 cursor-pointer font-black rounded-xl p-3 mb-1"
                                onSelect={() => router.push(`/sales/${sale.id}/edit`)}
                              >
                                <Pencil className="mr-3 h-5 w-5 text-amber-500" />
                                <span>Редактирай</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer font-black rounded-xl p-3"
                                onSelect={() => setSaleToDelete(sale.id)}
                              >
                                <Trash2 className="mr-3 h-5 w-5 text-red-500" />
                                <span>Изтрий</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-96 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <ShoppingCart className="h-24 w-24 mb-6" />
                          <p className="text-2xl font-black font-heading uppercase tracking-widest">Няма продажби</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-3xl font-heading">Изтриване</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Сигурни ли сте? Това действие ще изтрие записа за постоянно. 
              <span className="block mt-4 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 font-bold text-red-600 dark:text-red-400">
                Внимание: Наличностите няма да се възстановят автоматично!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl px-8 h-12 font-bold border-zinc-200">Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-2xl bg-red-600 text-white hover:bg-red-700 h-12 px-8 font-bold shadow-lg shadow-red-500/20 transition-all"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Да, изтрий записа
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesListPage;
