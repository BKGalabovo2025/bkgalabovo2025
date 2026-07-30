"use client";

import {
  AlertTriangle,
  Calendar,
  Loader2,
  MoreVertical,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
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
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
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
import { deleteSaleAction } from "@/lib/actions/sales";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Member, Sale } from "@/types";

interface SalesClientProps {
  initialSales: Sale[];
  initialMembers: Member[];
  showPageHeader?: boolean;
}

export default function SalesClient({
  initialSales,
  initialMembers,
  showPageHeader = true,
}: SalesClientProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const [sales, setSales] = useState<Sale[]>(initialSales);
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

  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 py-32">
          <Loader2
            className="size-10 animate-spin text-zinc-200"
            strokeWidth={1}
          />
          <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
            Зареждане на продажби...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center py-32 text-center text-rose-500">
          <AlertTriangle className="mb-6 size-10 opacity-30" strokeWidth={1} />
          <p className="text-sm font-light tracking-widest uppercase">
            {error || "An error occurred while loading the sales."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="h-16 border-none hover:bg-transparent">
              <TableHead className="px-8 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                Дата и Час
              </TableHead>
              <TableHead className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                Клиент
              </TableHead>
              <TableHead className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                Статус
              </TableHead>
              <TableHead className="pr-8 text-right text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                Сума
              </TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSales.length > 0 ? (
              sortedSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  onClick={() => handleRowClick(sale.id)}
                  className="group h-20 cursor-pointer border-zinc-50 transition-colors hover:bg-zinc-50/50"
                >
                  <TableCell className="px-8">
                    <div className="flex items-center gap-3">
                      <Calendar
                        className="size-3.5 text-zinc-300"
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
                        className="size-3.5 text-zinc-300"
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
                        "rounded-full border-none px-3 py-1 text-[9px] font-medium tracking-widest uppercase",
                        sale.isPaid
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      )}
                    >
                      {sale.isPaid ? "Платено" : "Висящо"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right text-sm font-medium text-zinc-950 tabular-nums">
                    {formatPrice(sale.totalAmount)}
                  </TableCell>
                  <TableCell
                    className="px-6 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-xl transition-all group-hover:bg-white group-hover:shadow-sm"
                        >
                          <MoreVertical className="size-4 text-zinc-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-40 rounded-3xl border-zinc-100 p-2 shadow-2xl"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer rounded-xl p-3 font-medium text-rose-500 focus:bg-rose-50 focus:text-rose-600"
                          onSelect={() => setSaleToDelete(sale.id)}
                        >
                          <Trash2 className="mr-3 size-4" strokeWidth={1.5} />
                          <span className="text-[11px] tracking-widest uppercase">
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
                    className="mx-auto mb-6 size-12 text-zinc-100"
                    strokeWidth={1}
                  />
                  <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
                    Все още няма продажби
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
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
              className="h-12 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Нова
              продажба
            </Button>
          </PageHeader>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-3xl font-light tracking-tighter">
                    {sortedSales.length}
                  </p>
                  <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Общо транзакции
                  </p>
                </div>
                <ShoppingCart
                  className="size-5 text-zinc-300"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>
            <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-3xl font-light tracking-tighter text-amber-600">
                    {sortedSales.filter((s) => !s.isPaid).length}
                  </p>
                  <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">
                    Висящи плащания
                  </p>
                </div>
                <AlertTriangle
                  className="size-5 text-amber-400"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>
            <BentoCard className="flex items-center rounded-4xl border-none bg-zinc-950 p-8 text-white shadow-none md:col-span-2">
              <div className="flex items-center gap-6">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <Receipt className="size-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="mb-2 text-[9px] tracking-[0.3em] text-zinc-500 uppercase">
                    Дневен оборот
                  </p>
                  <p className="text-xl font-light tracking-tight text-zinc-100">
                    Преглед на приходите за деня
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-zinc-900 uppercase">
              Хроника на плащанията
            </h3>
            <p className="text-[11px] text-zinc-400">
              Преглед и управление на всички регистрирани плащания.
            </p>
          </div>
          <Button
            onClick={() => router.push("/sales/new")}
            className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            <PlusCircle className="mr-2 size-3.5" strokeWidth={1.5} /> Нова
            продажба
          </Button>
        </div>
      )}

      <BentoCard className="overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
        {renderTableContent()}
      </BentoCard>

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent className="rounded-5xl border-none p-8 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium tracking-[0.2em] text-zinc-900 uppercase">
              Сигурни ли сте?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-sm leading-relaxed font-light text-zinc-500">
              Това действие ще изтрие записа на продажбата за постоянно. Ако
              това е продажба на инвентар, наличностите няма да се възстановят
              автоматично.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-zinc-100 px-6 text-[11px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-50">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-12 rounded-xl bg-rose-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-rose-600"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
