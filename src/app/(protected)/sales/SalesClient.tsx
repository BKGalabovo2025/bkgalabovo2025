"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInventorySales } from "@/hooks/useInventorySales";
import { useMembers } from "@/hooks/useMembers";
import { deleteSale } from "@/services/sales-service";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
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
  ShoppingCart,
  Receipt,
  User,
  Calendar,
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
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

export default function SalesClient() {
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
        ? memberMap.get(sale.memberId) || "Unknown Member"
        : "Walk-in Customer",
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
    router.push(`/sales/${saleId}/receipt`);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Продажби"
        description="Проследяване на продажби на инвентар, напитки и услуги в реално време."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби" },
        ]}
      >
        <Button
          onClick={() => router.push("/sales/new")}
          className="rounded-xl shadow-md font-bento"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Нова продажба
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BentoCard className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black">{sortedSales.length}</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Общо транзакции
              </p>
            </div>
            <ShoppingCart className="h-5 w-5 text-primary/50" />
          </div>
        </BentoCard>
        <BentoCard className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-3xl font-black">
                {sortedSales.filter((s) => !s.isPaid).length}
              </p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Висящи плащания
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-500/50" />
          </div>
        </BentoCard>
        <BentoCard className="md:col-span-2 p-6 flex items-center bg-primary text-white border-none shadow-xl shadow-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/70 font-bold uppercase tracking-widest text-[10px]">
                Дневен оборот
              </p>
              <p className="text-2xl font-black">Общо за деня</p>
            </div>
          </div>
        </BentoCard>
      </div>

      <BentoCard className="overflow-hidden border-none shadow-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Зареждане на продажби...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-24 text-rose-500 flex flex-col items-center">
            <AlertTriangle className="h-10 w-10 mb-4 opacity-50" />
            <p className="font-bold">
              {error || "An error occurred while loading the sales."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 px-6">
                    Дата и Час
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">
                    Клиент
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">
                    Статус
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-right">
                    Сума
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSales.length > 0 ? (
                  sortedSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      onClick={() => handleRowClick(sale.id)}
                      className="cursor-pointer group border-slate-50 hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          <span className="font-medium text-slate-600">
                            {new Date(sale.saleDate).toLocaleString("bg-BG")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-300" />
                          <span className="font-black font-bento text-slate-800">
                            {sale.memberName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            sale.isPaid
                              ? "bg-emerald-50 text-emerald-700 border-none rounded-lg font-black text-[10px] uppercase"
                              : "bg-amber-50 text-amber-700 border-none rounded-lg font-black text-[10px] uppercase"
                          }
                        >
                          {sale.isPaid ? "Платено" : "Висящо"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-slate-900">
                        {formatPrice(sale.totalAmount)}
                      </TableCell>
                      <TableCell
                        className="text-right px-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg group-hover:bg-white group-hover:shadow-sm"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl shadow-xl border-slate-100"
                          >
                            <DropdownMenuItem
                              className="text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer font-bold rounded-lg"
                              onSelect={() => setSaleToDelete(sale.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Изтрий</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <ShoppingCart className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Все още няма продажби
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </BentoCard>

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black font-bento">
              Сигурни ли сте?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">
              Това действие ще изтрие записа на продажбата за постоянно. Ако
              това е продажба на инвентар, наличностите няма да се възстановят
              автоматично.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-bold shadow-lg shadow-rose-100"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
