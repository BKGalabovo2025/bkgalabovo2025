"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { deleteSaleAction } from "@/lib/actions/sales";
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
import { cn } from "@/lib/utils";

interface SalesClientProps {
  initialSales: any[];
  initialMembers: any[];
  showPageHeader?: boolean;
}

export default function SalesClient({
  initialSales,
  initialMembers,
  showPageHeader = true,
}: SalesClientProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const [sales, setSales] = useState<any[]>(initialSales);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSales(initialSales);
  }, [initialSales]);

  const memberMap = useMemo(() => {
    if (!initialMembers) return new Map();
    return new Map(
      initialMembers.map((member) => [
        member.id,
        `${member.firstName} ${member.lastName}`,
      ])
    );
  }, [initialMembers]);

  const salesWithMemberNames = useMemo(() => {
    return sales.map((sale) => {
      let memberName = "Външен клиент";
      if (sale.memberId === "GUEST_EXTERNAL") {
        memberName = "Външен гост";
      } else if (sale.memberId && sale.memberId !== "Walk-in Customer") {
        memberName = memberMap.get(sale.memberId) || "Неизвестен член";
      }
      return {
        ...sale,
        memberName,
      };
    });
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
    if (!saleToDelete || !idToken) return;
    setIsDeleting(true);

    const originalSales = [...sales];
    // Оптимистично изтриване от UI
    const updatedSales = sales.filter((s) => s.id !== saleToDelete);
    setSales(updatedSales);

    try {
      const result = await deleteSaleAction(saleToDelete, idToken);
      if (result.success) {
        toast.success(result.message || "Продажбата беше изтрита успешно");
        router.refresh();
      } else {
        setSales(originalSales);
        toast.error(result.message || "Грешка при изтриване");
      }
    } catch (error) {
      setSales(originalSales);
      console.error("Error deleting sale:", error);
      toast.error("Грешка при изтриване");
    } finally {
      setIsDeleting(false);
      setSaleToDelete(null);
    }
  };

  const loading = false;
  const error = null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {showPageHeader ? (
        <>
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
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Нова
              продажба
            </Button>
          </PageHeader>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-3xl font-light tracking-tighter mb-2">
                    {sortedSales.length}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                    Общо транзакции
                  </p>
                </div>
                <ShoppingCart
                  className="h-5 w-5 text-zinc-300"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>
            <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-3xl font-light tracking-tighter text-amber-600 mb-2">
                    {sortedSales.filter((s) => !s.isPaid).length}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                    Висящи плащания
                  </p>
                </div>
                <AlertTriangle
                  className="h-5 w-5 text-amber-400"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>
            <BentoCard className="md:col-span-2 p-8 flex items-center bg-zinc-950 text-white border-none shadow-none rounded-4xl">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <Receipt className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-[0.3em] text-[9px] mb-2">
                    Дневен оборот
                  </p>
                  <p className="text-xl font-light text-zinc-100 tracking-tight">
                    Преглед на приходите за деня
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center px-2 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Хроника на плащанията
            </h3>
            <p className="text-[11px] text-zinc-400">
              Преглед и управление на всички регистрирани плащания.
            </p>
          </div>
          <Button
            onClick={() => router.push("/sales/new")}
            className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
          >
            <PlusCircle className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} /> Нова
            продажба
          </Button>
        </div>
      )}

      <BentoCard className="overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <Loader2
              className="h-10 w-10 animate-spin text-zinc-200"
              strokeWidth={1}
            />
            <p className="text-zinc-400 font-medium uppercase tracking-[0.3em] text-[10px]">
              Зареждане на продажби...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-32 text-rose-500 flex flex-col items-center">
            <AlertTriangle
              className="h-10 w-10 mb-6 opacity-30"
              strokeWidth={1}
            />
            <p className="text-sm font-light uppercase tracking-widest">
              {error || "An error occurred while loading the sales."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-none hover:bg-transparent h-16">
                  <TableHead className="font-medium text-[10px] uppercase tracking-[0.2em] text-zinc-400 px-8">
                    Дата и Час
                  </TableHead>
                  <TableHead className="font-medium text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    Клиент
                  </TableHead>
                  <TableHead className="font-medium text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    Статус
                  </TableHead>
                  <TableHead className="font-medium text-[10px] uppercase tracking-[0.2em] text-zinc-400 text-right pr-8">
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
                      className="cursor-pointer group border-zinc-50 hover:bg-zinc-50/50 transition-colors h-20"
                    >
                      <TableCell className="px-8">
                        <div className="flex items-center gap-3">
                          <Calendar
                            className="h-3.5 w-3.5 text-zinc-300"
                            strokeWidth={1.5}
                          />
                          <span className="text-sm font-light text-zinc-600">
                            {new Date(sale.saleDate).toLocaleString("bg-BG")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <User
                            className="h-3.5 w-3.5 text-zinc-300"
                            strokeWidth={1.5}
                          />
                          <span className="text-sm font-medium text-zinc-900">
                            {sale.memberName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-none rounded-full px-3 py-1 text-[9px] uppercase tracking-widest font-medium",
                            sale.isPaid
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          )}
                        >
                          {sale.isPaid ? "Платено" : "Висящо"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-zinc-950 pr-8 tabular-nums">
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
                              className="h-10 w-10 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all"
                            >
                              <MoreVertical className="h-4 w-4 text-zinc-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-3xl shadow-2xl border-zinc-100 p-2 min-w-[160px]"
                          >
                            <DropdownMenuItem
                              className="text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer font-medium rounded-xl p-3"
                              onSelect={() => setSaleToDelete(sale.id)}
                            >
                              <Trash2
                                className="mr-3 h-4 w-4"
                                strokeWidth={1.5}
                              />
                              <span className="text-[11px] uppercase tracking-widest">
                                Изтрий
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center">
                      <ShoppingCart
                        className="h-12 w-12 text-zinc-100 mx-auto mb-6"
                        strokeWidth={1}
                      />
                      <p className="text-zinc-400 font-medium uppercase tracking-[0.3em] text-[10px]">
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
        <AlertDialogContent className="rounded-5xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium uppercase tracking-[0.2em] text-zinc-900">
              Сигурни ли сте?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-light text-zinc-500 mt-4 leading-relaxed">
              Това действие ще изтрие записа на продажбата за постоянно. Ако
              това е продажба на инвентар, наличностите няма да се възстановят
              автоматично.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl border-zinc-100 h-12 px-6 font-medium text-[11px] uppercase tracking-widest hover:bg-zinc-50 transition-all">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl h-12 px-8 font-medium text-[11px] uppercase tracking-widest shadow-none transition-all"
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
