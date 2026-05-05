"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteSale, getSaleById, updateSale } from "@/services/sales-service";
import { getMemberById } from "@/services/member-service";
import { Sale, Member } from "@/types";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  ShoppingCart,
  Trash2,
  CheckCheck,
  FilePenLine,
  Receipt,
  Calendar,
  Hash,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

export default function SaleDetailsClient() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      const fetchSaleData = async () => {
        try {
          setLoading(true);
          const saleData = await getSaleById(saleId);
          setSale(saleData);
          if (saleData?.memberId) {
            const memberData = await getMemberById(saleData.memberId);
            setMember(memberData);
          } else {
            setMember(null);
          }
        } catch (error) {
          console.error("Error loading sale data:", error);
          toast.error("Неуспешно зареждане на данните.");
        } finally {
          setLoading(false);
        }
      };
      fetchSaleData();
    }
  }, [saleId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSale(saleId);
      toast.success("Продажбата беше изтрита успешно.");
      router.push("/sales");
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Възникна грешка при изтриването.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsUpdatingStatus(true);
    try {
      await updateSale(saleId, { status: "completed", isPaid: true });
      setSale((prevSale) =>
        prevSale ? { ...prevSale, status: "completed", isPaid: true } : null
      );
      toast.success("Плащането беше регистрирано успешно.");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Възникна грешка при актуализирането.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
        <p className="text-slate-400 font-bold">Продажбата не беше намерена.</p>
        <Button variant="link" onClick={() => router.push("/sales")}>
          Назад към продажби
        </Button>
      </div>
    );
  }

  const isPaid = sale.isPaid;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={`Детайли на продажба`}
        description={`Управление и преглед на продажба #${sale.id.substring(0, 8)}.`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Детайли" },
        ]}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sales/${saleId}/receipt`)}
            className="rounded-xl"
          >
            <Receipt className="mr-2 h-4 w-4" /> Касова бележка
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/sales/${saleId}/edit`)}
            className="rounded-xl"
          >
            <FilePenLine className="mr-2 h-4 w-4" /> Редакция
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="rounded-xl">
                <Trash2 className="mr-2 h-4 w-4" /> Изтрий
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl">
                  Сигурни ли сте?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-medium">
                  Това действие е необратимо. Наличностите в склада ще бъдат
                  възстановени.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">
                  Отказ
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl font-bold bg-red-500 hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Потвърди изтриването
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BentoCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Списък с артикули</h3>
              </div>
              <Badge
                variant="outline"
                className="font-black bg-white shadow-sm"
              >
                {sale.items.length} продукта
              </Badge>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-slate-50">
                {sale.items.map((item, index) => (
                  <li
                    key={item.productId || index}
                    className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-black text-slate-700">{item.name}</p>
                      <p className="text-sm font-bold text-slate-400">
                        {item.quantity} бр. x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-black text-lg">
                      {formatPrice(item.quantity * item.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">
                  Обща сума
                </p>
                <p className="text-3xl font-black">
                  {formatPrice(sale.totalAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">
                  Валута
                </p>
                <p className="font-black text-xl">{sale.currency || "EUR"}</p>
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="space-y-6">
          <BentoCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg font-bento">Клиент</h3>
            </div>
            {sale.memberId && member ? (
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <Avatar className="h-14 w-14 border-4 border-white shadow-sm">
                  <AvatarImage
                    src={member.avatarUrl ?? undefined}
                    alt={`${member.firstName} ${member.lastName}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-black">
                    {member.firstName && member.lastName
                      ? `${member.firstName[0]}${member.lastName[0]}`
                      : "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-black text-slate-700 truncate">
                    {member.firstName} {member.lastName}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-bold text-xs"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    Виж профил
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed text-center">
                <p className="text-slate-400 font-bold text-sm">
                  Клиент от улицата
                </p>
              </div>
            )}
          </BentoCard>

          <BentoCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg font-bento">Плащане</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Статус</span>
                <Badge
                  variant={isPaid ? "success" : "destructive"}
                  className="text-xs px-3 py-1 font-black shadow-sm"
                >
                  {isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                </Badge>
              </div>

              {!isPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={isUpdatingStatus}
                  className="w-full h-11 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 mt-2 transition-all active:scale-95"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 h-4 w-4" />
                  )}
                  Маркирай като платено
                </Button>
              )}
            </div>
          </BentoCard>

          <BentoCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Hash className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg font-bento">Инфо</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest leading-none">
                    Дата
                  </p>
                  <p className="font-bold text-sm">
                    {new Date(sale.saleDate).toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Hash className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest leading-none">
                    ID Продажба
                  </p>
                  <p className="font-bold text-[10px] text-slate-400 font-mono">
                    {sale.id}
                  </p>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
